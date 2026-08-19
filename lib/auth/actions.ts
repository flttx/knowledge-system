"use server";

import { redirect } from "next/navigation";

import {
  clearSession,
  setSession,
} from "@/lib/auth/server";
import { authenticateUser } from "@/lib/auth/service";
import type { AuthActionState, AuthUser } from "@/lib/auth/types";

const INVALID_LOGIN_MESSAGE = "INVALID_CREDENTIALS";

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const usernameValue = formData.get("username");
  const passwordValue = formData.get("password");
  const username = typeof usernameValue === "string" ? usernameValue : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  let user: AuthUser | null = null;
  try {
    user = await authenticateUser(username, password);
  } catch (error: unknown) {
    console.error("[auth] login failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "AUTH_UNAVAILABLE" };
  }

  if (!user) {
    return { error: INVALID_LOGIN_MESSAGE };
  }

  try {
    await setSession(user.id);
  } catch (error: unknown) {
    console.error("[auth] session creation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "AUTH_UNAVAILABLE" };
  }

  redirect("/home");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
