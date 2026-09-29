import { db } from "@/lib/db";
import { runMonthlySubscriptionCheck } from "@/server/subscriptionCronService";

/**
 * Проверка авторизации кронжоба через секретный токен CRON_SECRET:
 * Защищает эндпоинт от несанкционированных вызовов из публичного интернета.
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return false; // Fail closed in production: never allow unauthenticated cron in production
    }
    // В локальной разработке или тестовом окружении без секрета — разрешаем запуск
    return true;
  }

  // Способ 1: Стандартный заголовок Bearer Authorization
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === secret) return true;
  }

  // Способ 2: Заголовок x-cron-secret (используется Vercel Cron и облачными планировщиками)
  const xCronSecret = req.headers.get("x-cron-secret");
  if (xCronSecret && xCronSecret.trim() === secret) {
    return true;
  }

  return false;
}

/**
 * Основной обработчик GET / POST запросов:
 * Считывает параметры, запускает пайплайн проверки и возвращает результат в JSON.
 */
async function handleCheck(req: Request) {
  // ШАГ 1: Проверка прав доступа
  if (!isAuthorized(req)) {
    return Response.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET" },
      { status: 401 },
    );
  }

  try {
    // ШАГ 2: Извлечение параметров из URL query string
    const url = new URL(req.url);
    const targetMonthParam = url.searchParams.get("targetMonth") || undefined;
    const schoolIdParam = url.searchParams.get("schoolId");
    const autoCreateParam = url.searchParams.get("autoCreateMissing");
    const markOverdueParam = url.searchParams.get("markOverdue");

    // ШАГ 3: Извлечение параметров из тела запроса (при POST запросе)
    let bodyData: any = {};
    if (req.method === "POST") {
      try {
        bodyData = await req.json();
      } catch {
        // Игнорируем ошибку, если тело запроса пустое
      }
    }

    const targetMonth = bodyData.targetMonth || targetMonthParam;
    const schoolId = bodyData.schoolId ?? (schoolIdParam ? parseInt(schoolIdParam, 10) : undefined);
    const autoCreateMissing = bodyData.autoCreateMissing ?? autoCreateParam === "true";
    const markOverdue = bodyData.markOverdue ?? (markOverdueParam !== "false");

    // ШАГ 4: Запуск сервисного алгоритма проверки абонементов
    const result = await runMonthlySubscriptionCheck(db, {
      targetMonth,
      schoolId: isNaN(schoolId) ? undefined : schoolId,
      autoCreateMissing,
      markOverdue,
      user: { role: "superadmin", permissions: ["super"] },
    });

    // ШАГ 5: Возврат успешного статуса 200 с полной структурой аналитики
    return Response.json(result, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Internal server error during subscription audit" },
      { status: 500 },
    );
  }
}

export { handleCheck as GET, handleCheck as POST };
