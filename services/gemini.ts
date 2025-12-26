
import { GoogleGenAI } from "@google/genai";

export const getSessionAdvice = async (sessionsSummary: string) => {
  try {
    // 兼容多种环境的 Key 获取逻辑
    // 1. 优先尝试标准的 process.env.API_KEY (当前环境)
    // 2. 备选尝试 Vite 的 import.meta.env.VITE_API_KEY (Vercel/Vite 环境)
    const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;
    
    if (!apiKey) {
      console.warn("未检测到 API_KEY 或 VITE_API_KEY 环境变量。");
      return "请在环境变量中配置 API_KEY 以启用 AI 功能。";
    }

    // 初始化 Gemini API
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `你是一位专业的羽毛球社群管家。以下是最近 3 场打球的活动摘要（日期、费用、人数、用球量）。请针对这些数据提供 3 条实用的建议，旨在提高社群活跃度、控制成本或优化场地安排。要求用中文回答，风格幽默且专业，每条建议控制在 50 字以内。

数据摘要：
${sessionsSummary}`
        }]
      }],
      config: {
        systemInstruction: "你是一个专业的羽毛球运动分析师，擅长根据有限的数据给出深刻且有趣的社区运营建议。请使用 Markdown 列表格式输出。",
        temperature: 0.7,
      }
    });

    return response.text || "AI 管家正在热身，请稍后再试。";
  } catch (error: any) {
    console.error("AI Insight Error:", error);
    
    if (error.message?.includes("API_KEY_INVALID")) {
      return "API Key 无效，请检查环境变量配置。";
    }
    
    return "暂时无法提供AI建议。继续努力运动吧！";
  }
};
