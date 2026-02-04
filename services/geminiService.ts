import { GoogleGenAI, Type } from "@google/generative-ai";
import { AnalysisResult } from "../types";

// 获取 Vercel 设置的环境变量 VITE_API_KEY
// 使用安全访问方式防止在某些环境中崩溃
const getApiKey = () => {
  try {
    // 检查 import.meta.env 是否存在
    if (import.meta && import.meta.env) {
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    console.warn("Environment variable access failed", e);
  }
  return "";
};

const apiKey = getApiKey();

// Initialize AI with a dummy key if missing to prevent immediate crash on load.
// The real check happens in analyzeVictim.
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key" });

export const analyzeVictim = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // 检查是否配置了 API Key
    if (!apiKey) {
      throw new Error("未检测到 API Key。请确保在 Vercel 环境变量中配置了 VITE_API_KEY。");
    }

    const prompt = `
      Look at this person's face. Based on their expression, lighting, or vibe, generate a funny "Roast" or "Diagnostic Report".
      
      Requirements:
      1. Language: Chinese (Simplified).
      2. Tone: Scientific but mocking, sarcastic, "Black Mirror" style.
      3. Content: Make up a funny "psychological flaw" or "future misfortune" based on the photo. Keep it lighthearted enough to be a prank, but sound serious initially.
    `;

    // Extract the raw base64 string (remove data:image/jpeg;base64, prefix if present)
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: "You are a cynical, humorous, and slightly mean AI 'Soul Scanner'.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A short 4-word pseudo-scientific label (e.g., '重度智商欠费体质')"
            },
            roast: {
              type: Type.STRING,
              description: "A 2-3 sentence analysis explaining why they are like this."
            },
            dangerLevel: {
              type: Type.INTEGER,
              description: "A number between 60 and 100 indicating how 'hopeless' they are."
            }
          },
          required: ["title", "roast", "dangerLevel"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback if API fails (so the prank still works)
    return {
      title: "生物力场无法解析",
      roast: "检测到你的颜值由于过于逆天导致服务器主动断开连接。建议更换脸部配件后再试。（可能是API Key没配对，或者额度用完了）",
      dangerLevel: 99
    };
  }
};
