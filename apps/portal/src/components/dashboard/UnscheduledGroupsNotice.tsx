"use client";

import { GroupItem } from "./GroupFormModal";

type UnscheduledGroupsNoticeProps = {
  groups: GroupItem[];
  canEdit: boolean;
  onEdit: (group: GroupItem) => void;
};

// Groups without days or time never appear in the schedule views, so list them explicitly
export function UnscheduledGroupsNotice({ groups, canEdit, onEdit }: UnscheduledGroupsNoticeProps) {
  if (groups.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      <h3 className="text-base font-semibold text-slate-800">
        Grupe fără program ({groups.length})
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
        Aceste grupe nu apar în orar până nu le setezi zilele și intervalul orar.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {groups.map((group) => {
          const missing = [
            !group.scheduleDays?.length && "fără zile",
            !group.scheduleTime && "fără oră",
          ]
            .filter(Boolean)
            .join(", ");
          const content = (
            <>
              <span className="font-semibold text-slate-800">{group.name}</span>
              <span className="text-slate-500">
                {" "}
                · {group.courseName || "Curs"} · {missing}
              </span>
            </>
          );
          return (
            <li key={group.id}>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(group)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50 hover:border-slate-300 hover:bg-white transition text-left"
                >
                  {content}
                </button>
              ) : (
                <span className="inline-block text-xs px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50">
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
