"use client";

import Link from "next/link";
import { LoginForm } from "@brio-md/ui";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";

type LoginClientCardProps = {
  error?: string;
  onSubmitAction: (formData: FormData) => Promise<void>;
};

export function LoginClientCard({ error, onSubmitAction }: LoginClientCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs w-full max-w-md relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {t("auth.portalTitle", "Portal Personal")}
        </h1>
        <LanguageSwitcher />
      </div>

      <LoginForm
        variant="blue"
        error={error}
        onSubmit={onSubmitAction}
        labels={{
          email: t("auth.email", "Email"),
          password: t("auth.password", "Parolă"),
          submit: t("auth.loginButton", "Autentificare"),
        }}
      />

      <div className="mt-5 text-center">
        <Link
          href="https://learn.brio.md"
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          {t("auth.learnPortalLink", "Accesează Portalul de Învățare →")}
        </Link>
      </div>
    </div>
  );
}
