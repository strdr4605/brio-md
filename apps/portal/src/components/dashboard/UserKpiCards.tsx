"use client";

import {
  UsersIcon,
  UserCheckIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

type Props = {
  totalUsers: number;
  activeCount: number;
  inactiveCount: number;
  adminCount: number;
};

export function UserKpiCards({
  totalUsers,
  activeCount,
  inactiveCount,
  adminCount,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <UsersIcon className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Utilizatori</span>
          <p className="text-xl font-bold text-slate-900 leading-none mt-1">{totalUsers}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <UserCheckIcon className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase">Conturi Active</span>
          <p className="text-xl font-bold text-slate-900 leading-none mt-1">{activeCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <UsersIcon className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase">Conturi Inactive</span>
          <p className="text-xl font-bold text-slate-900 leading-none mt-1">{inactiveCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <ShieldCheckIcon className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase">Administratori</span>
          <p className="text-xl font-bold text-slate-900 leading-none mt-1">{adminCount}</p>
        </div>
      </div>
    </div>
  );
}
