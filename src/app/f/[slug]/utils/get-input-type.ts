// Helper to get input type based on question type
export const getInputType = (questionType: string): "email" | "number" | "text" => {
  if (questionType === "EMAIL") return "email";
  if (questionType === "NUMBER") return "number";
  return "text";
};
