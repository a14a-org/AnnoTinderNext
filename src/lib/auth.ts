import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Get the current session (server-side)
 */
export async function getSession() {
  return await auth();
}

/**
 * Require authentication for an API route
 * Returns the userId if authenticated, or a 401 response if not
 */
export async function requireAuth(): Promise<
  | { userId: string; error: null }
  | { userId: null; error: NextResponse }
> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId, error: null };
}

/**
 * Require ownership of a form
 * Returns the form if the user owns it, or an error response if not
 */
export async function requireFormOwnership(formId: string) {
  const { userId, error } = await requireAuth();

  if (error) {
    return { form: null, userId: null, error };
  }

  const form = await db.form.findFirst({
    where: {
      id: formId,
      userId,
    },
  });

  if (!form) {
    return {
      form: null,
      userId,
      error: NextResponse.json(
        { error: "Form not found or access denied" },
        { status: 404 }
      ),
    };
  }

  return { form, userId, error: null };
}
