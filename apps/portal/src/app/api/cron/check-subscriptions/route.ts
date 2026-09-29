import { db } from "@/lib/db";
import { runMonthlySubscriptionCheck } from "@/server/subscriptionCronService";

/**
 * Validates CRON_SECRET token against incoming authorization headers.
 * Guards endpoint from unauthorized public webhook invocations.
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return false; // Fail closed in production
    }
    return true; // Permitted only in development/test environments
  }

  // Method 1: Bearer Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === secret) return true;
  }

  // Method 2: x-cron-secret header (Vercel Cron & cloud schedulers)
  const xCronSecret = req.headers.get("x-cron-secret");
  if (xCronSecret && xCronSecret.trim() === secret) {
    return true;
  }

  return false;
}

/**
 * GET/POST handler for automated monthly subscription check.
 */
async function handleCheck(req: Request) {
  // Step 1: Authorization check
  if (!isAuthorized(req)) {
    return Response.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET" },
      { status: 401 },
    );
  }

  try {
    // Step 2: Extract query params
    const url = new URL(req.url);
    const targetMonthParam = url.searchParams.get("targetMonth") || undefined;
    const schoolIdParam = url.searchParams.get("schoolId");
    const autoCreateParam = url.searchParams.get("autoCreateMissing");
    const markOverdueParam = url.searchParams.get("markOverdue");

    // Step 3: Extract body params if POST
    let bodyData: any = {};
    if (req.method === "POST") {
      try {
        bodyData = await req.json();
      } catch {
        // Ignore empty body
      }
    }

    const targetMonth = bodyData.targetMonth || targetMonthParam;
    const schoolId = bodyData.schoolId ?? (schoolIdParam ? parseInt(schoolIdParam, 10) : undefined);
    const autoCreateMissing = bodyData.autoCreateMissing ?? autoCreateParam === "true";
    const markOverdue = bodyData.markOverdue ?? (markOverdueParam !== "false");

    // Step 4: Run subscription check
    const result = await runMonthlySubscriptionCheck(db, {
      targetMonth,
      schoolId: isNaN(schoolId) ? undefined : schoolId,
      autoCreateMissing,
      markOverdue,
      user: { role: "superadmin", permissions: ["super"] },
    });

    return Response.json(result, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Internal server error during subscription audit" },
      { status: 500 },
    );
  }
}

export { handleCheck as GET, handleCheck as POST };
