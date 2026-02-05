import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// 使用可选链 (?.) 安全获取环境变量
const apiKey = import.meta.env?.VITE_API_KEY || "";

// 初始化 AI
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key-for-init" });

export const analyzeVictim = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    if (!apiKey || apiKey.length < 10) {
      throw new Error("未检测到有效的 API Key。请在 Vercel 环境变量中配置 VITE_API_KEY 并重新部署。");
    }

    const prompt = `
      Look at this person's face. Based on their expression, lighting, or vibe, generate a funny "Roast" or "Diagnostic Report".
      
      Requirements:
      1. Language: Chinese (Simplified).
      2. Tone: Scientific but mocking, sarcastic, "Black Mirror" style.
      3. Content: Make up a funny "psychological flaw" or "future misfortune" based on the photo. Keep it lighthearted enough to be a prank.
    `;

    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
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
              description: "A short 4-word pseudo-scientific label"
            },
            roast: {
              type: Type.STRING,
              description: "A 2-3 sentence analysis."
            },
            dangerLevel: {
              type: Type.INTEGER,
              description: "A number between 60 and 100."
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
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isKeyError = errorMessage.includes("API Key") || errorMessage.includes("403");

    return {
      title: isKeyError ? "系统未授权" : "生物力场无法解析",
      roast: isKeyError 
        ? "API Key配置失败。请检查Vercel环境变量 VITE_API_KEY。"
        : "检测到你的颜值由于过于逆天导致服务器主动断开连接。建议更换脸部配件后再试。",
      dangerLevel: 99
    };
  }
};