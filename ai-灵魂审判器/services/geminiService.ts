import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeVictim = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    const prompt = `
      You are a cynical, humorous, and slightly mean AI "Soul Scanner". 
      Look at this person's face. Based on their expression, lighting, or vibe, generate a funny "Roast" or "Diagnostic Report".
      
      Requirements:
      1. Language: Chinese (Simpified).
      2. Tone: Scientific but mocking, sarcastic, "Black Mirror" style.
      3. Content: Make up a funny "psychological flaw" or "future misfortune" based on the photo. Keep it lighthearted enough to be a prank, but sound serious initially.
      4. Output Format: Pure JSON.
      
      JSON Schema:
      {
        "title": "A short 4-word pseudo-scientific label (e.g., '重度智商欠费体质')",
        "roast": "A 2-3 sentence analysis explaining why they are like this.",
        "dangerLevel": A number between 60 and 100 indicating how "hopeless" they are.
      }
    `;

    // Extract the raw base64 string (remove data:image/jpeg;base64, prefix if present)
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
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
      roast: "你的长相过于复杂，导致AI核心处理器过热爆炸。这可能是一种天赋，建议不要出门。",
      dangerLevel: 99
    };
  }
};