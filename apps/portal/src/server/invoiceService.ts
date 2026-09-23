import { eq, and, or, ilike, desc, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { invoices, invoiceItems, payments, students, groups, courses, studentGroupEnrollments } from "@/db/schema";
import { BillingUser, getBillingRoles } from "./billingService";

export type GetInvoicesInput = {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
  type?: "subscription" | "per_lesson" | "situational";
  groupId?: number;
  studentId?: number;
  schoolId?: number;
  dateRange?: { from?: string; to?: string };
};

export async function fetchInvoices(
  dbInstance: typeof db,
  input: GetInvoicesInput | undefined,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);
  const conditions = [];

  if (!isSuper) {
    if (!user.schoolId) return [];
    conditions.push(eq(invoices.schoolId, user.schoolId));
  } else if (input?.schoolId) {
    conditions.push(eq(invoices.schoolId, input.schoolId));
  }

  if (input?.status) conditions.push(eq(invoices.status, input.status));
  if (input?.type) conditions.push(eq(invoices.type, input.type));
  if (input?.groupId) conditions.push(eq(invoices.groupId, input.groupId));
  if (input?.studentId) conditions.push(eq(invoices.studentId, input.studentId));
  if (input?.search?.trim()) {
    const q = `%${input.search.trim()}%`;
    conditions.push(or(ilike(invoices.invoiceNumber, q), ilike(students.name, q)));
  }
  if (input?.dateRange?.from) conditions.push(gte(invoices.dueDate, input.dateRange.from));
  if (input?.dateRange?.to) conditions.push(lte(invoices.dueDate, input.dateRange.to));

  return await dbInstance
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      schoolId: invoices.schoolId,
      studentId: invoices.studentId,
      studentName: students.name,
      studentPhone: students.phone,
      enrollmentId: invoices.enrollmentId,
      groupId: invoices.groupId,
      groupName: groups.name,
      type: invoices.type,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      dueDate: invoices.dueDate,
      periodStart: invoices.periodStart,
      periodEnd: invoices.periodEnd,
      notes: invoices.notes,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
    })
    .from(invoices)
    .innerJoin(students, eq(invoices.studentId, students.id))
    .leftJoin(groups, eq(invoices.groupId, groups.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(invoices.createdAt))
    .limit(input?.limit ?? 50)
    .offset(input?.offset ?? 0);
}

export async function fetchInvoiceById(
  dbInstance: typeof db,
  invoiceId: number,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);

  const [invoice] = await dbInstance
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Factura nu a fost găsită" });
  }

  if (!isSuper && (!user.schoolId || invoice.schoolId !== user.schoolId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți accesa o factură din altă școală" });
  }

  const [student] = await dbInstance
    .select({
      id: students.id,
      name: students.name,
      phone: students.phone,
      parentName: students.parentName,
      parentPhone: students.parentPhone,
      age: students.age,
    })
    .from(students)
    .where(eq(students.id, invoice.studentId))
    .limit(1);

  let group = null;
  if (invoice.groupId) {
    const [g] = await dbInstance
      .select({ id: groups.id, name: groups.name, courseId: courses.id, courseName: courses.name })
      .from(groups)
      .leftJoin(courses, eq(groups.courseId, courses.id))
      .where(eq(groups.id, invoice.groupId))
      .limit(1);
    group = g || null;
  }

  const items = await dbInstance
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoice.id));

  const invoicePayments = await dbInstance
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoice.id))
    .orderBy(desc(payments.createdAt));

  return { ...invoice, student, group, items, payments: invoicePayments };
}

export type CreateInvoiceInput = {
  studentId: number;
  schoolId?: number;
  groupId?: number;
  enrollmentId?: number;
  invoiceNumber?: string;
  type: "subscription" | "per_lesson" | "situational";
  status: "draft" | "issued";
  dueDate?: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; attendanceId?: number }>;
};

