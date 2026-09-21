"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { SearchIcon, XIcon, PhoneIcon } from "@/components/ui/icons";

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce query with 180ms latency (<250ms per spec)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Global keyboard shortcuts (Cmd+K, Ctrl+K, or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "/" && !isInput && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  const { data: results = [], isLoading } = trpc.student.search.useQuery(
    { query: debouncedQuery, limit: 8 },
    { enabled: isOpen && debouncedQuery.length > 0 },
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = (id: number) => {
    setIsOpen(false);
    router.push(`/dashboard/students/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        handleSelect(selected.id);
      }
    }
  };

  return (
    <>
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 text-xs text-slate-500 hover:text-slate-800 transition shadow-inner group w-64 lg:w-72 justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          <SearchIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          <span className="truncate">Caută elev, părinte, telefon...</span>
        </div>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
          CTRL + K
        </kbd>
      </button>

      {/* Mobile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
        aria-label="Caută elev"
      >
        <SearchIcon className="w-5 h-5 text-slate-500" />
      </button>

      {/* Search Modal Overlay - portaled to body to avoid header stacking context */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
            <div
              className="fixed inset-0"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[80vh]">
              {/* Input Header */}
              <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
                <SearchIcon className="w-5 h-5 text-blue-600 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Caută după nume elev, telefon, nume părinte sau nr. telefon..."
                  className="w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none font-medium"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-xs">
                    ESC
                  </kbd>
                )}
              </div>

              {/* Results Area */}
              <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-50">
                {isLoading && (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-1/3" />
                          <div className="h-3 bg-slate-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && debouncedQuery && results.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <SearchIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Niciun student găsit</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Nu am găsit niciun rezultat pentru &ldquo;<span className="font-semibold">{debouncedQuery}</span>&rdquo;.
                      Încercați după numele elevului sau ultimele cifre ale numărului de telefon.
                    </p>
                  </div>
                )}

                {!isLoading && !debouncedQuery && (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Tastați cel puțin un caracter pentru a căuta instantaneu în toți studenții.
                  </div>
                )}

                {!isLoading && results.length > 0 && (
                  <ul className="space-y-1">
                    {results.map((student, idx) => {
                      const isSelected = idx === selectedIndex;
                      const hasGroups = student.groups && student.groups.length > 0;
                      const hasCourses = student.courses && student.courses.length > 0;

                      return (
                        <li
                          key={student.id}
                          onClick={() => handleSelect(student.id)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`p-3 rounded-xl cursor-pointer transition flex items-start gap-3 ${
                            isSelected
                              ? "bg-blue-50/80 border border-blue-200/80 shadow-xs"
                              : "hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                            {student.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-sm text-slate-900 truncate">
                                {student.name}
                              </span>
                              {student.phone && (
                                <span className="text-xs text-slate-500 shrink-0 font-mono">
                                  {student.phone}
                                </span>
                              )}
                            </div>

                            {/* Parent Details */}
                            {(student.parentName || student.parentPhone) && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                                <span className="text-slate-400 font-medium">Părinte:</span>
                                <span className="font-medium truncate">{student.parentName || "Nespecificat"}</span>
                                {student.parentPhone && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-500 font-mono flex items-center gap-1">
                                      <PhoneIcon className="w-3 h-3 text-slate-400 inline" />
                                      {student.parentPhone}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Active Courses / Groups Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {hasGroups ? (
                                student.groups.map((g) => (
                                  <span
                                    key={g.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-800"
                                  >
                                    {g.courseName}: {g.name}
                                  </span>
                                ))
                              ) : hasCourses ? (
                                student.courses.map((c) => (
                                  <span
                                    key={c.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800"
                                  >
                                    {c.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Fără cursuri/grupe active
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span>
                    <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↑</kbd>{" "}
                    <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↓</kbd> Navigare
                  </span>
                  <span>
                    <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↵</kbd> Deschide
                  </span>
                </div>
                <span className="text-slate-400">Navighează direct la profilul studentului</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
