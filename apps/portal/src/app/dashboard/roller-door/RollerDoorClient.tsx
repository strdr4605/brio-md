"use client";

import { trpc } from "@/lib/trpc";

export function RollerDoorClient() {
  const toggleMutation = trpc.door.toggle.useMutation({
    onSuccess: () => {},
    onError: (error) => {
      alert(error.message);
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Control Roletă Intrare</h1>

      <div className="bg-white border rounded-lg p-6 shadow max-w-md">
        <div className="flex justify-center mb-6">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-colors ${
              toggleMutation.isPending ? "bg-yellow-100" : "bg-neutral-100"
            }`}
          >
            {toggleMutation.isPending ? "⏳" : "🏢"}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => toggleMutation.mutate({ action: "open" })}
            disabled={toggleMutation.isPending}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Deschide
          </button>
          <button
            onClick={() => toggleMutation.mutate({ action: "close" })}
            disabled={toggleMutation.isPending}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}