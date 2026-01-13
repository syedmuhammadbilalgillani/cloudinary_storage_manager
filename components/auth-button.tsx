"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="px-4 py-2 text-zinc-600 dark:text-zinc-400">Loading...</div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="hidden sm:inline">Signed in as </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {session.user?.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Sign in
    </button>
  );
}