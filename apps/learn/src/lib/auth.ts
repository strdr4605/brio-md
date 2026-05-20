'use server';

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@brio-md/auth';

export async function signIn(provider: string, credentials?: Record<string, string>) {
  return nextAuthSignIn(provider, credentials);
}

export async function signOut() {
  return nextAuthSignOut();
}