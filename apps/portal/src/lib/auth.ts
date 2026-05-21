'use server';

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@brio-md/auth';

export async function signIn(provider: string, credentials?: Record<string, string>, options?: { redirectTo?: string }) {
  return nextAuthSignIn(provider, credentials, options);
}

export async function signOut(options?: { redirectTo?: string }) {
  return nextAuthSignOut(options);
}