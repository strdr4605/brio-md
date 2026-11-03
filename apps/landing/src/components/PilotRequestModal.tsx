"use client";

import { useState, useEffect } from "react";

export type PilotRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PilotRequestModal({ isOpen, onClose }: PilotRequestModalProps) {
  const [role, setRole] = useState<"school" | "tutor">("school");
  const [fullName, setFullName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [phone, setPhone] = useState("+373 ");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Chișinău");
  const [studentCount, setStudentCount] = useState("20-50");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
      setError(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setError("Vă rugăm să completați toate câmpurile obligatorii.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          fullName: fullName.trim(),
          institutionName: institutionName.trim() || (role === "tutor" ? "Meditator Privat" : "Școală"),
          phone: phone.trim(),
          email: email.trim(),
          city,
          studentCount,
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("A apărut o eroare la trimiterea cererii.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Eroare la procesarea cererii.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Solicită Acces Pilot la Brio.md
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Acces dedicat pentru școli, centre de studii și meditatori privați
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-emerald-600 shadow-xs border border-slate-200/80">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Cererea Dvs. a fost înregistrată!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Vă mulțumim pentru interes. Echipa Brio va lua legătura cu Dvs. la numărul{" "}
                  <span className="font-semibold text-slate-900">{phone}</span> pentru a vă furniza datele de acces și a vă configura cabinetul privat.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Închide
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipul activității
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setRole("school")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      role === "school"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Centru / Școală de Cursuri
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("tutor")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      role === "tutor"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Meditator / Tutor Privat
                  </button>
                </div>
              </div>

              {/* Full Name & Institution Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nume și Prenume *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ex. Ion Moraru"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {role === "school" ? "Denumire Școală / Centru *" : "Specialitate / Materie *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder={role === "school" ? "ex. Academia STEM" : "ex. Matematică BAC"}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400 transition"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefon de Contact *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+373 69 123456"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@scoala.md"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400 transition"
                  />
                </div>
              </div>

              {/* City & Student Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Oraș / Raion
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:bg-white focus:border-slate-400 transition"
                  >
                    <option value="Chișinău">Chișinău</option>
                    <option value="Bălți">Bălți</option>
                    <option value="Orhei">Orhei</option>
                    <option value="Cahul">Cahul</option>
                    <option value="Ungheni">Ungheni</option>
                    <option value="Altul / Online">Altul / Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Număr estimat de elevi
                  </label>
                  <select
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:bg-white focus:border-slate-400 transition"
                  >
                    <option value="1-15">1 – 15 elevi</option>
                    <option value="15-50">15 – 50 elevi</option>
                    <option value="50-150">50 – 150 elevi</option>
                    <option value="150+">Peste 150 elevi</option>
                  </select>
                </div>
              </div>

              {/* Optional message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mesaj sau cerințe speciale (opțional)
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="ex. Avem nevoie de catalog pentru 3 filiale și modul de abonamente..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400 transition resize-none"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Se trimite..." : "Trimite Solicitarea"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
