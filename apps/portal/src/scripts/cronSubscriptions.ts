import { db } from "../lib/db";
import { runMonthlySubscriptionCheck } from "../server/subscriptionCronService";

/**
 * Точка входа для запуска кронжоба из командной строки Linux / Docker / Crontab:
 * Пример запуска: npx tsx src/scripts/cronSubscriptions.ts 2026-09 --auto-create --school-id=1
 */
async function main() {
  // ШАГ 1: Парсинг аргументов командной строки
  const args = process.argv.slice(2);
  const targetMonthArg = args.find((a) => /^\d{4}-(0[1-9]|1[0-2])$/.test(a));
  const autoCreate = args.includes("--auto-create");
  const schoolIdArg = args.find((a) => a.startsWith("--school-id="));
  const schoolId = schoolIdArg ? parseInt(schoolIdArg.split("=")[1], 10) : undefined;

  console.log("\n=======================================================");
  console.log(" 🔄 BRIO.MD - MONTHLY SUBSCRIPTION AUDIT CRON JOB");
  console.log("=======================================================");

  const startTime = Date.now();

  // ШАГ 2: Вызов сервисного модуля аудита подписок
  const result = await runMonthlySubscriptionCheck(db, {
    targetMonth: targetMonthArg,
    schoolId,
    autoCreateMissing: autoCreate,
    markOverdue: true,
    user: { role: "superadmin", permissions: ["super"] },
  });

  const durationMs = Date.now() - startTime;
  const { summary } = result;

  // ШАГ 3: Вывод сводного финансового и количественного отчёта в терминал
  console.log(`\n📅 Luna auditată:         ${summary.targetMonth}`);
  console.log(`⏱️  Timp execuție:         ${durationMs}ms`);
  console.log(`👥 Total abonamente active: ${summary.totalActiveSubscriptions}`);
  console.log(`✅ Achitate integral:      ${summary.upToDateCount}`);
  console.log(`⏳ Achitate parțial:       ${summary.partiallyPaidCount}`);
  console.log(`🟡 Emise (neexpirate):     ${summary.unpaidCount}`);
  console.log(`🚨 Restanțe / Expirate:    ${summary.overdueCount}`);
  console.log(`⚠️  Lipsă factură:          ${summary.missingInvoiceCount}`);
  console.log(`⚡ Facturi marcate Overdue: ${summary.invoicesMarkedOverdue}`);
  if (autoCreate) {
    console.log(`✨ Facturi auto-generate:  ${summary.invoicesAutoCreated}`);
  }
  console.log("-------------------------------------------------------");
  console.log(`💰 Venit lunar estimat:    ${summary.totalExpectedRevenue} MDL`);
  console.log(`🧾 Sumă total facturată:   ${summary.totalBilledAmount} MDL`);
  console.log(`💵 Încasat până acum:      ${summary.totalCollectedAmount} MDL`);
  console.log(`📉 Restanță restantă:      ${summary.totalOutstandingDebt} MDL`);
  console.log("=======================================================\n");

  // ШАГ 4: Построчный вывод первых 10 учеников с цветовыми маркерами статуса
  if (result.students.length > 0) {
    console.log("📋 Detalii elevi auditați (primele 10 înregistrări):");
    result.students.slice(0, 10).forEach((s, idx) => {
      const flag = s.isOverdue ? "🚨" : s.hasInvoice ? (s.debtAmount === 0 ? "✅" : "🟡") : "⚠️";
      console.log(
        `  ${idx + 1}. ${flag} [${s.studentName}] | Grup: ${s.groupName} | Preț: ${s.monthlyFee} MDL | Status: ${s.invoiceStatus} (${s.statusComment})`,
      );
    });
    if (result.students.length > 10) {
      console.log(`  ... și încă ${result.students.length - 10} elevi.`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ [CRON ERROR] Ошибка при выполнении проверки абонементов:", err);
  process.exit(1);
});
