import { db } from "@/lib/db";
import { users, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { TRPCError } from "@trpc/server";

export async function changeUserPasswordService(params: {
  userId: number;
  currentPassword: string;
  newPassword: string;
}) {
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);

  if (!user || !user.passwordHash) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Utilizatorul nu a fost găsit sau nu are parolă setată",
    });
  }

  const isMatch = await compare(params.currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Parola curentă este incorectă",
    });
  }

  const passwordHash = await hash(params.newPassword, 12);
  await db
    .update(users)
    .set({
      passwordHash,
      lastChangedAt: new Date(),
    })
    .where(eq(users.id, params.userId));

  // Invalidate any other active sessions
  await db.delete(sessions).where(eq(sessions.userId, params.userId));

  return { success: true };
}
