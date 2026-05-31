/**
 * Integration tests against a LOCAL throwaway SQLite test DB (file:./test.db).
 * These NEVER touch any real/remote database — they require DATABASE_URL to
 * point at a file: SQLite URL and skip otherwise (e.g. local vitest without
 * the test DB provisioned). CI provisions it via `prisma db push`.
 *
 * Covers the data-layer behaviour the form editor + auth/confirm flows rely on:
 *   - form create / edit (title + description sync target)
 *   - question create / edit / option add (question-card / question-editor)
 *   - special screens (welcome / thank-you) persistence
 *   - magic-link verification token round-trip (auth/confirm path)
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
// Uses the SQLite test client generated from prisma/schema.test.prisma
// (provider=sqlite) so it never embeds a postgres datasource.
import { PrismaClient } from "@/generated/prisma-test";

const dbUrl = process.env.DATABASE_URL ?? "";
const isLocalSqlite = dbUrl.startsWith("file:");

const d = isLocalSqlite ? describe : describe.skip;

const prisma = new PrismaClient();

async function seedUser() {
  return prisma.user.create({
    data: { email: `owner-${Date.now()}-${Math.random()}@test.local`, name: "Owner" },
  });
}

d("form editor data layer (local SQLite test DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean slate between tests. Cascades remove questions/options.
    await prisma.questionOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.form.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("creates a form and persists title/description edits", async () => {
    const user = await seedUser();
    const form = await prisma.form.create({
      data: { slug: `s-${Date.now()}`, title: "My form", userId: user.id },
    });
    expect(form.title).toBe("My form");
    expect(form.isPublished).toBe(false);

    const updated = await prisma.form.update({
      where: { id: form.id },
      data: { title: "Renamed", description: "A description" },
    });
    expect(updated.title).toBe("Renamed");
    expect(updated.description).toBe("A description");
  });

  it("creates a question with options and edits an option label", async () => {
    const user = await seedUser();
    const form = await prisma.form.create({
      data: { slug: `s-${Date.now()}`, title: "F", userId: user.id },
    });
    const question = await prisma.question.create({
      data: {
        formId: form.id,
        type: "MULTIPLE_CHOICE",
        title: "Pick one",
        options: {
          create: [
            { label: "Alpha", value: "Alpha", displayOrder: 0 },
            { label: "Beta", value: "Beta", displayOrder: 1 },
          ],
        },
      },
      include: { options: true },
    });
    expect(question.options).toHaveLength(2);

    // Add a third option (question-card "Add option").
    await prisma.questionOption.create({
      data: { questionId: question.id, label: "Option 3", value: "Option 3", displayOrder: 2 },
    });
    // Edit the first option's label.
    const alpha = question.options.find((o) => o.label === "Alpha")!;
    await prisma.questionOption.update({
      where: { id: alpha.id },
      data: { label: "Gamma", value: "Gamma" },
    });

    const reloaded = await prisma.question.findUniqueOrThrow({
      where: { id: question.id },
      include: { options: { orderBy: { displayOrder: "asc" } } },
    });
    expect(reloaded.options.map((o) => o.label)).toEqual(["Gamma", "Beta", "Option 3"]);
  });

  it("persists welcome and thank-you special screens with the form", async () => {
    const user = await seedUser();
    const form = await prisma.form.create({
      data: {
        slug: `s-${Date.now()}`,
        title: "F",
        userId: user.id,
        questions: {
          create: [
            { type: "WELCOME_SCREEN", title: "Welcome", displayOrder: 0 },
            { type: "THANK_YOU_SCREEN", title: "Thanks", displayOrder: 99 },
          ],
        },
      },
      include: { questions: true },
    });
    const types = form.questions.map((q) => q.type).sort();
    expect(types).toEqual(["THANK_YOU_SCREEN", "WELCOME_SCREEN"]);
  });

  it("round-trips a magic-link verification token (auth/confirm path)", async () => {
    const token = await prisma.verificationToken.create({
      data: {
        identifier: "user@test.local",
        token: `tok-${Date.now()}`,
        expires: new Date(Date.now() + 60_000),
      },
    });
    const found = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: token.identifier, token: token.token } },
    });
    expect(found?.token).toBe(token.token);

    // Consuming the token (what clicking the confirmed magic link does).
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: token.identifier, token: token.token } },
    });
    const after = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: token.identifier, token: token.token } },
    });
    expect(after).toBeNull();
  });
});