export async function executeCreateInvoice(
  dbInstance: typeof db,
  input: CreateInvoiceInput,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);
  const targetSchoolId = isSuper ? input.schoolId || user.schoolId : user.schoolId;

  if (!targetSchoolId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "schoolId este obligatoriu" });
  }

  if (input.status !== "draft" && input.status !== "issued") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O factură nouă poate fi creată doar ca ciornă (draft) sau emisă (issued).",
    });
  }

  const [student] = await dbInstance
    .select()
    .from(students)
    .where(eq(students.id, input.studentId))
    .limit(1);

  if (!student) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Studentul nu a fost găsit" });
  }

  if (!isSuper && student.schoolId !== targetSchoolId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți crea o factură pentru un student din altă școală" });
  }

  if (input.groupId) {
    const [group] = await dbInstance
      .select({ id: groups.id, schoolId: groups.schoolId })
      .from(groups)
      .where(eq(groups.id, input.groupId))
      .limit(1);
    if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Grupul specificat nu a fost găsit" });
    if (group.schoolId !== targetSchoolId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Grupul specificat nu aparține acestei școli" });
    }
  }

  if (input.enrollmentId) {
    const [enrollment] = await dbInstance
      .select({ id: studentGroupEnrollments.id, studentId: studentGroupEnrollments.studentId })
      .from(studentGroupEnrollments)
      .where(
        and(
          eq(studentGroupEnrollments.id, input.enrollmentId),
          eq(studentGroupEnrollments.studentId, input.studentId),
        ),
      )
      .limit(1);
    if (!enrollment) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Înscrierea specificată este invalidă sau aparține altui student" });
    }
  }

  const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  if (totalAmount > 2_000_000_000) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Suma totală a facturii depășește limita permisă de 2,000,000,000.",
    });
  }

  const invoiceNum =
    input.invoiceNumber?.trim() ||
    `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}-${randomBytes(2).toString("hex").toUpperCase()}`;

  return await dbInstance.transaction(async (tx) => {
    const [createdInvoice] = await tx
      .insert(invoices)
      .values({
        schoolId: targetSchoolId,
        studentId: input.studentId,
        groupId: input.groupId,
        enrollmentId: input.enrollmentId,
        invoiceNumber: invoiceNum,
        type: input.type,
        status: input.status,
        totalAmount,
        paidAmount: 0,
        dueDate: input.dueDate,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        notes: input.notes,
      })
      .returning();

    const itemsToInsert = input.items.map((it) => ({
      invoiceId: createdInvoice.id,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      amount: it.quantity * it.unitPrice,
      attendanceId: it.attendanceId,
    }));

    const createdItems = await tx.insert(invoiceItems).values(itemsToInsert).returning();

    return { ...createdInvoice, items: createdItems };
  });
}

export async function executeUpdateInvoiceStatus(
  dbInstance: typeof db,
  input: { id: number; status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled"; notes?: string },
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);

  return await dbInstance.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, input.id))
      .for("update")
      .limit(1);

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Factura nu a fost găsită" });
    }

    if (!isSuper && (!user.schoolId || existing.schoolId !== user.schoolId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți modifica o factură din altă școală" });
    }

    if (existing.status === "cancelled") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "O factură anulată nu poate fi reactivată sau modificată direct.",
      });
    }

    if (input.status === "cancelled") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Folosește procedura de anulare dedicată (cancelInvoice) cu motiv obligatoriu.",
      });
    }

    if (input.status === "partially_paid" && (existing.paidAmount || 0) === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nu poți seta statusul ca parțial plătit fără plăți înregistrate.",
      });
    }

    if (input.status === "draft" && (existing.paidAmount || 0) > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "O factură care are plăți înregistrate nu poate fi trecută în ciornă (draft).",
      });
    }

    if (input.status === "issued" && (existing.paidAmount || 0) > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "O factură care are plăți înregistrate nu poate fi marcată ca emisă simplă. Statusul corect este partially_paid.",
      });
    }

    if (input.status === "paid" && (existing.paidAmount || 0) < existing.totalAmount) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Factura nu poate fi marcată ca plătită deoarece suma achitată este mai mică decât totalul.",
      });
    }

    if (
      (input.status === "issued" || input.status === "draft" || input.status === "overdue") &&
      (existing.paidAmount || 0) >= existing.totalAmount &&
      existing.totalAmount > 0
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "O factură achitată integral nu poate fi retrogradată în ciornă, emisă sau restantă.",
      });
    }

    const [updated] = await tx
      .update(invoices)
      .set({
        status: input.status,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, input.id))
      .returning();

    return updated;
  });
}

