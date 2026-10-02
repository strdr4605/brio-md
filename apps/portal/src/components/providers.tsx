"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/lib/trpc";
import type { Session } from "next-auth";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof Element !== "undefined") {
      const originalRelease = Element.prototype.releasePointerCapture;
      if (originalRelease) {
        Element.prototype.releasePointerCapture = function (pointerId: number) {
          try {
            if (this.hasPointerCapture && this.hasPointerCapture(pointerId)) {
              originalRelease.call(this, pointerId);
            }
          } catch {
            // Benign swallow for devtools draggable pointer release
          }
        };
      }
    }
  }, []);
  return (
    <SessionProvider session={session}>
      <TRPCProvider>{children}</TRPCProvider>
    </SessionProvider>
  );
}
