"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { SchoolIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/ui/icons";

type Props = {
  schoolId?: number | null;
  isAdmin: boolean;
};

export function SchoolProfileForm({ schoolId, isAdmin }: Props) {
  const utils = trpc.useUtils();

  const { data: school, isLoading, error: loadError } = trpc.school.getDetails.useQuery(
    undefined,
    {
      enabled: isAdmin && !!schoolId,
    },
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (school) {
      setName(school.name || "");
      setAddress(school.address || "");
      setPhone(school.phone || "");
      setEmail(school.email || "");
      setBankName(school.bankName || "");
      setIban(school.iban || "");
      setFiscalCode(school.fiscalCode || "");
    }
  }, [school]);

  const updateMutation = trpc.school.updateDetails.useMutation({
    onSuccess: () => {
      utils.school.getDetails.invalidate();
      utils.user.listSchools.invalidate();
      setFeedback({
        type: "success",
        message: "Datele campusului școlar și rechizitele bancare au fost salvate cu succes.",
      });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err.message || "Eroare la salvarea datelor școlii.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Numele școlii este obligatoriu." });
      return;
    }
    setFeedback(null);
    updateMutation.mutate({
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      bankName: bankName.trim() || null,
      iban: iban.trim() || null,
      fiscalCode: fiscalCode.trim() || null,
    });
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <SchoolIcon className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">Date Campus Școlar</h2>
        </div>
        <p className="text-xs text-slate-500">
          Modificarea profilului oficial și a rechizitelor bancare ale școlii este permisă doar
          administratorilor.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <SchoolIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Profil & Relații Bancare Școală</h2>
            <p className="text-xs text-slate-500">
              Aceste date apar pe chitanțele și facturile printabile emise elevilor.
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangleIcon className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Se încarcă datele școlii...
        </div>
      ) : loadError ? (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
          Nu s-au putut încărca datele școlii: {loadError.message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nume Campus */}
          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
              Nume Campus / Instituție <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Vibe Academy Chișinău"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition font-medium text-slate-900"
            />
          </div>

          {/* Adresa & Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                Adresă Sediu
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: bd. Dacia 31/1, Chișinău"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                Telefon Contact Facturare
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: +373 69 123 456"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition text-slate-900"
              />
            </div>
          </div>

          {/* Email Oficial */}
          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
              Email Oficial Facturare
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: contact@vibe.md"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition text-slate-900"
            />
          </div>

          {/* Secțiune Relații Bancare */}
          <div className="pt-2 border-t border-slate-100 space-y-3.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
              Rechizite Bancare pentru Transfer
            </span>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                Banca Beneficiară
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="ex: BC Moldova Agroindbank SA"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                  Cont IBAN
                </label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="ex: MD24AG0000000123456789"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition font-mono uppercase text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                  Cod Fiscal / IDNO
                </label>
                <input
                  type="text"
                  value={fiscalCode}
                  onChange={(e) => setFiscalCode(e.target.value)}
                  placeholder="ex: 1002600012345"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-2xs"
            >
              {updateMutation.isPending ? "Se salvează..." : "Salvează Datele Școlii"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
