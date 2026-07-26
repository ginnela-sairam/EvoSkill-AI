import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const prompt = `You are an elite career coach and tech strategist. Generate a structured roadmap for this person. Return ONLY valid JSON. {"user_profile_analysis": {"detected_strengths": [], "best_career_path": "", "why_this_path_suits_them": ""}}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    console.log(`Success!`);
  } catch (e) {
    console.error(`Error:`, e.status, e.message);
  }
}
test();
