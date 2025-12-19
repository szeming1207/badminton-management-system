
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getSessionAdvice = async (sessionsSummary: string) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一位羽毛球俱乐部的高级管理人。根据以下最近的打球数据摘要，请给出3条简洁明了的建议，关于活动频率、费用控制或场地安排。用中文回答，保持专业和鼓励性。
      
      数据摘要:
      ${sessionsSummary}`,
      config: {
        systemInstruction: "你是一个专业的运动社群运营助手，你的回答应该幽默风契且具有实操价值。输出格式为Markdown列表。",
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "暂时无法提供AI建议。继续努力运动吧！";
  }
};
