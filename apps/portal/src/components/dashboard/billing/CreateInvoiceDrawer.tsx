"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import {
  XIcon,
  PlusIcon,
  TrashIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";

export type GroupOption = {
  id: number;
  name: string;
  courseName?: string | null;
};

export type CreateInvoiceDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: number;
  initialStudentName?: string;
  groups?: GroupOption[];
  onSuccess?: () => void;
};

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

const PRESET_CATEGORIES = [
  { label: "Materiale didactice / Manuale", price: 350 },
  { label: "Taxă examinare / Certificare", price: 500 },
  { label: "Lecție privată / Consultație", price: 300 },
  { label: "Taxă înscriere / Echipament", price: 200 },
  { label: "Ajustare sold / Serviciu adițional", price: 150 },
];

export function CreateInvoiceDrawer({
  isOpen,
  onClose,
  initialStudentId,
  initialStudentName,
  groups: propGroups = [],
  onSuccess,
}: CreateInvoiceDrawerProps) {
  const [mounted, setMounted] = useState(false);

  // Student selection
  const [studentId, setStudentId] = useState<number | null>(initialStudentId || null);
  const [studentName, setStudentName] = useState<string>(initialStudentName || "");
  const [studentSearch, setStudentSearch] = useState("");
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);

  // Group selection
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Invoice parameters
  const [invoiceType, setInvoiceType] = useState<"subscription" | "per_lesson" | "situational">(
    "situational",
  );
  const [status, setStatus] = useState<"draft" | "issued">("issued");
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [discountPercent, setDiscountPercent] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    {
      id: "item-1",
      description: "Servicii educaționale",
      quantity: 1,
      unitPrice: 500,
    },
  ]);

  const prevOpenRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch student suggestions if searching dynamically
  const { data: searchedStudents = [], isLoading: isLoadingStudentSearch } =
    trpc.student.search.useQuery(
      { query: studentSearch?.trim() || "" },
      { enabled: isOpen && !initialStudentId && (studentSearch?.trim().length ?? 0) >= 2 },
    );

  // Fetch groups for student if not provided via props
  const { data: studentEnrollments = [] } = trpc.enrollment.getByStudent.useQuery(
    { studentId: studentId! },
    { enabled: isOpen && Boolean(studentId) && propGroups.length === 0 },
  );

  const availableGroups = useMemo<GroupOption[]>(() => {
    if (propGroups.length > 0) return propGroups;
    if (studentEnrollments.length > 0) {
      return studentEnrollments
        .filter((e) => e.status === "active")
        .map((e) => ({
          id: e.groupId,
          name: e.groupName,
          courseName: e.courseName,
        }));
    }
    return [];
  }, [propGroups, studentEnrollments]);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setError(null);
      setStudentId(initialStudentId || null);
      setStudentName(initialStudentName || "");
      setStudentSearch("");
      setIsSearchingStudents(false);
      setSelectedGroupId(propGroups[0]?.id || null);
      setInvoiceType("situational");
      setStatus("issued");

      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().slice(0, 10));
      setDiscountPercent("0");
      setNotes("");

      setItems([
        {
          id: `item-${Date.now()}`,
          description: "Servicii educaționale",
          quantity: 1,
          unitPrice: 500,
        },
      ]);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initialStudentId, initialStudentName, propGroups]);

  const handleSelectStudent = (s: { id: number; name: string; groups?: Array<{ id: number; name: string }> }) => {
    setStudentId(s.id);
    setStudentName(s.name);
    setStudentSearch("");
    setIsSearchingStudents(false);
    if (s.groups && s.groups.length > 0) {
      setSelectedGroupId(s.groups[0].id);
    } else {
      setSelectedGroupId(null);
    }
  };

  const handleTypeChange = (type: "subscription" | "per_lesson" | "situational") => {
    setInvoiceType(type);
    if (type === "subscription") {
      setItems([
        {
          id: `sub-${Date.now()}`,
          description: "Abonament lunar curs",
          quantity: 1,
          unitPrice: 1200,
        },
      ]);
    } else if (type === "per_lesson") {
      setItems([
        {
          id: `les-${Date.now()}`,
          description: "Pachet lecții prezență",
          quantity: 4,
          unitPrice: 150,
        },
      ]);
    } else {
      setItems([
        {
          id: `sit-${Date.now()}`,
          description: "Materiale didactice curs",
          quantity: 1,
          unitPrice: 350,
        },
      ]);
    }
  };

  const handleAddItem = (desc = "", price = 100) => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        description: desc,
        quantity: 1,
        unitPrice: price,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: "description" | "quantity" | "unitPrice", value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === "quantity") {
          const parsed = parseInt(value, 10);
          return { ...it, quantity: isNaN(parsed) ? 1 : Math.max(1, parsed) };
        }
        if (field === "unitPrice") {
          const parsed = parseInt(value, 10);
          return { ...it, unitPrice: isNaN(parsed) ? 0 : Math.max(0, parsed) };
        }
        return { ...it, [field]: value };
      }),
    );
  };

  // Calculations
  const rawSubtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.quantity || 1) * (it.unitPrice || 0), 0);
  }, [items]);

  const parsedDiscount = useMemo(() => {
    const val = parseInt(discountPercent, 10);
    return isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
  }, [discountPercent]);

  const discountAmount = useMemo(() => {
    return Math.round(rawSubtotal * (parsedDiscount / 100));
  }, [rawSubtotal, parsedDiscount]);

  const grandTotal = useMemo(() => {
    return Math.max(0, rawSubtotal - discountAmount);
  }, [rawSubtotal, discountAmount]);

  const createInvoiceMutation = trpc.billing.createInvoice.useMutation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setError(err.message || "Eroare la crearea facturii.");
    },
  });

  if (!mounted || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentId) {
      setError("Vă rugăm selectați un elev pentru această factură.");
      return;
    }

    if (items.length === 0) {
      setError("Factura trebuie să conțină cel puțin un articol.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].description.trim()) {
        setError(`Articolul #${i + 1} necesită o descriere.`);
        return;
      }
      if (items[i].quantity <= 0) {
        setError(`Articolul #${i + 1} trebuie să aibă o cantitate mai mare ca 0.`);
        return;
      }
      if (items[i].unitPrice < 0) {
        setError(`Articolul #${i + 1} nu poate avea un preț negativ.`);
        return;
      }
    }

    if (grandTotal > 2_000_000_000) {
      setError("Suma totală depășește limita permisă de 2,000,000,000 MDL.");
      return;
    }

    // If discount is applied, adjust line items unit prices proportionally
    const discountFactor = (100 - parsedDiscount) / 100;
    const finalItems = items.map((it) => ({
      description: it.description.trim(),
      quantity: it.quantity,
      unitPrice: parsedDiscount > 0 ? Math.round(it.unitPrice * discountFactor) : it.unitPrice,
    }));

    let finalNotes = notes.trim();
    if (parsedDiscount > 0) {
      const discountNote = `[Reducere comercială aplicată: ${parsedDiscount}% (${discountAmount} MDL)]`;
      finalNotes = finalNotes ? `${finalNotes}\n${discountNote}` : discountNote;
    }

    createInvoiceMutation.mutate({
      studentId,
      groupId: selectedGroupId || undefined,
      type: invoiceType,
      status,
      dueDate: dueDate || undefined,
      notes: finalNotes || undefined,
      items: finalItems,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Emite Factură Nouă</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Creați o factură de abonament, per lecție sau situativă cu articole detaliate.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Închide"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* 1. Student Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Elev beneficiar <span className="text-rose-500">*</span>
              </label>

              {studentId && studentName && !isSearchingStudents ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">{studentName}</span>
                      <span className="block text-[10px] text-slate-400">ID #{studentId}</span>
                    </div>
                  </div>
                  {!initialStudentId && (
                    <button
                      type="button"
                      onClick={() => {
                        setStudentId(null);
                        setStudentName("");
                        setIsSearchingStudents(true);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Schimbă
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Caută elev după nume sau telefon..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setIsSearchingStudents(true);
                    }}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    autoFocus={!initialStudentId}
                  />

                  {isLoadingStudentSearch && (
                    <div className="absolute right-3 top-2.5 text-xs text-slate-400">Căutare...</div>
                  )}

                  {isSearchingStudents && studentSearch.trim().length >= 2 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchedStudents.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">Niciun elev găsit</div>
                      ) : (
                        searchedStudents.map((s) => (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => handleSelectStudent(s)}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 transition flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-slate-800">{s.name}</span>
                            <span className="text-[11px] text-slate-400">{s.phone || "Fără telefon"}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Group Selection */}
            {availableGroups.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Grupă asociată (opțional)
                </label>
                <select
                  value={selectedGroupId || ""}
                  onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="">Fără grupă specifică / General</option>
                  {availableGroups.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.name} {grp.courseName ? `(${grp.courseName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 3. Invoice Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tip Factură <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange("subscription")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                    invoiceType === "subscription"
                      ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Abonament
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("per_lesson")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                    invoiceType === "per_lesson"
                      ? "bg-purple-50 border-purple-300 text-purple-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Plată per lecție
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("situational")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                    invoiceType === "situational"
                      ? "bg-amber-50 border-amber-300 text-amber-800 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Situativ
                </button>
              </div>
            </div>

            {/* 4. Situational Quick Preset Chips */}
            {invoiceType === "situational" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Preseturi rapide pentru facturi situaționale:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => handleAddItem(cat.label, cat.price)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-lg text-slate-700 transition flex items-center gap-1"
                    >
                      <PlusIcon className="w-3 h-3" />
                      <span>{cat.label} ({cat.price} MDL)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Dynamic Line Items Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Articole Factură <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleAddItem("", 100)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Adaugă rând</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {items.map((item, index) => {
                  const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Articol #{index + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 transition"
                            title="Șterge articol"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-6">
                          <input
                            type="text"
                            placeholder="Descriere articol..."
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="Cant."
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, "quantity", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium"
                            required
                            title="Cantitate"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Preț"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, "unitPrice", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-right font-medium"
                            required
                            title="Preț unitar (MDL)"
                          />
                        </div>

                        <div className="sm:col-span-2 text-right">
                          <span className="text-xs font-bold text-slate-800 block">
                            {lineTotal} MDL
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Discount & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reducere (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Data scadenței <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status inițial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "issued")}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="issued">Emisă (Issued)</option>
                  <option value="draft">Ciornă (Draft)</option>
                </select>
              </div>
            </div>

            {/* 7. Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Note / Observații factură
              </label>
              <textarea
                rows={2}
                placeholder="Detalii adiționale vizibile pe factură..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
              />
            </div>

            {/* 8. Live Total Calculation Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Subtotal articole:</span>
                <span className="font-semibold">{rawSubtotal} MDL</span>
              </div>
              {parsedDiscount > 0 && (
                <div className="flex justify-between text-xs text-amber-300 font-semibold">
                  <span>Reducere acordată ({parsedDiscount}%):</span>
                  <span>- {discountAmount} MDL</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Total de plată:
                </span>
                <span className="text-lg font-black text-emerald-400">
                  {grandTotal} MDL
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={createInvoiceMutation.isPending || !studentId || items.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>{createInvoiceMutation.isPending ? "Se emite..." : "Emite Factură"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
