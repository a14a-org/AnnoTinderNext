import type { Question } from "../types";

// Sort questions in the correct logical order for the form flow
export const sortQuestionsForFlow = (questions: Question[]) => {
  const welcomeScreen = questions.find((q) => q.type === "WELCOME_SCREEN");
  const informedConsent = questions.find((q) => q.type === "INFORMED_CONSENT");
  const demographics = questions.find((q) => q.type === "DEMOGRAPHICS");
  const instructions = questions.find((q) => q.type === "INSTRUCTIONS");
  const thankYouScreen = questions.find((q) => q.type === "THANK_YOU_SCREEN");

  const regularQuestions = questions.filter(
    (q) =>
      q.type !== "WELCOME_SCREEN" &&
      q.type !== "INFORMED_CONSENT" &&
      q.type !== "DEMOGRAPHICS" &&
      q.type !== "INSTRUCTIONS" &&
      q.type !== "THANK_YOU_SCREEN"
  );

  // Return in correct order: Welcome -> Consent -> Demographics -> Instructions -> Regular -> Thank You
  return [
    welcomeScreen,
    informedConsent,
    demographics,
    instructions,
    ...regularQuestions,
    thankYouScreen,
  ].filter((q): q is Question => q !== undefined);
};
