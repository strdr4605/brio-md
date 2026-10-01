"use client";

import {
  ArrowLeftIcon,
  MaximizeIcon,
  MinimizeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";

export type JournalGroupSwitcherItem = {
  id: number;
  name: string;
  courseName?: string | null;
  scheduleTime?: string | null;
};

type AttendanceJournalHeaderProps = {
  groupId?: number;
  groupName?: string;
  courseName?: string | null;
  scheduleTime?: string | null;
  room?: string | null;
  teacherName?: string | null;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  promptType?: "in_progress" | "uncompleted" | null;
  onBackToPicker: () => void;
  availableGroups?: JournalGroupSwitcherItem[];
  onSwitchGroup?: (newGroupId: number) => void;
  saveStatus?: "idle" | "saving" | "saved";
  onSave?: () => void;
  canEditAnyDate?: boolean;
};

export function AttendanceJournalHeader({
  groupId,
  groupName,
  courseName,
  scheduleTime,
  room,
  teacherName,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  isFullscreen,
  onToggleFullscreen,
  promptType,
  onBackToPicker,
  availableGroups = [],
  onSwitchGroup,
  saveStatus = "idle",
  onSave,
  canEditAnyDate = false,
}: AttendanceJournalHeaderProps) {
  const currentIndex = availableGroups.findIndex((g) => g.id === groupId);
  // Show the quick group switcher whenever multiple groups are available
  const showGroupSwitcher = availableGroups.length > 1 && Boolean(onSwitchGroup);

  const handlePrevGroup = () => {
    if (!showGroupSwitcher || !onSwitchGroup) return;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : availableGroups.length - 1;
    onSwitchGroup(availableGroups[prevIdx].id);
  };

  const handleNextGroup = () => {
    if (!showGroupSwitcher || !onSwitchGroup) return;
    const nextIdx = currentIndex < availableGroups.length - 1 ? currentIndex + 1 : 0;
    onSwitchGroup(availableGroups[nextIdx].id);
  };

  return (
    <div className="space-y-3">
      {/* Auto-Prompt Notification Banners */}
      {promptType === "uncompleted" && (
        <div className="bg-amber-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4 text-white shrink-0 animate-bounce" />
            <span>
              Atenție: Lecția de astăzi s-a încheiat! Vă rugăm să marcați prezența elevilor.
            </span>
          </div>
          <span className="text-[11px] font-mono bg-amber-600/60 px-2 py-0.5 rounded">
            Prezență Necesară
          </span>
        </div>
      )}

      {promptType === "in_progress" && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-white shrink-0 animate-pulse" />
            <span>Lecție în desfășurare chiar acum! Catalogul a fost deschis automat.</span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-700/60 px-2 py-0.5 rounded">
            Sesiune Activă
          </span>
        </div>
      )}

      {/* Main Gradebook Control Deck */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Back & Group Title / Instant Switcher */}
        <div className="flex items-center justify-between gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBackToPicker}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer shrink-0"
              title="Înapoi la lista de grupe"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {showGroupSwitcher ? (
                  <div className="inline-flex items-center gap-0.5 sm:gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={handlePrevGroup}
                      className="p-1 sm:p-1.5 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
                      title="Grupa precedentă"
                    >
                      <ChevronLeftIcon className="w-3.5 h-3.5" />
                    </button>
                    <div className="relative">
                      <select
                        value={groupId || ""}
                        onChange={(e) => onSwitchGroup?.(Number(e.target.value))}
                        className="appearance-none pl-2 pr-6 sm:pl-2.5 sm:pr-7 py-1 text-xs sm:text-sm font-black text-slate-900 bg-white border border-slate-200/90 rounded-lg cursor-pointer focus:outline-none shadow-2xs max-w-[140px] sm:max-w-none truncate"
                      >
                        {availableGroups.map((g, idx) => (
                          <option key={g.id} value={g.id}>
                            {idx + 1}. {g.name} {g.courseName ? `(${g.courseName})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={handleNextGroup}
                      className="p-1 sm:p-1.5 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
                      title="Grupa următoare"
                    >
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                    {groupName || "Se încarcă..."}
                  </h2>
                )}

                {courseName && !showGroupSwitcher && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 truncate">
                    {courseName}
                  </span>
                )}
              </div>

              <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                {scheduleTime || "Orar"} • Sala {room || "—"} • Prof. {teacherName || "—"}
                {showGroupSwitcher && currentIndex >= 0 && (
                  <span className="ml-1.5 font-bold text-blue-600">
                    ({currentIndex + 1}/{availableGroups.length})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Mobile-Only Action Buttons in Top Row */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                  saveStatus === "saved"
                    ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                }`}
                title="Salvează prezența"
              >
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>{saveStatus === "saving" ? "..." : saveStatus === "saved" ? "✓" : "Salvează"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`p-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                isFullscreen
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs ring-2 ring-blue-400/30"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
              }`}
              title={isFullscreen ? "Ieși din ecran complet" : "Ecran complet"}
            >
              {isFullscreen ? <MinimizeIcon className="w-3.5 h-3.5" /> : <MaximizeIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Center: Month Navigator */}
        <div className="flex items-center justify-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-center">
          <button
            type="button"
            onClick={onPrevMonth}
            className="p-1 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
            title="Luna precedentă"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-xs font-black text-slate-800 px-2 min-w-[120px] text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={onNextMonth}
            className="p-1 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
            title="Luna următoare"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Desktop-Only Legend & Controls */}
        <div className="hidden md:flex items-center gap-2">
          {/* Quick Legend */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px]">P</span>
              <span>1 click</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-rose-600 text-white flex items-center justify-center text-[9px]">A</span>
              <span>2 click</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400">🖱️ Notă</span>
            </span>
            {canEditAnyDate ? (
              <span className="ml-1 pl-2 border-l border-slate-200 text-indigo-700 font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                <span>Admin</span>
              </span>
            ) : (
              <span className="ml-1 pl-2 border-l border-slate-200 text-blue-700 font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span>Azi</span>
              </span>
            )}
          </div>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                saveStatus === "saved"
                  ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              }`}
              title="Salvează prezența și confirmă modificările"
            >
              <CheckCircleIcon className="w-3.5 h-3.5" />
              <span>{saveStatus === "saving" ? "Se salvează..." : saveStatus === "saved" ? "Salvat ✓" : "Salvează"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
              isFullscreen
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400/30"
                : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
            }`}
            title={isFullscreen ? "Ieși din ecran complet (tasta ESC)" : "Deschide pe tot ecranul"}
          >
            {isFullscreen ? <MinimizeIcon className="w-3.5 h-3.5" /> : <MaximizeIcon className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? "Ieși (ESC)" : "Ecran Complet"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
