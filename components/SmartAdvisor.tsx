
import React from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { getSessionAdvice } from '../services/gemini';
import { Session } from '../types';

interface SmartAdvisorProps {
  sessions: Session[];
}

const SmartAdvisor: React.FC<SmartAdvisorProps> = ({ sessions }) => {
  const [advice, setAdvice] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const totalParticipantsHash = sessions.map(s => s.participants.length).join('-');

  const fetchAdvice = async () => {
    if (sessions.length === 0) {
      setAdvice("还没有活动数据，快去创建你的第一场羽毛球局吧！");
      return;
    }

    setLoading(true);
    const summary = sessions.slice(0, 3).map(s => (
      `日期: ${s.date}, 场地费: ${s.courtFee}, 人数: ${s.participants.length}, 球数: ${s.shuttleQty}`
    )).join('; ');
    
    const result = await getSessionAdvice(summary);
    setAdvice(result || "没能生成建议，请稍后再试。");
    setLoading(false);
  };

  React.useEffect(() => {
    fetchAdvice();
  }, [sessions.length, totalParticipantsHash]);

  return (
    <div className="card border-0 rounded-4xl text-white shadow-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}>
      <div className="card-body p-4 p-md-5">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2">
            <Sparkles size={20} className="text-white text-opacity-75" />
            <h6 className="fw-black mb-0">智能管家</h6>
          </div>
          <button 
            onClick={fetchAdvice} 
            disabled={loading}
            className="btn btn-link text-white text-opacity-50 p-1 hover-white transition-all border-0"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          </button>
        </div>

        <div className="small opacity-95 lh-lg">
          {loading ? (
            <div className="vstack gap-2 py-2">
              <div className="bg-white bg-opacity-20 rounded-pill w-100" style={{ height: '12px' }}></div>
              <div className="bg-white bg-opacity-20 rounded-pill w-75" style={{ height: '12px' }}></div>
              <div className="bg-white bg-opacity-20 rounded-pill w-50" style={{ height: '12px' }}></div>
            </div>
          ) : (
            <div 
              className="prose-sm text-white-50" 
              dangerouslySetInnerHTML={{ __html: advice?.replace(/\n/g, '<br/>') || '' }} 
            />
          )}
        </div>
        
        <div className="mt-4 pt-4 border-top border-white border-opacity-10 d-flex align-items-center justify-content-between">
          <small className="text-uppercase fw-black opacity-50 tracking-widest" style={{ fontSize: '0.6rem' }}>Badminton Insights</small>
        </div>
      </div>
      <style>{`
        .hover-white:hover { color: white !important; transform: rotate(180deg); }
        .prose-sm { color: white !important; font-weight: 500; }
      `}</style>
    </div>
  );
};

export default SmartAdvisor;
