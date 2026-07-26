import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Tell me a joke.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    console.log(`Success!`);
  } catch (e) {
    console.error(`Error:`, e.status, e.message);
  }
}
test();
