import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
import { DoorIcon } from "@/components/ui/icons";
import { RollerDoorClient } from "./RollerDoorClient";

export default async function RollerDoorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const permissions = session.user.permissions || [];
  const hasPermission = permissions.includes("open-front-door") || permissions.includes("super");

  if (!hasPermission) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <DoorIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acces Restricționat</h2>
        <p className="text-sm text-slate-500 mt-1">Nu ai permisiunea să accesezi această pagină.</p>
      </div>
    );
  }

  return <RollerDoorClient />;
}