export type SituationalCategory = "materials" | "exam" | "private_session" | "adjustment";

export type CreateSituationalInvoiceInput = {
  studentId: number;
  schoolId?: number;
  title: string;
  category: SituationalCategory | string;
  amount?: number;
  dueDate?: string;
  notes?: string;
  status?: "draft" | "issued";
  items?: Array<{
    description: string;
    quantity?: number;
    unitPrice: number;
  }>;
};

export async function executeCreateSituationalInvoice(
  dbInstance: typeof db,
  input: CreateSituationalInvoiceInput,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);
  const targetSchoolId = isSuper ? input.schoolId || user.schoolId : user.schoolId;

  if (!targetSchoolId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "schoolId este obligatoriu" });
  }

  const [student] = await dbInstance
    .select()
    .from(students)
    .where(eq(students.id, input.studentId))
    .limit(1);

  if (!student) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Studentul nu a fost găsit" });
  }

  if (!isSuper && student.schoolId !== targetSchoolId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți crea o factură pentru un student din altă școală" });
  }

  const itemsInput =
    input.items && input.items.length > 0
      ? input.items.map((it) => {
          const qty = it.quantity !== undefined ? it.quantity : 1;
          if (qty <= 0) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Cantitatea trebuie să fie un număr pozitiv" });
          }
          if (it.unitPrice < 0) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Prețul unitar nu poate fi negativ" });
          }
          return {
            description: it.description.trim() || input.title,
            quantity: qty,
            unitPrice: it.unitPrice,
            amount: qty * it.unitPrice,
          };
        })
      : input.amount !== undefined
        ? [
            {
              description: input.title.trim(),
              quantity: 1,
              unitPrice: input.amount,
              amount: input.amount,
            },
          ]
        : [];

  if (itemsInput.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Factura situațională trebuie să conțină o sumă sau cel puțin un articol.",
    });
  }

  const totalAmount = itemsInput.reduce((sum, it) => sum + it.amount, 0);
  if (totalAmount < 0 || totalAmount > 2_000_000_000) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Suma totală a facturii este invalidă.",
    });
  }

  const invoiceNumber = `INV-${new Date().getFullYear()}-${randomBytes(2).toString("hex").toUpperCase()}`;

  const categoryNotesPrefix = `[Categorie: ${input.category}] ${input.title}`;
  const finalNotes = input.notes?.trim()
    ? `${categoryNotesPrefix} - ${input.notes.trim()}`
    : categoryNotesPrefix;

  const invoiceStatus = input.status || "issued";
  if (invoiceStatus !== "draft" && invoiceStatus !== "issued") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O factură nouă poate fi creată doar ca ciornă (draft) sau emisă (issued).",
    });
  }

  return await dbInstance.transaction(async (tx) => {
    const [createdInvoice] = await tx
      .insert(invoices)
      .values({
        schoolId: targetSchoolId,
        studentId: input.studentId,
        invoiceNumber,
        type: "situational",
        status: invoiceStatus,
        totalAmount,
        paidAmount: 0,
        dueDate: input.dueDate,
        notes: finalNotes,
      })
      .returning();

    const createdItems = await tx
      .insert(invoiceItems)
      .values(
        itemsInput.map((it) => ({
          invoiceId: createdInvoice.id,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          amount: it.amount,
        })),
      )
      .returning();

    return { ...createdInvoice, items: createdItems };
  });
}

