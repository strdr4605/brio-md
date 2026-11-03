"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/lib/trpc";
import { I18nProvider } from "@/lib/i18n";
import type { Session } from "next-auth";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <TRPCProvider>
        <I18nProvider>{children}</I18nProvider>
      </TRPCProvider>
    </SessionProvider>
  );
}
