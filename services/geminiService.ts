import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// 使用可选链 (?.) 安全获取环境变量
const apiKey = import.meta.env?.VITE_API_KEY || "";

// 初始化 AI
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key-for-init" });

export const analyzeVictim = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    if (!apiKey || apiKey.length < 10) {
      throw new Error("API Key Missing");
    }

    // 针对微信整蛊优化的 Prompt，要求 AI 极度毒舌
    const prompt = `
      请你扮演一个来自未来的、刻薄的、毒舌的 AI "人类质量检测员"。
      请查看这张照片（如果是自拍）。请根据面相、表情、背景或光线，生成一份"人类质量检测报告"。

      要求：
      1. 语言：中文（简短、好笑、极其毒舌）。
      2. 风格：像脱口秀演员吐槽，或者算命先生但是是赛博朋克风格。
      3. 内容：
         - 编造一个搞笑的"基因缺陷"或"未来运势"。
         - 不要客气，要是能让朋友看了想打人的那种好笑。
         - 无论照片里是谁，都要找出槽点（比如：发际线在后退、眼神清澈愚蠢、散发着单身狗的芬芳等）。

      返回 JSON 格式：
      - title: 4个字的成语或短语，作为"诊断标签"（例如：注定搬砖、智商欠费、颜值洼地、母胎solo）。
      - roast: 2-3句话的毒舌点评。
      - dangerLevel: 一个 60-100 之间的随机整数，代表"丑陋/危险/废柴指数"。
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
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            roast: { type: Type.STRING },
            dangerLevel: { type: Type.INTEGER }
          },
          required: ["title", "roast", "dangerLevel"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: "无法直视",
      roast: "系统检测到该生物的面部数据过于离谱，导致服务器显卡冒烟了。建议您回炉重造。",
      dangerLevel: 999
    };
  }
};