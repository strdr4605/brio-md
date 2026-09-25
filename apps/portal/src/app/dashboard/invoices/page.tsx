"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { InvoiceIcon } from "@/components/ui/icons";
import { InvoiceKpiCards } from "@/components/dashboard/invoices/InvoiceKpiCards";
import {
  InvoiceFiltersBar,
  StatusTab,
} from "@/components/dashboard/invoices/InvoiceFiltersBar";
import {
  InvoicesTable,
  InvoiceRowData,
} from "@/components/dashboard/invoices/InvoicesTable";
import { CancelInvoiceModal } from "@/components/dashboard/invoices/CancelInvoiceModal";

export default function InvoicesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const role = session?.user?.role;
  const isBillingAllowed =
    permissions.includes("manage_billing") ||
    permissions.includes("super") ||
    permissions.includes("admin") ||
    role === "superadmin" ||
    role === "admin";

  // Filter States
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [groupIdFilter, setGroupIdFilter] = useState("all");
  const [invoiceToCancel, setInvoiceToCancel] = useState<InvoiceRowData | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const utils = trpc.useUtils();

  // Server-side KPI Summary Query (fast aggregate over all school records)
  const { data: kpiSummary, isLoading: isLoadingKpi } =
    trpc.billing.getInvoicesSummary.useQuery(undefined, {
      enabled: isBillingAllowed,
      staleTime: 30_000,
    });

  // Server-side Query Parameters
  const serverStatus = useMemo(() => {
    if (statusTab === "paid") return "paid" as const;
    if (statusTab === "overdue") return "overdue" as const;
    return undefined;
  }, [statusTab]);

  const serverType = useMemo(() => {
    if (typeFilter !== "all") {
      return typeFilter as "subscription" | "per_lesson" | "situational";
    }
    return undefined;
  }, [typeFilter]);

  const serverGroupId = useMemo(() => {
    if (groupIdFilter !== "all") {
      return Number(groupIdFilter);
    }
    return undefined;
  }, [groupIdFilter]);

  // Fetch Invoices with Server-side Filtering
  const { data: rawInvoices = [], isLoading: isLoadingInvoices } =
    trpc.billing.getInvoices.useQuery(
      {
        limit: 100,
        search: search.trim() ? search.trim() : undefined,
        status: serverStatus,
        type: serverType,
        groupId: serverGroupId,
      },
      { enabled: isBillingAllowed },
    );

  const { data: groups = [] } = trpc.group.list.useQuery(undefined, {
    enabled: isBillingAllowed,
  });

  // Cancel Invoice Mutation
  const cancelMutation = trpc.billing.cancelInvoice.useMutation({
    onSuccess: () => {
      utils.billing.invalidate();
      setInvoiceToCancel(null);
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

  // Client-side refinement for "unpaid" tab (covers draft, issued, partially_paid, overdue)
  const displayedInvoices = useMemo(() => {
    if (statusTab !== "unpaid") return rawInvoices;
    return rawInvoices.filter(
      (inv) => inv.status !== "paid" && inv.status !== "cancelled",
    );
  }, [rawInvoices, statusTab]);

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
      text: `Pentru înregistrarea plății la factura ${inv.invoiceNumber}, folosiți opțiunea de încasare din profilul studentului.`,
      type: "info",
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleCancelInvoice = (inv: InvoiceRowData) => {
    setInvoiceToCancel(inv);
  };

  const handleConfirmCancel = (inv: InvoiceRowData, reason: string) => {
    cancelMutation.mutate({
      invoiceId: inv.id,
      reason,
    });
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isBillingAllowed) {
    return (
      <div data-testid="access-denied" className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto mt-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <InvoiceIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-xs text-slate-500 mt-1">
          Modulul de facturare este accesibil doar administratorilor și personalului autorizat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Registru Facturi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {displayedInvoices.length} facturi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestiunea centralizată a facturilor, plăților și a datoriilor școlii.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : feedbackMessage.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Financial KPI Overview Cards (Powered by Database Aggregations) */}
      <InvoiceKpiCards
        totalInvoiced={kpiSummary?.totalInvoiced ?? 0}
        totalCollected={kpiSummary?.totalCollected ?? 0}
        activeDebt={kpiSummary?.activeDebt ?? 0}
        overdueCount={kpiSummary?.overdueCount ?? 0}
        isLoading={isLoadingKpi}
      />

      {/* Filter and Search Bar */}
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

      {/* Primary Invoices Table */}
      <InvoicesTable
        invoices={displayedInvoices}
        isLoading={isLoadingInvoices}
        onRecordPayment={handleRecordPayment}
        onCancelInvoice={handleCancelInvoice}
      />

      {/* Accessible Cancel Invoice Modal */}
      <CancelInvoiceModal
        invoice={invoiceToCancel}
        isOpen={Boolean(invoiceToCancel)}
        isLoading={cancelMutation.isPending}
        onClose={() => setInvoiceToCancel(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
