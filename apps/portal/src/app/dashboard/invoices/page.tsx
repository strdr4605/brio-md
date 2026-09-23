"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { InvoiceIcon, PlusIcon } from "@/components/ui/icons";
import { InvoiceKpiCards } from "@/components/dashboard/invoices/InvoiceKpiCards";
import {
  InvoiceFiltersBar,
  StatusTab,
} from "@/components/dashboard/invoices/InvoiceFiltersBar";
import {
  InvoicesTable,
  InvoiceRowData,
} from "@/components/dashboard/invoices/InvoicesTable";

export default function InvoicesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isSuperOrAdmin =
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";

  // Filter States
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [groupIdFilter, setGroupIdFilter] = useState("all");
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const utils = trpc.useUtils();

  // Fetch Invoices & Groups
  const { data: rawInvoices = [], isLoading: isLoadingInvoices } =
    trpc.billing.getInvoices.useQuery(
      { limit: 100 },
      { enabled: isSuperOrAdmin },
    );

  const { data: groups = [] } = trpc.group.list.useQuery(
    undefined,
    { enabled: isSuperOrAdmin },
  );

  // Cancel Invoice Mutation
  const cancelMutation = trpc.billing.cancelInvoice.useMutation({
    onSuccess: () => {
      utils.billing.invalidate();
      setFeedbackMessage({
        text: "Factura a fost anulată cu succes.",
        type: "success",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    },
    onError: (err) => {
      setFeedbackMessage({
        text: err.message || "Eroare la anularea facturii.",
        type: "error",
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    },
  });

  // Calculate Overall KPI Metrics across non-cancelled invoices
  const { totalInvoiced, totalCollected, activeDebt, overdueCount } = useMemo(() => {
    let invoiced = 0;
    let collected = 0;
    let debt = 0;
    let overdue = 0;

    const todayStr = new Date().toISOString().slice(0, 10);

    for (const inv of rawInvoices) {
      if (inv.status === "cancelled") continue;

      invoiced += inv.totalAmount || 0;
      collected += inv.paidAmount || 0;

      const remaining = Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));
      if (inv.status !== "paid") {
        debt += remaining;
      }

      const isOverdue =
        inv.status === "overdue" ||
        (inv.status !== "paid" && Boolean(inv.dueDate && inv.dueDate < todayStr));

      if (isOverdue) {
        overdue += 1;
      }
    }

    return {
      totalInvoiced: invoiced,
      totalCollected: collected,
      activeDebt: debt,
      overdueCount: overdue,
    };
  }, [rawInvoices]);

  // Reactive Filtered Invoices
  const filteredInvoices = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    return rawInvoices.filter((inv) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = (inv.studentName || "").toLowerCase().includes(q);
        const matchesInvoiceNum = (inv.invoiceNumber || "").toLowerCase().includes(q);
        const matchesPhone = (inv.studentPhone || "").includes(q);
        if (!matchesName && !matchesInvoiceNum && !matchesPhone) return false;
      }

      // 2. Status Tab
      const isOverdue =
        inv.status === "overdue" ||
        (inv.status !== "paid" &&
          inv.status !== "cancelled" &&
          Boolean(inv.dueDate && inv.dueDate < todayStr));

      if (statusTab === "unpaid") {
        if (inv.status === "paid" || inv.status === "cancelled") return false;
      } else if (statusTab === "overdue") {
        if (!isOverdue) return false;
      } else if (statusTab === "paid") {
        if (inv.status !== "paid") return false;
      }

      // 3. Type Filter
      if (typeFilter !== "all" && inv.type !== typeFilter) {
        return false;
      }

      // 4. Group Filter
      if (groupIdFilter !== "all" && inv.groupId !== Number(groupIdFilter)) {
        return false;
      }

      return true;
    });
  }, [rawInvoices, search, statusTab, typeFilter, groupIdFilter]);

  const hasActiveFilters =
    Boolean(search) || statusTab !== "all" || typeFilter !== "all" || groupIdFilter !== "all";

  const handleResetFilters = () => {
    setSearch("");
    setStatusTab("all");
    setTypeFilter("all");
    setGroupIdFilter("all");
  };

  const handleRecordPayment = (inv: InvoiceRowData) => {
    setFeedbackMessage({
      text: `Pentru înregistrarea plății la factura ${inv.invoiceNumber}, deschideți profilul studentului sau folosiți formularul de încasare.`,
      type: "info",
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleViewDetails = (inv: InvoiceRowData) => {
    if (inv.studentId) {
      window.location.href = `/dashboard/students/${inv.studentId}`;
    }
  };

  const handleCancelInvoice = (inv: InvoiceRowData) => {
    const reason = window.prompt(
      `Confirmați anularea facturii ${inv.invoiceNumber || inv.id}. Introduceți motivul:`,
      "Eroare de emitere / Anulare administrativă",
    );
    if (!reason || !reason.trim()) return;

    cancelMutation.mutate({
      invoiceId: inv.id,
      reason: reason.trim(),
    });
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperOrAdmin) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto mt-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <InvoiceIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-xs text-slate-500 mt-1">
          Modulul de facturare este accesibil doar administratorilor și conducerii școlii.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Registru Facturi & Plăți
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {rawInvoices.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitorizează facturile emise, încasările și restanțele la nivel de școală.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFeedbackMessage({
              text: "Modulul interactiv de emitere facturi (Drawer) este disponibil în următorul pas (#103). Puteți vizualiza și gestiona facturile existente.",
              type: "info",
            });
            setTimeout(() => setFeedbackMessage(null), 5000);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Emite Factură</span>
        </button>
      </div>

      {/* Feedback Toast Notification */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : feedbackMessage.type === "error"
                ? "bg-rose-50 text-rose-800 border border-rose-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold hover:underline ml-3"
          >
            Închide
          </button>
        </div>
      )}

      {/* KPI Cards Overview */}
      <InvoiceKpiCards
        totalInvoiced={totalInvoiced}
        totalCollected={totalCollected}
        activeDebt={activeDebt}
        overdueCount={overdueCount}
        isLoading={isLoadingInvoices}
      />

      {/* Filters Toolbar */}
      <InvoiceFiltersBar
        search={search}
        setSearch={setSearch}
        statusTab={statusTab}
        setStatusTab={setStatusTab}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        groupIdFilter={groupIdFilter}
        setGroupIdFilter={setGroupIdFilter}
        groups={groups}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Invoices Table */}
      <InvoicesTable
        invoices={filteredInvoices}
        isLoading={isLoadingInvoices}
        onRecordPayment={handleRecordPayment}
        onViewDetails={handleViewDetails}
        onCancelInvoice={handleCancelInvoice}
      />
    </div>
  );
}
