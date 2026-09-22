import { eq, and, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";
import {
  invoices,
  payments,
  students,
  groups,
  courses,
  studentGroupEnrollments,
} from "@/db/schema";
import { BillingUser, getBillingRoles } from "./billingService";

export async function fetchStudentBalanceSummary(
  dbInstance: typeof db,
  studentId: number,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);

  const [student] = await dbInstance
    .select({
      id: students.id,
      name: students.name,
      schoolId: students.schoolId,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Studentul nu a fost găsit",
    });
  }

  if (!isSuper && (!user.schoolId || student.schoolId !== user.schoolId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Nu poți accesa datele unui student din altă școală",
    });
  }

  const invoiceConditions = [
    eq(invoices.studentId, studentId),
    ne(invoices.status, "cancelled"),
  ];
  if (!isSuper && user.schoolId) {
    invoiceConditions.push(eq(invoices.schoolId, user.schoolId));
  }

  const studentInvoices = await dbInstance
    .select({
      id: invoices.id,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      dueDate: invoices.dueDate,
    })
    .from(invoices)
    .where(and(...invoiceConditions));

  const paymentConditions = [eq(payments.studentId, studentId)];
  if (!isSuper && user.schoolId) {
    paymentConditions.push(eq(payments.schoolId, user.schoolId));
  }

  const studentPayments = await dbInstance
    .select({
      amount: payments.amount,
    })
    .from(payments)
    .where(and(...paymentConditions));

  const totalPaid = studentPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const activeInvoices = studentInvoices.filter((inv) => inv.status !== "draft");
  const totalInvoiced = activeInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const currentDebt = activeInvoices.reduce(
    (acc, inv) => acc + Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)),
    0,
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueCount = activeInvoices.filter((inv) => {
    if (inv.status === "paid") return false;
    if (inv.status === "overdue") return true;
    if (inv.dueDate && inv.dueDate < todayStr) return true;
    return false;
  }).length;

  const planConditions = [
    eq(studentGroupEnrollments.studentId, studentId),
    eq(studentGroupEnrollments.status, "active"),
  ];
  if (!isSuper && user.schoolId) {
    planConditions.push(eq(groups.schoolId, user.schoolId));
  }

  const activeBillingPlans = await dbInstance
    .select({
      enrollmentId: studentGroupEnrollments.id,
      groupId: groups.id,
      groupName: groups.name,
      courseId: courses.id,
      courseName: courses.name,
      billingType: studentGroupEnrollments.billingType,
      customPrice: studentGroupEnrollments.customPrice,
      discountPercent: studentGroupEnrollments.discountPercent,
      status: studentGroupEnrollments.status,
      joinedAt: studentGroupEnrollments.joinedAt,
    })
    .from(studentGroupEnrollments)
    .innerJoin(groups, eq(studentGroupEnrollments.groupId, groups.id))
    .leftJoin(courses, eq(groups.courseId, courses.id))
    .where(and(...planConditions));

  return {
    studentId: student.id,
    studentName: student.name,
    totalInvoiced,
    totalPaid,
    currentDebt,
    overdueCount,
    activeBillingPlans,
  };
}
