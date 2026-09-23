import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";
import { invoices, payments } from "@/db/schema";

export type BillingUser = {
  id?: string | null;
  role?: string | null;
  permissions?: string[];
  schoolId?: number | null;
};

export function getBillingRoles(user?: BillingUser) {
  const permissions = user?.permissions || [];
  const role = user?.role;
  const hasManageBilling = permissions.includes("manage_billing");
  return {
    isSuper: permissions.includes("super") || role === "superadmin",
    isAdmin: permissions.includes("admin") || role === "admin" || hasManageBilling,
    isTeacher: permissions.includes("teach") || role === "teacher",
    hasManageBilling,
  };
}

export type RecordPaymentInput = {
  invoiceId: number;
  amount: number;
  paymentDate: string;
  method: "cash" | "bank_transfer" | "card" | "other";
  receiptNumber?: string;
  notes?: string;
};

export type VoidPaymentInput = {
  paymentId: number;
  reason: string;
};

export type CancelInvoiceInput = {
  id?: number;
  invoiceId?: number;
  reason: string;
};

export async function executeRecordPayment(
  dbInstance: typeof db,
  input: RecordPaymentInput,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);

  if (!input.amount || input.amount <= 0 || !Number.isInteger(input.amount)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Suma plătită trebuie să fie un număr întreg pozitiv.",
    });
  }

  return await dbInstance.transaction(async (tx) => {
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, input.invoiceId))
      .for("update")
      .limit(1);

    if (!invoice) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Factura nu a fost găsită",
      });
    }

    if (!isSuper && (!user.schoolId || invoice.schoolId !== user.schoolId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nu poți înregistra o plată pentru o factură din altă școală",
      });
    }

    if (invoice.status === "cancelled") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nu poți înregistra plăți pentru o factură anulată",
      });
    }

    if (invoice.status === "draft") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nu poți înregistra plăți pentru o factură în ciornă (draft). Emite factura mai întâi.",
      });
    }

    const currentPaid = invoice.paidAmount || 0;
    const remainingDebt = invoice.totalAmount - currentPaid;

    if (remainingDebt <= 0 || invoice.status === "paid") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Factura a fost deja achitată integral",
      });
    }

    if (input.amount > remainingDebt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Suma plătită (${input.amount}) depășește soldul rămas al facturii (${remainingDebt})`,
      });
    }

    const [newPayment] = await tx
      .insert(payments)
      .values({
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        schoolId: invoice.schoolId,
        amount: input.amount,
        paymentDate: input.paymentDate,
        method: input.method,
        receiptNumber: input.receiptNumber,
        notes: input.notes,
        recordedByUserId: user.id ? parseInt(user.id, 10) || null : null,
      })
      .returning();

    const newPaidAmount = currentPaid + input.amount;
    const newStatus =
      newPaidAmount >= invoice.totalAmount ? "paid" : "partially_paid";

    const [updatedInvoice] = await tx
      .update(invoices)
      .set({
        paidAmount: newPaidAmount,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id))
      .returning();

    return {
      payment: newPayment,
      invoice: updatedInvoice,
    };
  });
}

export async function executeVoidPayment(
  dbInstance: typeof db,
  input: VoidPaymentInput,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);

  if (!input.reason?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Motivul anulării plății este obligatoriu",
    });
  }

  return await dbInstance.transaction(async (tx) => {
    // 1. Fetch payment to determine target invoice
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, input.paymentId))
      .limit(1);

    if (!payment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plata nu a fost găsită",
      });
    }

    if (!isSuper && (!user.schoolId || payment.schoolId !== user.schoolId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nu poți anula o plată din altă școală",
      });
    }

    // 2. Lock invoice first (consistent lock hierarchy)
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, payment.invoiceId))
      .for("update")
      .limit(1);

    if (!invoice) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Factura asociată plății nu a fost găsită",
      });
    }

    // 3. Delete payment record atomically and verify deletion
    const deletedRows = await tx
      .delete(payments)
      .where(eq(payments.id, payment.id))
      .returning({ id: payments.id });

    if (deletedRows.length === 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Plata a fost deja anulată sau ștearsă de o altă sesiune",
      });
    }

    const newPaidAmount = Math.max(0, (invoice.paidAmount || 0) - payment.amount);

    let newStatus: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
    if (invoice.status === "cancelled") {
      newStatus = "cancelled";
    } else if (newPaidAmount >= invoice.totalAmount) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partially_paid";
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (invoice.dueDate && invoice.dueDate < todayStr) {
        newStatus = "overdue";
      } else {
        newStatus = "issued";
      }
    }

    const voidNote = `[Plată #${payment.id} anulată (${payment.amount} lei) de user #${user.id ?? "necunoscut"}: ${input.reason.trim()}]`;
    const updatedNotes = invoice.notes
      ? `${invoice.notes}\n${voidNote}`
      : voidNote;

    const [updatedInvoice] = await tx
      .update(invoices)
      .set({
        paidAmount: newPaidAmount,
        status: newStatus,
        notes: updatedNotes,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id))
      .returning();

    return {
      success: true,
      voidedPaymentId: payment.id,
      voidedAmount: payment.amount,
      invoice: updatedInvoice,
    };
  });
}

export async function executeCancelInvoice(
  dbInstance: typeof db,
  input: CancelInvoiceInput,
  user: BillingUser,
) {
  const { isSuper } = getBillingRoles(user);
  const targetId = input.id ?? input.invoiceId;

  if (!targetId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "id sau invoiceId este obligatoriu",
    });
  }

  if (!input.reason?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Motivul anulării facturii este obligatoriu",
    });
  }

  return await dbInstance.transaction(async (tx) => {
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, targetId))
      .for("update")
      .limit(1);

    if (!invoice) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Factura nu a fost găsită",
      });
    }

    if (!isSuper && (!user.schoolId || invoice.schoolId !== user.schoolId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nu poți anula o factură din altă școală",
      });
    }

    if (invoice.status === "cancelled") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Factura este deja anulată",
      });
    }

    if (invoice.status === "paid" || (invoice.paidAmount && invoice.paidAmount > 0)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nu poți anula o factură care are plăți înregistrate. Anulează plățile mai întâi.",
      });
    }

    const cancelNote = `[Anulată de user #${user.id ?? "necunoscut"}: ${input.reason.trim()}]`;
    const updatedNotes = invoice.notes
      ? `${invoice.notes}\n${cancelNote}`
      : cancelNote;

    const [updatedInvoice] = await tx
      .update(invoices)
      .set({
        status: "cancelled",
        notes: updatedNotes,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, targetId))
      .returning();

    return updatedInvoice;
  });
}
