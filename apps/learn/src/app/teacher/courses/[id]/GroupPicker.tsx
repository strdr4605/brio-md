"use client";

export type GroupOption = {
  id: number;
  name: string;
  scheduleTime?: string | null;
  room?: string | null;
};

type Props = {
  groups: GroupOption[];
  selectedGroupId: number | null;
  onSelectGroup: (groupId: number) => void;
  isLoading?: boolean;
};

export function GroupPicker({
  groups,
  selectedGroupId,
  onSelectGroup,
  isLoading,
}: Props) {
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div
      className="relative border border-slate-300 rounded-[4px] px-3 py-1 bg-white shadow-2xs flex flex-col justify-center cursor-pointer hover:border-slate-400 transition min-w-[150px] select-none"
      title="Selectează grupa activă"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
        Grupă Activă
      </span>
      <div className="flex items-center justify-between gap-2 mt-0.5">
        <span className="text-xs font-bold text-slate-800 tracking-wide truncate max-w-[150px]">
          {isLoading
            ? "Se încarcă..."
            : selectedGroup
              ? selectedGroup.name
              : groups.length === 0
                ? "Nicio grupă"
                : "Alege grupa..."}
        </span>
        <svg
          className="w-3.5 h-3.5 text-slate-500 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      <select
        value={selectedGroupId ?? ""}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val)) onSelectGroup(val);
        }}
        disabled={isLoading || groups.length === 0}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
        aria-label="Alege grupa"
      >
        <option value="" disabled>
          {groups.length === 0 ? "Nicio grupă disponibilă" : "Alege grupa..."}
        </option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
            {g.scheduleTime ? ` (${g.scheduleTime})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
