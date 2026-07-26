import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Tell me a joke in JSON.",
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        tools: [{ googleSearch: {} }]
      }
    });
    console.log(`Success!`);
  } catch (e) {
    console.error(`Error:`, e.status, e.message);
  }
}
test();
