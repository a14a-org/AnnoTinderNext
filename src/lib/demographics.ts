/**
 * Demographics Question Type
 *
 * Collects participant demographics for quota-based assignment.
 * Typically shown after informed consent, before annotation task.
 */

export interface DemographicField {
  id: string;
  label: string;
  type: "single_choice" | "text";
  options?: string[];
  required: boolean;
  placeholder?: string;
}

export interface DemographicsSettings {
  title: string;
  description: string;
  fields: DemographicField[];
  // Classification rules
  caucasianEthnicities: string[];
}

export const DEFAULT_DEMOGRAPHICS_SETTINGS: DemographicsSettings = {
  title: "Over jezelf",
  description: "We stellen je een paar korte vragen om te zorgen dat ons onderzoek een goede afspiegeling is van de Nederlandse samenleving.",
  fields: [
    {
      id: "gender",
      label: "Wat is je geslacht?",
      type: "single_choice",
      options: ["Man", "Vrouw", "Anders", "Zeg ik liever niet"],
      required: true,
    },
    {
      id: "ethnicity",
      label: "Tot welke bevolkingsgroep reken je jezelf?",
      type: "single_choice",
      options: [
        "Nederlands",
        "Surinaams",
        "Turks",
        "Marokkaans",
        "Antilliaans/Arubaans",
        "Indonesisch",
        "Duits",
        "Pools",
        "Anders",
      ],
      required: true,
    },
    {
      id: "ageRange",
      label: "Wat is je leeftijdscategorie?",
      type: "single_choice",
      options: [
        "18-24",
        "25-34",
        "35-44",
        "45-54",
        "55-64",
        "65+",
      ],
      required: true,
    },
  ],
  caucasianEthnicities: ["Nederlands", "Duits", "Pools"],
};

export interface DemographicAnswers {
  gender?: string;
  ethnicity?: string;
  ageRange?: string;
  [key: string]: string | undefined;
}

/**
 * Classify a user's demographic group based on ethnicity
 */
export function classifyDemographic(
  ethnicity: string,
  caucasianEthnicities: string[] = DEFAULT_DEMOGRAPHICS_SETTINGS.caucasianEthnicities
): "caucasian" | "minority" {
  return caucasianEthnicities
    .map((e) => e.toLowerCase())
    .includes(ethnicity.toLowerCase())
    ? "caucasian"
    : "minority";
}

/**
 * Validate that all required fields have answers
 */
export function validateDemographics(
  answers: DemographicAnswers,
  settings: DemographicsSettings
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const field of settings.fields) {
    if (field.required && !answers[field.id]) {
      missingFields.push(field.id);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
