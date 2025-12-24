
import { GoogleGenAI } from "@google/genai";

export const getSessionAdvice = async (sessionsSummary: string) => {
  try {
    // 确保 API Key 获取正常
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key is missing in environment");
      return "请在部署环境中配置 API_KEY 以启用 AI 智能建议。";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // 使用 gemini-3-flash-preview 模型，速度快且成本低，适合此类简单分析
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `你是一位羽毛球俱乐部的高级管理人。根据以下最近的打球数据摘要，请给出3条简洁明了的建议，关于活动频率、费用控制或场地安排。用中文回答，保持专业和鼓励性。
          
          数据摘要:
          ${sessionsSummary}`
        }]
      }],
      config: {
        systemInstruction: "你是一个专业的运动社群运营助手，你的回答应该幽默风趣且具有实操价值。输出格式为 Markdown 列表。回答请保持简短，不超过 150 字。",
        temperature: 0.8,
      }
    });

    return response.text;
  } catch (error: any) {
    console.error("AI Insight Error:", error);
    // 输出更具体的错误信息以便调试
    if (error.message?.includes("API_KEY_INVALID")) {
      return "API Key 无效，请检查配置。";
    }
    return "暂时无法提供AI建议。继续努力运动吧！";
  }
};
