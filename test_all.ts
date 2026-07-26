import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testAll() {
  const models = [
    "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite", 
    "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash",
    "gemini-3.1-flash-lite", "gemini-flash-latest"
  ];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: "Hello",
      });
      console.log(`✅ Success with ${model}`);
    } catch (e) {
      console.log(`❌ Failed with ${model}: ${e.message.split('\n')[0]}`);
    }
  }
}
testAll();
