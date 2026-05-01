/**
 * Update AAVA INFORMED_CONSENT settings:
 *   - researchTitle: short, plain title
 *   - useCustomSectionsOnly: true (suppresses auto-generated intro that duplicates customSections)
 *   - customSections: cleaned single-pass content with the new "ethnic minority" appeal
 *
 * Snapshots the current settings to backups/ before writing.
 *
 * Dry run:  npx tsx scripts/aava-consent-update.ts
 * Apply:    npx tsx scripts/aava-consent-update.ts --apply
 */

import { mkdirSync, writeFileSync } from "fs";
import { PrismaClient } from "../src/generated/prisma/index.js";

const db = new PrismaClient();
const FORM_SLUG = "aava-1766572857546";
const APPLY = process.argv.includes("--apply");

const NEW_RESEARCH_TITLE = "Nieuwsartikelen annoteren";

const NEW_CUSTOM_SECTIONS = [
  {
    title: "Welkom",
    content:
      'Beste deelnemer,\n\nWelkom bij het onderzoek "Nieuwsartikelen annoteren". Dit onderzoek is een samenwerking tussen de Universiteit van Amsterdam, Omroep Zwart, BNNVARA en de EO.\n\nHeb je een etnische minderheidsachtergrond? Dan heeft de redactie juist jouw perspectief nodig om bij te dragen aan inclusievere nieuwsverslaggeving! In dit onderzoek markeer je in een aantal nieuwsartikelen zinnen die je schadelijk vindt op het gebied van etnische representatie. Jouw annotaties helpen ons om een model te trainen dat journalisten ondersteunt bij dit type werk.\n\nLees de volgende tekst goed door voordat je begint. Als er iets onduidelijk is, kun je contact opnemen met de contactpersoon van Omroep Zwart, BNNVARA of EO.',
  },
  {
    title: "Waarom doen we dit onderzoek?",
    content:
      "Dit project onderzoekt of Artificiële Intelligentie (AI) journalisten kan helpen om inclusiever nieuws te maken. Met behulp van geannoteerde data wordt getest hoe goed zo'n model schadelijke representaties kan herkennen.\n\nHiermee wordt een prototype ontwikkeld van een tool dat nieuwsredacties kan ondersteunen bij het maken van eerlijkere en meer representatieve berichtgeving. Dit onderzoek richt zich met name op het identificeren van nieuwscontent waarin een persoon of groep personen op een schadelijke wijze worden vertegenwoordigd omwille van hun etniciteit.\n\nVoor het ontwikkelen van dit prototype maken we onder meer gebruik van jouw persoonsgegevens evenals de resultaten van de opdracht die je tijdens dit onderzoek zal uitvoeren.",
  },
  {
    title: "Wat gebeurt er tijdens mijn deelname?",
    content:
      "Het onderzoek duurt ongeveer 14 minuten. Deelnemers vullen eerst een korte demografische enquête in en annoteren vervolgens een aantal actuele nieuwsartikelen.\n\nTijdens deze oefening beoordelen deelnemers of de artikelen schadelijke representaties op basis van etniciteit bevatten. Zo ja, dan geven deelnemers een korte toelichting waarom ze tot dit oordeel komen.\n\nLet op: Voor sommige deelnemers kan de inhoud van deze artikelen, inclusief het identificeren van schadelijke representaties, als schokkend, verontrustend, controversieel, onaangenaam of emotioneel belastend worden ervaren. Deelnemers worden immers expliciet gevraagd te oordelen of de artikelen schadelijke representaties bevatten.\n\nJe kunt op ieder moment het onderzoek stoppen door je browser af te sluiten.",
  },
  {
    title: "Is mijn deelname vrijwillig?",
    content:
      "Je deelname is vrijwillig. Als je besluit te stoppen, heeft dat geen gevolgen voor je en je hoeft niet uit te leggen waarom je stopt. Je kunt op ieder moment tijdens het onderzoek besluiten te stoppen door je browser af te sluiten.\n\nNa je deelname wil je misschien niet dat we je persoonsgegevens verder gebruiken. In dat geval kun je je toestemming nog steeds intrekken. Dit kan zo lang we je gegevens nog niet hebben geanonimiseerd. Wanneer de gegevens anoniem zijn, kunnen we de specifieke data over jou niet meer terugvinden en dus niet meer verwijderen.\n\nOm je toestemming in te trekken na deelname, stuur een email naar de contactpersoon.",
  },
  {
    title: "Wat gebeurt er met mijn gegevens?",
    content:
      "In dit onderzoek verzamelen we de volgende persoonsgegevens over je:\n- Gender\n- Leeftijd\n- Onderwijsniveau\n- Politieke voorkeur\n- Etniciteit\n- Religieuze opvattingen\n- Ervaringen met schadelijke content en discriminatie\n\nJe persoonsgegevens worden zorgvuldig behandeld, zoals bepaald door de wet (de Algemene Verordening Gegevensbescherming of AVG).\n\nJe persoonsgegevens worden verzameld, opgeslagen, geanalyseerd, evenals geanonimiseerd door Omroep Zwart.\n\nOnderzoeksgegevens kunnen worden gepubliceerd en hergebruikt in ander onderzoek, maar alleen op een manier waarop jij niet herkend kunt worden.",
  },
  {
    title: "Hoe lang worden mijn gegevens bewaard?",
    content:
      "De onderzoeksgegevens en andere materialen worden beveiligd gearchiveerd voor minstens tien jaar na afloop van het project. We verwijderen je persoonsgegevens zodra de tool is ontwikkeld en getest.",
  },
];

