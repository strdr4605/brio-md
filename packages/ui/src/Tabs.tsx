export type TabItem = {
  id: string;
  label: string;
  count?: number;
};

export type TabsProps = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ items, activeId, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex gap-6 border-b border-[#E2E8F0] overflow-x-auto ${className}`} role="tablist">
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`py-3 text-xs -mb-[1px] whitespace-nowrap transition-colors border-b-2 font-medium ${
              isActive
                ? "border-[#0F172A] text-slate-900 font-semibold cursor-default"
                : "border-transparent text-slate-500 hover:text-slate-800 cursor-pointer"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && <span className="ml-1 text-slate-400">({tab.count})</span>}
          </button>
        );
      })}
    </div>
  );
}
