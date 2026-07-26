import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test(modelName) {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Tell me a joke.",
    });
    console.log(`Success with ${modelName}`);
  } catch (e) {
    console.error(`Failed with ${modelName}:`, e.message);
  }
}
test("gemini-3.1-pro-preview");
test("gemini-2.5-pro");
test("gemini-2.5-flash");
test("gemini-2.0-flash");
test("gemini-3.1-flash");
