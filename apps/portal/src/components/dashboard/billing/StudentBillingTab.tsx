"use client";

import { trpc } from "@/lib/trpc";
import {
  PlusIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";

export type StudentBillingTabProps = {
  studentId: number;
  studentName: string;
  onOpenRecordPayment?: (invoiceId?: number) => void;
  onOpenCreateInvoice?: () => void;
  onEditPricing?: (enrollmentId: number) => void;
};

function formatBillingType(type: string | null | undefined) {
  switch (type) {
    case "subscription_monthly":
      return "Abonament lunar";
    case "per_lesson":
      return "Plată per lecție";
    case "subscription_course":
      return "Abonament curs complet";
    case "custom":
      return "Personalizat";
    default:
      return type || "Standard";
  }
}

function getInvoiceTypeBadge(type: string | null | undefined) {
  switch (type) {
    case "subscription":
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Abonament
        </span>
      );
    case "per_lesson":
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          Per lecție
        </span>
      );
    case "situational":
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Situativ
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
          {type || "Factură"}
        </span>
      );
  }
}

function getInvoiceStatusBadge(status: string, dueDate?: string | null) {
  const isOverdue =
    status === "overdue" ||
    (status !== "paid" &&
      status !== "cancelled" &&
      dueDate &&
      dueDate < new Date().toISOString().slice(0, 10));

  if (isOverdue) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        Restant
      </span>
    );
  }

  switch (status) {
    case "paid":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Achitat
        </span>
      );
    case "partially_paid":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Parțial achitat
        </span>
      );
    case "issued":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Emis
        </span>
      );
    case "cancelled":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
          Anulat
        </span>
      );
    case "draft":
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Schiță
        </span>
      );
  }
}

function formatPaymentMethod(method: string) {
  switch (method) {
    case "cash":
      return "Numerar";
    case "bank_transfer":
      return "Transfer bancar";
    case "card":
      return "Card";
    default:
      return method;
  }
}

