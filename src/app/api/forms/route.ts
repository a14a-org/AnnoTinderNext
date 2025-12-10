import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET - List all forms for the current user
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const forms = await db.form.findMany({
      where: {
        userId,
      },
      include: {
        _count: {
          select: {
            questions: true,
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error("Failed to fetch forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

// POST - Create a new form
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 30);
    const slug = `${baseSlug}-${nanoid(6)}`;

    const form = await db.form.create({
      data: {
        title,
        description,
        slug,
        userId,
        // Create default welcome and thank you screens
        questions: {
          create: [
            {
              type: "WELCOME_SCREEN",
              title: "",
              description: description || "",
              displayOrder: 0,
            },
            {
              type: "THANK_YOU_SCREEN",
              title: "Thank you!",
              description: "Your response has been recorded.",
              displayOrder: 999,
            },
          ],
        },
      },
      include: {
        questions: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error("Failed to create form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}
