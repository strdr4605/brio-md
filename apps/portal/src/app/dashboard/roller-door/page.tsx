import { redirect } from "next/navigation";
import { auth } from "@brio-md/auth";
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
      <div className="p-6">
        <p className="text-neutral-600">Nu ai permisiunea să accesezi această pagină.</p>
      </div>
    );
  }

  return <RollerDoorClient />;
}