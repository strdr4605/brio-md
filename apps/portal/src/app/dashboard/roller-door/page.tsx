"use client";

import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function FrontDoorPage() {
  const { data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const hasPermission = permissions.includes("open-front-door") || permissions.includes("super");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleMutation = trpc.door.toggle.useMutation({
    onMutate: () => {
      setStatus("loading");
      setErrorMessage("");
    },
    onSuccess: () => {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    },
    onError: (error) => {
      setStatus("error");
      setErrorMessage(error.message);
    },
  });

  if (!hasPermission) {
    return (
      <div className="p-6">
        <p className="text-neutral-600">Nu ai permisiunea să accesezi această pagină.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Control Roletă Intrare</h1>

      <div className="bg-white border rounded-lg p-6 shadow max-w-md">
        <div className="flex justify-center mb-6">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-colors ${
              status === "loading"
                ? "bg-yellow-100"
                : status === "success"
                  ? "bg-green-100"
                  : status === "error"
                    ? "bg-red-100"
                    : "bg-neutral-100"
            }`}
          >
            {status === "loading" ? "⏳" : status === "success" ? "✅" : status === "error" ? "❌" : "🚪"}
          </div>
        </div>

        {status === "error" && errorMessage && (
          <p className="text-red-600 text-center mb-4">{errorMessage}</p>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => toggleMutation.mutate({ action: "open" })}
            disabled={status === "loading"}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Deschide
          </button>
          <button
            onClick={() => toggleMutation.mutate({ action: "close" })}
            disabled={status === "loading"}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}