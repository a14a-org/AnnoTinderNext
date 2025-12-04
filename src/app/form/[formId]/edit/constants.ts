import {
  Type,
  AlignLeft,
  Mail,
  Hash,
  ListChecks,
  CheckSquare,
  ChevronDown,
  Star,
  ToggleLeft,
  Calendar,
  ShieldCheck,
  Highlighter,
  Users,
} from "lucide-react";

export const questionTypes = [
  { type: "SHORT_TEXT", label: "Short Text", icon: Type },
  { type: "LONG_TEXT", label: "Long Text", icon: AlignLeft },
  { type: "EMAIL", label: "Email", icon: Mail },
  { type: "NUMBER", label: "Number", icon: Hash },
  { type: "MULTIPLE_CHOICE", label: "Multiple Choice", icon: ListChecks },
  { type: "CHECKBOXES", label: "Checkboxes", icon: CheckSquare },
  { type: "DROPDOWN", label: "Dropdown", icon: ChevronDown },
  { type: "RATING", label: "Rating", icon: Star },
  { type: "YES_NO", label: "Yes / No", icon: ToggleLeft },
  { type: "DATE", label: "Date", icon: Calendar },
  { type: "INFORMED_CONSENT", label: "Informed Consent", icon: ShieldCheck },
  { type: "TEXT_ANNOTATION", label: "Text Annotation", icon: Highlighter },
  { type: "DEMOGRAPHICS", label: "Demographics", icon: Users },
] as const;

export const isChoiceType = (type: string) =>
  ["MULTIPLE_CHOICE", "CHECKBOXES", "DROPDOWN"].includes(type);

export const DEFAULT_QUOTA_SETTINGS = {
  groupByField: "ethnicity",
  groups: {
    dutch: { values: ["Nederlands", "Duits", "Polls"], target: 1 },
    minority: { values: ["Surinaams", "Turks", "Marokkaans", "Antilliaans/Arubaans", "Indonesisch", "Anders"], target: 2 },
  },
};
