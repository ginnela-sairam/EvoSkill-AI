import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test(modelName) {
  try {
    const interaction = await ai.interactions.create({
      model: modelName,
      input: "Tell me a joke.",
      generation_config: {
        thinking_level: "HIGH"
      }
    });
    console.log(`Success with ${modelName}`);
  } catch (e) {
    console.error(`Failed with ${modelName}:`, e.message);
  }
}
test("gemini-3.1-pro-preview");
test("gemini-2.5-pro");
