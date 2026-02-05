import { AnalysisResult } from "../types";

export const analyzeVictim = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // 调用后端 API（Vercel Serverless Function）
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as AnalysisResult;

  } catch (error: any) {
    console.error("API Error:", error);
    const errorMessage = error?.message || JSON.stringify(error);
    return {
      title: "系统崩溃",
      roast: `检测失败，原因太尴尬了：${errorMessage}。可能是网络问题，也可能是您的长相真的把 AI 吓坏了。`,
      dangerLevel: 999,
      score: 0,
      luckyItem: "路由器重启按钮",
      animalMatch: "断网的恐龙"
    };
  }
};