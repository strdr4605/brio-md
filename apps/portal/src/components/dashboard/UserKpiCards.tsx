"use client";

import { MetricCard } from "@/components/dashboard/MetricCard";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <MetricCard
        title="Total Utilizatori"
        value={totalUsers}
        icon={<UsersIcon />}
        footer="Conturi înregistrate"
      />
      <MetricCard
        title="Conturi Active"
        value={activeCount}
        icon={<UserCheckIcon />}
        footer="Acces autorizat"
      />
      <MetricCard
        title="Conturi Inactive"
        value={inactiveCount}
        icon={<UsersIcon />}
        footer="Acces suspendat"
      />
      <MetricCard
        title="Administratori"
        value={adminCount}
        icon={<ShieldCheckIcon />}
        footer="Roluri cu drepturi avansate"
      />
    </div>
  );
}
