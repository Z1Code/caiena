import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiFlash = "gemini-2.5-flash-preview-05-20";
export const geminiChat = "gemini-2.0-flash";

export function getModel(modelName: string) {
  return genAI.getGenerativeModel({ model: modelName });
}

export { genAI };
