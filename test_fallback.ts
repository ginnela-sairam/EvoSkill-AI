import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
interface CircuitBreakerState { failures: number; lastFailureTime: number; isOpen: boolean; }
const geminiCircuit: CircuitBreakerState = { failures: 0, lastFailureTime: 0, isOpen: false };
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_RESET_TIMEOUT_MS = 60000;
function checkCircuitBreaker(circuit: CircuitBreakerState): boolean { return true; }
function recordSuccess(circuit: CircuitBreakerState) { }
function recordFailure(circuit: CircuitBreakerState) { }

async function executeWithSmartFallbacks(ai: GoogleGenAI, prompt: string, isJson: boolean = false, useSearch: boolean = false, requireThinking: boolean = true) {
  const modelsToTry = requireThinking ? [
    { model: "gemini-3.1-pro-preview", useThinking: true },
    { model: "gemini-3.1-pro-preview", useThinking: false },
    { model: "gemini-3.6-flash", useThinking: true },
    { model: "gemini-3.6-flash", useThinking: false },
    { model: "gemini-3.5-flash", useThinking: false },
    { model: "gemini-3.1-flash-lite", useThinking: false },
    { model: "gemini-flash-latest", useThinking: false }
  ] : [
    { model: "gemini-3.1-pro-preview", useThinking: false },
    { model: "gemini-3.6-flash", useThinking: false },
    { model: "gemini-3.5-flash", useThinking: false },
    { model: "gemini-3.1-flash-lite", useThinking: false },
    { model: "gemini-flash-latest", useThinking: false }
  ];
  let geminiSuccess = false;
  if (checkCircuitBreaker(geminiCircuit)) {
    for (const config of modelsToTry) {
      let delayMs = 1500;
      for (let i = 0; i < 3; i++) {
        try {
          console.log(`Trying ${config.model} (Thinking: ${config.useThinking}), attempt ${i + 1}`);
          const response = await ai.models.generateContent({
            model: config.model,
            contents: prompt,
            config: {
              ...(isJson ? { responseMimeType: "application/json" } : {}),
              ...(config.useThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } : {}),
              ...(useSearch ? { tools: [{ googleSearch: {} }] } : {})
            },
          });
          console.log("SUCCESS!");
          return response;
        } catch (error: any) {
          const status = error?.status || error?.code;
          const message = error?.message || "";
          console.log(`ERROR ${status}: ${message}`);
          if (message.includes("exceeded your current quota") || message.includes("GenerateContentInputTokensPerModelPerMinute-FreeTier") || (status === 429 && message.includes("limit: 0"))) {
             console.warn(`[${config.model}] Quota exceeded or free tier unsupported. Trying next model...`);
             break;
          }
          const isRateLimit = status === 429 || status === 503 || message.includes("429") || message.includes("503") || message.includes("UNAVAILABLE") || message.includes("overloaded");
          if (isRateLimit) {
            console.warn(`[${config.model}] Rate limited/503. Retrying in ${delayMs}ms...`);
            break; // Just break for testing
          } else {
            break;
          }
        }
      }
    }
  }
}
executeWithSmartFallbacks(ai, "test");