export function StudentBillingTab({
  studentId,
  studentName: _studentName,
  onOpenRecordPayment,
  onOpenCreateInvoice,
  onEditPricing,
}: StudentBillingTabProps) {
  const { data: balanceSummary, isLoading: isLoadingBalance } =
    trpc.billing.getStudentBalanceSummary.useQuery(
      { studentId },
      { enabled: Boolean(studentId) },
    );

  const { data: invoices = [], isLoading: isLoadingInvoices } =
    trpc.billing.getInvoices.useQuery({ studentId, limit: 100 }, { enabled: Boolean(studentId) });

  const { data: payments = [], isLoading: isLoadingPayments } =
    trpc.billing.getPayments.useQuery({ studentId, limit: 100 }, { enabled: Boolean(studentId) });

  const handleQuickPay = (invoiceId: number) => {
    onOpenRecordPayment?.(invoiceId);
  };

  const currentDebt = balanceSummary?.currentDebt ?? 0;
  const overdueCount = balanceSummary?.overdueCount ?? 0;
  const activeBillingPlans = balanceSummary?.activeBillingPlans ?? [];

  return (
    <div className="space-y-6">
      {/* 1. Prominent Balance Card */}
      {isLoadingBalance ? (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          Se încarcă sumarul financiar...
        </div>
      ) : (
        <div
          className={`p-6 rounded-2xl border transition-all ${
            currentDebt > 0
              ? overdueCount > 0
                ? "bg-rose-50/70 border-rose-200/90 shadow-xs"
                : "bg-amber-50/70 border-amber-200/90 shadow-xs"
              : "bg-emerald-50/60 border-emerald-200/90 shadow-xs"
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  currentDebt > 0
                    ? overdueCount > 0
                      ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                      : "bg-amber-500 text-white shadow-md shadow-amber-200"
                    : "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                }`}
              >
                {currentDebt > 0 ? (
                  <AlertTriangleIcon className="w-7 h-7" />
                ) : (
                  <CheckCircleIcon className="w-7 h-7" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Statut Plăți Elev
                  </span>
                  {overdueCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white animate-pulse">
                      {overdueCount} {overdueCount === 1 ? "factură restantă" : "facturi restante"}
                    </span>
                  )}
                </div>

                <h2
                  className={`text-2xl font-black mt-0.5 ${
                    currentDebt > 0
                      ? overdueCount > 0
                        ? "text-rose-950"
                        : "text-amber-950"
                      : "text-emerald-950"
                  }`}
                >
                  {currentDebt > 0 ? `Datorie activă: ${currentDebt} MDL` : "Fără restanțe"}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {currentDebt > 0
                    ? "Elevul are sume neachitate sau parțial achitate în contul facturilor curente."
                    : "Toate facturile emise pentru acest elev sunt achitate la zi."}
                </p>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => onOpenCreateInvoice?.()}
                className="flex-1 md:flex-initial px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <PlusIcon className="w-4 h-4 text-slate-500" />
                <span>Emite factură situativă</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenRecordPayment?.()}
                className="flex-1 md:flex-initial px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Înregistrează plată</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200/60">
            <div className="p-3 bg-white/80 rounded-xl border border-slate-200/50">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Facturat
              </span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {balanceSummary?.totalInvoiced ?? 0} MDL
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-slate-200/50">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Încasat
              </span>
              <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">
                {balanceSummary?.totalPaid ?? 0} MDL
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-slate-200/50">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Restanță Curentă
              </span>
              <span
                className={`text-base font-extrabold mt-0.5 block ${
                  currentDebt > 0 ? "text-rose-600" : "text-slate-800"
                }`}
              >
                {currentDebt} MDL
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-slate-200/50">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Grupe Active
              </span>
              <span className="text-base font-extrabold text-blue-700 mt-0.5 block">
                {activeBillingPlans.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Active Tariff Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Tarife & Scheme de Facturare Active</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configurarea de preț și reducere aplicată elevului pentru fiecare grupă înscrisă.
            </p>
          </div>
        </div>

        <div className="p-6">
          {activeBillingPlans.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Elevul nu are nicio grupă activă configurată pentru facturare.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBillingPlans.map((plan) => (
                <div
                  key={plan.enrollmentId}
                  className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                        {plan.courseName || "Curs"}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{plan.groupName}</h4>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      {formatBillingType(plan.billingType)}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] text-slate-500 font-medium">
                        Preț:{" "}
                        <strong className="text-slate-800">
                          {plan.customPrice != null ? `${plan.customPrice} MDL` : "Standard curs"}
                        </strong>
                      </span>
                      {plan.discountPercent ? (
                        <span className="block text-[11px] font-bold text-emerald-700">
                          Reducere acordată: {plan.discountPercent}%
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => onEditPricing?.(plan.enrollmentId)}
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      Editează tarif
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Student Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Registru Facturi Elev</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Istoricul tuturor facturilor emise, scadente sau achitate.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {invoices.length} facturi
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoadingInvoices ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Se încarcă registrul facturilor...
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600">Nu a fost emisă nicio factură.</p>
              <p>Folosiți butonul de emitere pentru a adăuga o factură situativă sau abonament.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3">Nr. Factură</th>
                  <th className="px-4 py-3">Tip</th>
                  <th className="px-4 py-3">Scadență</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Achitat</th>
                  <th className="px-4 py-3 text-right">Restanță</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoices.map((inv) => {
                  const remaining = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
                  const canPay = inv.status !== "paid" && inv.status !== "cancelled";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-slate-900 block">{inv.invoiceNumber}</span>
                        {inv.groupName && (
                          <span className="text-[11px] text-slate-500">{inv.groupName}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">{getInvoiceTypeBadge(inv.type)}</td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {inv.dueDate || "Fără scadență"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {inv.totalAmount} MDL
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-emerald-600">
                        {inv.paidAmount || 0} MDL
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-bold ${
                          remaining > 0 ? "text-rose-600" : "text-slate-400"
                        }`}
                      >
                        {remaining} MDL
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {getInvoiceStatusBadge(inv.status, inv.dueDate)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {canPay ? (
                          <button
                            type="button"
                            onClick={() => handleQuickPay(inv.id)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-300 transition"
                          >
                            Achită
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Finalizat</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. Payment History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Istoric Încasări & Plăți</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jurnalul complet al plăților înregistrate pentru acest elev.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {payments.length} tranzacții
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoadingPayments ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Se încarcă istoricul plăților...
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Nu a fost înregistrată nicio plată pentru acest elev.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3">Data Plății</th>
                  <th className="px-4 py-3">Chitanță / Bon</th>
                  <th className="px-4 py-3">Metodă</th>
                  <th className="px-4 py-3">Factură</th>
                  <th className="px-4 py-3 text-right">Sumă Încasată</th>
                  <th className="px-6 py-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3.5 text-slate-700 font-semibold">{p.paymentDate}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-slate-800">
                        {p.receiptNumber || `PAY-${p.id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {formatPaymentMethod(p.method)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">{p.invoiceNumber}</td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-emerald-600 text-sm">
                      +{p.amount} MDL
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 text-[11px]">
                      {p.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
