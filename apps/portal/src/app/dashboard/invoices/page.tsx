"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { ReceiptIcon } from "@/components/ui/icons";

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: "Ciornă", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
  issued: { label: "Emisă", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  partially_paid: { label: "Parțial achitată", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  paid: { label: "Achitată", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  overdue: { label: "Restantă", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  cancelled: { label: "Anulată", bg: "bg-neutral-500/10", text: "text-neutral-500", border: "border-neutral-500/20" },
};

const TYPE_LABELS: Record<string, string> = {
  subscription: "Abonament",
  per_lesson: "Per Lecție",
  situational: "Situațională",
};

export default function InvoicesPage() {
  const { data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperAdmin = permissions.includes("super") || role === "superadmin";
  const isSuperOrAdmin = isSuperAdmin || permissions.includes("admin") || role === "admin";
  const canManageBilling = isSuperOrAdmin || permissions.includes("manage_billing");

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: invoices = [], isLoading } = trpc.billing.getInvoices.useQuery(
    undefined,
    { enabled: canManageBilling },
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      const matchSearch =
        !searchTerm.trim() ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.studentName && inv.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [invoices, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalDebt = Math.max(0, totalInvoiced - totalCollected);
    return { totalInvoiced, totalCollected, totalDebt };
  }, [invoices]);

  if (!canManageBilling) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div
          data-testid="access-denied"
          className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-8 text-center backdrop-blur shadow-xl"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center mb-4">
            <ReceiptIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Acces Restricționat</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Nu aveți permisiunea necesară pentru a accesa registrul de facturi și datele financiare ale școlii.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ReceiptIcon className="w-6 h-6" />
            </span>
            Registru Facturare
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestiunea abonamentelor, plăților și soldurilor elevilor
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#12151e]/80 p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Facturat</p>
          <p className="text-2xl font-black text-white mt-2">{stats.totalInvoiced.toLocaleString("ro-MD")} MDL</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#12151e]/80 p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Încasat</p>
          <p className="text-2xl font-black text-emerald-400 mt-2">{stats.totalCollected.toLocaleString("ro-MD")} MDL</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#12151e]/80 p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Datorie Activă</p>
          <p className="text-2xl font-black text-rose-400 mt-2">{stats.totalDebt.toLocaleString("ro-MD")} MDL</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12151e]/60 border border-white/[0.06] p-3 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "draft", "issued", "partially_paid", "paid"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {status === "all" ? "Toate" : STATUS_LABELS[status]?.label || status}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Caută după nr. factură sau student..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3.5 py-1.5 text-xs bg-white/[0.04] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#12151e]/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nr. Factură</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Tip</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Achitat</th>
                <th className="py-3 px-4">Scadență</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                    Se încarcă registrul de facturi...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                    Nicio factură găsită pentru filtrele selectate.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const statusConfig = STATUS_LABELS[inv.status] || {
                    label: inv.status,
                    bg: "bg-slate-500/10",
                    text: "text-slate-400",
                    border: "border-slate-500/20",
                  };
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-white" data-testid="invoice-student-name">
                        {inv.studentName || `Student #${inv.studentId}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {TYPE_LABELS[inv.type] || inv.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-100">
                        {inv.totalAmount.toLocaleString("ro-MD")} MDL
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">
                        {(inv.paidAmount || 0).toLocaleString("ro-MD")} MDL
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {inv.dueDate || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          data-testid="invoice-status-badge"
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
