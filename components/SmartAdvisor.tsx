
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { getSessionAdvice } from '../services/gemini';
import { Session } from '../types';

interface SmartAdvisorProps {
  sessions: Session[];
}

const SmartAdvisor: React.FC<SmartAdvisorProps> = ({ sessions }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 计算总参与人数作为刷新的依赖标识
  const totalParticipantsHash = sessions.map(s => s.participants.length).join('-');

  const fetchAdvice = async () => {
    if (sessions.length === 0) {
      setAdvice("还没有活动数据，快去创建你的第一场羽毛球局吧！");
      return;
    }

    setLoading(true);
    // 只取最近3场作为分析上下文，包含人数信息
    const summary = sessions.slice(0, 3).map(s => (
      `日期: ${s.date}, 场地费: ${s.courtFee}, 人数: ${s.participants.length}, 球数: ${s.shuttleQty}`
    )).join('; ');
    
    const result = await getSessionAdvice(summary);
    setAdvice(result || "没能生成建议，请稍后再试。");
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvice();
    // 依赖项增加了 totalParticipantsHash，当任何一场的人数变动，AI 都会刷新
  }, [sessions.length, totalParticipantsHash]);

  return (
    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-xl shadow-emerald-200/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-200" />
          <h3 className="font-bold">智能管家</h3>
        </div>
        <button 
          onClick={fetchAdvice} 
          disabled={loading}
          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
          title="手动刷新建议"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      <div className="text-sm leading-relaxed opacity-95">
        {loading ? (
          <div className="space-y-2 py-2">
            <div className="h-3 bg-white/20 rounded-full w-full animate-pulse"></div>
            <div className="h-3 bg-white/20 rounded-full w-11/12 animate-pulse"></div>
            <div className="h-3 bg-white/20 rounded-full w-4/5 animate-pulse"></div>
          </div>
        ) : (
          <div 
            className="prose prose-invert prose-sm max-w-none" 
            dangerouslySetInnerHTML={{ __html: advice?.replace(/\n/g, '<br/>') || '' }} 
          />
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Badminton Insights</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse delay-75"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
};

export default SmartAdvisor;
