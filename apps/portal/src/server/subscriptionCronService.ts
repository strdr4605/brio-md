import { eq, and, ne, inArray, or, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  invoices,
  students,
  groups,
  courses,
  studentGroupEnrollments,
} from "@/db/schema";
import { BillingUser, getBillingRoles } from "./billingService";
import {
  parseTargetMonth,
  calculateSubscriptionPrice,
  generateRecurringInvoices,
} from "./recurringBillingService";

/** Параметры вызова кронжоба проверки подписок */
export type SubscriptionCheckOptions = {
  targetMonth?: string;       // Целевой месяц аудита (YYYY-MM), по умолчанию текущий
  schoolId?: number;          // ID школы (для фильтрации по конкретному филиалу)
  autoCreateMissing?: boolean;// Автоматически генерировать черновики счетов, если они отсутствуют
  markOverdue?: boolean;      // Переводить просроченные счета (dueDate < today) в статус 'overdue'
  user?: BillingUser;         // Контекст пользователя (для проверки ролей и прав доступа)
};

/** Детальная информация по подписке конкретного ученика */
export type StudentSubscriptionDetail = {
  studentId: number;
  studentName: string;
  schoolId: number;
  groupId: number;
  groupName: string;
  courseId: number | null;
  courseName: string;
  enrollmentId: number;
  billingType: string;
  monthlyFee: number;
  hasInvoice: boolean;
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceStatus: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "no_invoice";
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  dueDate: string | null;
  isOverdue: boolean;
  statusComment: string;
};

/** Финансовая и количественная сводка по итогам аудита месяца */
export type SubscriptionAuditSummary = {
  targetMonth: string;
  checkedAt: string;
  totalActiveSubscriptions: number; // Всего активных ежемесячных подписок
  upToDateCount: number;             // Оплачено в полном объёме
  partiallyPaidCount: number;        // Частично оплачено
  unpaidCount: number;               // Выставлено, срок оплаты ещё не истёк
  overdueCount: number;              // Просрочено (срок истёк, долг не закрыт)
  missingInvoiceCount: number;       // Активные ученики без выставленного счёта на этот месяц
  invoicesMarkedOverdue: number;     // Количество счетов, переведённых в статус 'overdue'
  invoicesAutoCreated: number;       // Количество автоматически созданных счетов
  totalExpectedRevenue: number;      // Ожидаемый совокупный доход по тарифам учеников
  totalBilledAmount: number;         // Сумма по всем выставленным счетам
  totalCollectedAmount: number;      // Фактически собранная сумма оплат
  totalOutstandingDebt: number;      // Суммарный остаток долга
};

export type SubscriptionCheckResult = {
  success: boolean;
  summary: SubscriptionAuditSummary;
  students: StudentSubscriptionDetail[];
  markedOverdueInvoiceIds: number[];
  autoCreatedInvoiceIds: number[];
};

/**
 * Основная функция аудита абонементов:
 * Проверяет подписки учеников, выявляет должников, обновляет просроченные счета и считает баланс.
 */
