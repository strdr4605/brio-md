import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { invoices, invoiceItems, students } from "@/db/schema";
import { BillingUser, getBillingRoles } from "./billingService";

export type CreateSituationalInvoiceInput = {
  studentId: number;
  schoolId?: number;
  title: string;
  category: "materials" | "exam" | "private_session" | "adjustment" | string;
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
  if (!isSuper && input.schoolId && input.schoolId !== user.schoolId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nu poți crea o factură pentru altă școală" });
  }

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
      message: "Suma totală a facturii este invalidă sau depășește limita permisă.",
    });
  }

  const invoiceNumber = `INV-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;

  return await dbInstance.transaction(async (tx) => {
    const [newInvoice] = await tx
      .insert(invoices)
      .values({
        schoolId: targetSchoolId,
        studentId: input.studentId,
        invoiceNumber,
        type: "situational",
        status: input.status || "draft",
        totalAmount,
        paidAmount: 0,
        dueDate: input.dueDate,
        notes: input.notes || `Factură situațională: ${input.title} (${input.category})`,
      })
      .returning();

    const createdItems = await tx
      .insert(invoiceItems)
      .values(
        itemsInput.map((it) => ({
          invoiceId: newInvoice.id,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          amount: it.amount,
        })),
      )
      .returning();

    return { ...newInvoice, items: createdItems };
  });
}
