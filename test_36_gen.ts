import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test(modelName) {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Tell me a joke.",
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    console.log(`Success with ${modelName}`);
  } catch (e) {
    console.error(`Failed with ${modelName}:`, e.message);
  }
}
test("gemini-3.6-flash");
