import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  // 设置 CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // 针对微信整蛊优化的 Prompt
    const prompt = `
      请你扮演一个来自未来的、刻薄的、毒舌的 AI "人类质量检测员"。
      请查看这张照片（如果是自拍）。请根据面相、表情、背景或光线，生成一份"人类质量检测报告"。

      要求：
      1. 语言：中文（简短、好笑、极其毒舌、不要带脏字但要扎心）。
      2. 风格（随机选择一种）：
         - 赛博算命风：用科技词汇胡说八道命运（例如：你的运势代码充满了Bug）。
         - 生物观察风：像在观察某种低等生物（例如：这种灵长类动物的求偶概率为零）。
         - 历史考古风：仿佛在看一个古老的文物（例如：这种发型在2024年就已经灭绝了）。
         - 职场PUA风：像个挑剔的老板（例如：你的长相不仅没有辨识度，甚至有点影响市容）。
      3. 内容：
         - 必须编造一个搞笑的"基因缺陷"、"社交隐患"或"注定失败的未来"。
         - 无论照片里是谁，都要找出槽点（比如：发际线在后退、眼神清澈愚蠢、散发着单身狗的芬芳、长得像没被盘过的核桃等）。
         - 如果照片不清晰或没有人脸，就吐槽拍摄者的拍照技术像帕金森患者。

      返回 JSON 格式：
      - title: 4个字的成语或短语，作为"诊断标签"（例如：注定搬砖、智商欠费、颜值洼地、母胎solo、五行缺智、凭实力单身、长得潦草）。
      - roast: 2-3句话的毒舌点评，必须包含一个具体的比喻。
      - dangerLevel: 一个 60-100 之间的随机整数，代表"丑陋/危险/废柴指数"。
    `;

    const cleanBase64 = image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return res.status(200).json(result);

  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error?.message || JSON.stringify(error);
    return res.status(500).json({ 
      error: 'Analysis failed', 
      details: errorMessage,
      title: "系统崩溃",
      roast: `检测失败，原因太尴尬了：${errorMessage}。建议您检查网络或 API Key，或者您的长相真的把 AI 吓坏了。`,
      dangerLevel: 999
    });
  }
}