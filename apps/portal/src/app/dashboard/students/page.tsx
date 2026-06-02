"use client";

import { useSession } from "next-auth/react";

export default function StudentiPage() {
  const { data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const isSuperOrAdmin = permissions.includes("super") || permissions.includes("admin");

  if (!isSuperOrAdmin) {
    return (
      <div className="p-6">
        <p className="text-neutral-600">Nu ai permisiunea să accesezi această pagină.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Studenţi</h1>
      <p className="text-neutral-600">Gestionare studenţi (în curând)</p>
    </div>
  );
}