export async function runMonthlySubscriptionCheck(
  dbInstance: typeof db,
  options: SubscriptionCheckOptions = {},
): Promise<SubscriptionCheckResult> {
  // ШАГ 1: Инициализация временного окна (целевой месяц YYYY-MM и сегодняшняя дата)
  const now = new Date();
  const defaultMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const targetMonth = options.targetMonth || defaultMonth;
  const { periodStart } = parseTargetMonth(targetMonth);
  const todayStr = now.toISOString().slice(0, 10);

  // Определение контекста школы с учётом прав доступа (суперадмин видит всё, админ — только свою школу)
  const { isSuper } = getBillingRoles(options.user);
  const targetSchoolId = isSuper
    ? options.schoolId || options.user?.schoolId
    : options.user?.schoolId ?? options.schoolId;

  const markOverdue = options.markOverdue !== false;
  const autoCreateMissing = options.autoCreateMissing === true;

  // ШАГ 2: Выборка только АКТИВНЫХ учеников с типом оплаты 'subscription_monthly'
  const enrollmentConditions = [
    eq(studentGroupEnrollments.status, "active"),
    eq(studentGroupEnrollments.billingType, "subscription_monthly"),
  ];
  if (targetSchoolId) {
    enrollmentConditions.push(eq(groups.schoolId, targetSchoolId));
    enrollmentConditions.push(eq(students.schoolId, targetSchoolId));
  }

  const activeEnrollments = await dbInstance
    .select({
      enrollmentId: studentGroupEnrollments.id,
      studentId: studentGroupEnrollments.studentId,
      studentName: students.name,
      schoolId: groups.schoolId,
      groupId: groups.id,
      groupName: groups.name,
      courseId: groups.courseId,
      courseName: courses.name,
      billingType: studentGroupEnrollments.billingType,
      customPrice: studentGroupEnrollments.customPrice,
      discountPercent: studentGroupEnrollments.discountPercent,
    })
    .from(studentGroupEnrollments)
    .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
    .innerJoin(students, eq(studentGroupEnrollments.studentId, students.id))
    .leftJoin(courses, eq(groups.courseId, courses.id))
    .where(and(...enrollmentConditions));

  const studentIds = Array.from(new Set(activeEnrollments.map((e) => e.studentId)));

  // ШАГ 3: Пакетная загрузка всех счетов за этот месяц (исключает N+1 запросов в базу)
  const invoiceConditions = [
    eq(invoices.type, "subscription"),
    ne(invoices.status, "cancelled"),
    or(eq(invoices.periodStart, periodStart), ilike(invoices.periodStart, `${targetMonth}%`)),
  ];
  if (targetSchoolId) {
    invoiceConditions.push(eq(invoices.schoolId, targetSchoolId));
  } else if (studentIds.length > 0) {
    invoiceConditions.push(inArray(invoices.studentId, studentIds));
  }

  const existingInvoices = studentIds.length > 0
    ? await dbInstance
        .select({
          id: invoices.id,
          schoolId: invoices.schoolId,
          studentId: invoices.studentId,
          groupId: invoices.groupId,
          enrollmentId: invoices.enrollmentId,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          totalAmount: invoices.totalAmount,
          paidAmount: invoices.paidAmount,
          dueDate: invoices.dueDate,
          periodStart: invoices.periodStart,
          periodEnd: invoices.periodEnd,
          groupCourseId: groups.courseId,
        })
        .from(invoices)
        .leftJoin(groups, eq(invoices.groupId, groups.id))
        .where(and(...invoiceConditions))
    : [];

  // ШАГ 4: Автоматический перевод счетов в 'overdue', если дата оплаты (dueDate) уже прошла
  const markedOverdueInvoiceIds: number[] = [];
  if (markOverdue && existingInvoices.length > 0) {
    const overdueCandidates = existingInvoices.filter(
      (inv) =>
        (inv.status === "issued" || inv.status === "partially_paid") &&
        inv.dueDate &&
        inv.dueDate < todayStr,
    );

    for (const inv of overdueCandidates) {
      await dbInstance
        .update(invoices)
        .set({ status: "overdue" })
        .where(eq(invoices.id, inv.id));
      inv.status = "overdue";
      markedOverdueInvoiceIds.push(inv.id);
    }
  }

  // ШАГ 5: Сопоставление каждого активного абонемента со счётом и подсчёт аналитики
  const studentsDetails: StudentSubscriptionDetail[] = [];
  let upToDateCount = 0;
  let partiallyPaidCount = 0;
  let unpaidCount = 0;
  let overdueCount = 0;
  let missingInvoiceCount = 0;
  let totalExpectedRevenue = 0;
  let totalBilledAmount = 0;
  let totalCollectedAmount = 0;
  let totalOutstandingDebt = 0;

  for (const enr of activeEnrollments) {
    // Рассчитываем индивидуальную стоимость с учётом скидки ученика
    const finalPrice = calculateSubscriptionPrice(0, enr.customPrice, enr.discountPercent);
    totalExpectedRevenue += finalPrice;

    // Ищем счёт по привязке к зачислению, группе или курсу
    const matchedInvoice = existingInvoices.find(
      (inv) =>
        inv.studentId === enr.studentId &&
        (inv.enrollmentId === enr.enrollmentId ||
          inv.groupId === enr.groupId ||
          (enr.courseId && inv.groupCourseId === enr.courseId)),
    );

    // СИТУАЦИЯ А: Ученик учится, но счёт на этот месяц ему НЕ выставлен
    if (!matchedInvoice) {
      missingInvoiceCount++;
      totalOutstandingDebt += finalPrice;
      studentsDetails.push({
        studentId: enr.studentId,
        studentName: enr.studentName,
        schoolId: enr.schoolId,
        groupId: enr.groupId,
        groupName: enr.groupName,
        courseId: enr.courseId,
        courseName: enr.courseName || enr.groupName || "Curs",
        enrollmentId: enr.enrollmentId,
        billingType: enr.billingType || "subscription_monthly",
        monthlyFee: finalPrice,
        hasInvoice: false,
        invoiceId: null,
        invoiceNumber: null,
        invoiceStatus: "no_invoice",
        totalAmount: 0,
        paidAmount: 0,
        debtAmount: finalPrice,
        dueDate: null,
        isOverdue: false,
        statusComment: "Lipsă factură generată pentru luna curentă",
      });
      continue;
    }

    // СИТУАЦИЯ Б: Счёт найден — классифицируем статус оплаты
    const total = matchedInvoice.totalAmount || 0;
    const paid = matchedInvoice.paidAmount || 0;
    const debt = Math.max(0, total - paid);
    totalBilledAmount += total;
    totalCollectedAmount += paid;
    totalOutstandingDebt += debt;

    const isOverdue =
      matchedInvoice.status === "overdue" ||
      (matchedInvoice.status !== "paid" && Boolean(matchedInvoice.dueDate && matchedInvoice.dueDate < todayStr));

    let statusComment = "";
    if (matchedInvoice.status === "paid") {
      upToDateCount++;
      statusComment = "Abonament achitat integral";
    } else if (matchedInvoice.status === "partially_paid") {
      partiallyPaidCount++;
      statusComment = `Achitat parțial (${paid}/${total} MDL)`;
    } else if (isOverdue) {
      overdueCount++;
      statusComment = `Restanță expirată la ${matchedInvoice.dueDate} (${debt} MDL)`;
    } else {
      unpaidCount++;
      statusComment = `Factură emisă, scadență: ${matchedInvoice.dueDate || "N/A"}`;
    }

    studentsDetails.push({
      studentId: enr.studentId,
      studentName: enr.studentName,
      schoolId: enr.schoolId,
      groupId: enr.groupId,
      groupName: enr.groupName,
      courseId: enr.courseId,
      courseName: enr.courseName || enr.groupName || "Curs",
      enrollmentId: enr.enrollmentId,
      billingType: enr.billingType || "subscription_monthly",
      monthlyFee: finalPrice,
      hasInvoice: true,
      invoiceId: matchedInvoice.id,
      invoiceNumber: matchedInvoice.invoiceNumber,
      invoiceStatus: matchedInvoice.status as StudentSubscriptionDetail["invoiceStatus"],
      totalAmount: total,
      paidAmount: paid,
      debtAmount: debt,
      dueDate: matchedInvoice.dueDate,
      isOverdue,
      statusComment,
    });
  }

  // ШАГ 6: Опциональная автогенерация недостающих счетов (для каждой школы отдельно)
  const autoCreatedInvoiceIds: number[] = [];
  if (autoCreateMissing && missingInvoiceCount > 0) {
    const schoolsToProcess = targetSchoolId
      ? [targetSchoolId]
      : Array.from(new Set(studentsDetails.filter((s) => s.invoiceStatus === "no_invoice").map((s) => s.schoolId)));

    for (const sid of schoolsToProcess) {
      try {
        const generated = await generateRecurringInvoices(
          dbInstance,
          { targetMonth, schoolId: sid, status: "draft" },
          options.user || { role: "superadmin", permissions: ["super"] },
        );
        if (generated && Array.isArray(generated.invoices)) {
          for (const inv of generated.invoices) {
            autoCreatedInvoiceIds.push(inv.id);
          }
        }
      } catch {
        // Игнорируем ошибку генерации конкретной школы — аудит продолжается
      }
    }
  }

  // ШАГ 7: Сборка итогового финансового отчёта
  const summary: SubscriptionAuditSummary = {
    targetMonth,
    checkedAt: now.toISOString(),
    totalActiveSubscriptions: activeEnrollments.length,
    upToDateCount,
    partiallyPaidCount,
    unpaidCount,
    overdueCount,
    missingInvoiceCount,
    invoicesMarkedOverdue: markedOverdueInvoiceIds.length,
    invoicesAutoCreated: autoCreatedInvoiceIds.length,
    totalExpectedRevenue,
    totalBilledAmount,
    totalCollectedAmount,
    totalOutstandingDebt,
  };

  return {
    success: true,
    summary,
    students: studentsDetails,
    markedOverdueInvoiceIds,
    autoCreatedInvoiceIds,
  };
}