const parseSettings = (raw: unknown): Record<string, unknown> => {
  if (raw === null || raw === undefined) return {};
  if (typeof raw === "string") return JSON.parse(raw) as Record<string, unknown>;
  return raw as Record<string, unknown>;
};

async function main() {
  const form = await db.form.findUnique({
    where: { slug: FORM_SLUG },
    select: { id: true, slug: true, title: true },
  });
  if (!form) throw new Error(`form not found: ${FORM_SLUG}`);

  const consent = await db.question.findFirst({
    where: { formId: form.id, type: "INFORMED_CONSENT" },
    select: { id: true, title: true, settings: true, updatedAt: true },
  });
  if (!consent) throw new Error("INFORMED_CONSENT question not found on form");

  const wasString = typeof consent.settings === "string";
  const before = parseSettings(consent.settings);

  const after: Record<string, unknown> = {
    ...before,
    researchTitle: NEW_RESEARCH_TITLE,
    useCustomSectionsOnly: true,
    customSections: NEW_CUSTOM_SECTIONS,
  };

  // Snapshot to backups/ — keyed by timestamp + question id
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync("backups", { recursive: true });
  const snapshotPath = `backups/aava-consent-${consent.id}-${ts}.json`;
  writeFileSync(
    snapshotPath,
    JSON.stringify(
      {
        snapshotAt: new Date().toISOString(),
        formSlug: form.slug,
        formTitle: form.title,
        questionId: consent.id,
        questionTitle: consent.title,
        questionUpdatedAt: consent.updatedAt.toISOString(),
        settingsStoredAsString: wasString,
        settings: before,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Snapshot written → ${snapshotPath}\n`);

  // Diff summary (full payload is large; show what changed)
  console.log("=== Field changes ===");
  console.log(`researchTitle:          "${before.researchTitle ?? "(none)"}" → "${NEW_RESEARCH_TITLE}"`);
  console.log(`useCustomSectionsOnly:  ${before.useCustomSectionsOnly ?? "(unset)"} → true`);
  const beforeSections = Array.isArray(before.customSections) ? before.customSections : [];
  console.log(`customSections count:   ${beforeSections.length} → ${NEW_CUSTOM_SECTIONS.length}`);
  console.log("\n=== New customSections (titles) ===");
  for (const s of NEW_CUSTOM_SECTIONS) console.log(`  - ${s.title}`);

  if (!APPLY) {
    console.log("\n(dry run — pass --apply to write)");
    await db.$disconnect();
    return;
  }

  await db.question.update({
    where: { id: consent.id },
    data: {
      settings: wasString ? JSON.stringify(after) : after,
    },
  });

  const verify = await db.question.findUnique({
    where: { id: consent.id },
    select: { settings: true, updatedAt: true },
  });
  const verifyParsed = parseSettings(verify?.settings);
  console.log("\nApplied. Verified read-back:");
  console.log(`  researchTitle:          ${JSON.stringify(verifyParsed.researchTitle)}`);
  console.log(`  useCustomSectionsOnly:  ${verifyParsed.useCustomSectionsOnly}`);
  const verifySections = Array.isArray(verifyParsed.customSections) ? verifyParsed.customSections : [];
  console.log(`  customSections count:   ${verifySections.length}`);
  console.log(`  updatedAt:              ${verify?.updatedAt.toISOString()}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
