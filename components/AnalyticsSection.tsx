
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Session } from '../types';
import { TrendingUp, DollarSign, Users, Award, CalendarDays, CalendarRange } from 'lucide-react';

interface AnalyticsSectionProps {
  sessions: Session[];
}

type TimeScale = 'day' | 'month' | 'year';

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ sessions }) => {
  const [timeScale, setTimeScale] = useState<TimeScale>('day');

  const stats = useMemo(() => {
    const totalCost = sessions.reduce((sum, s) => sum + s.courtFee + (s.shuttleQty * s.shuttlePrice), 0);
    const totalParticipants = sessions.reduce((sum, s) => sum + s.participants.length, 0);
    const avgCostPerSession = sessions.length > 0 ? totalCost / sessions.length : 0;
    
    const groupedData = sessions.reduce((acc: any, session) => {
      let key = session.date;
      if (timeScale === 'month') {
        key = session.date.substring(0, 7);
      } else if (timeScale === 'year') {
        key = session.date.substring(0, 4);
      }

      const cost = session.courtFee + (session.shuttleQty * session.shuttlePrice);
      if (!acc[key]) acc[key] = { label: key, cost: 0, participants: 0, count: 0 };
      
      acc[key].cost += cost;
      acc[key].participants += session.participants.length;
      acc[key].count += 1;
      return acc;
    }, {});

    const chartData = Object.values(groupedData).sort((a: any, b: any) => a.label.localeCompare(b.label));

    return { totalCost, totalParticipants, avgCostPerSession, chartData };
  }, [sessions, timeScale]);

  const scaleTabs = [
    { id: 'day', label: '按日', icon: CalendarDays },
    { id: 'month', label: '按月', icon: CalendarRange },
    { id: 'year', label: '按年', icon: CalendarRange },
  ];

  return (
    <div className="vstack gap-4">
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-soft rounded-4 p-4 d-flex flex-row align-items-center gap-4">
            <div className="bg-success bg-opacity-10 text-success rounded-4 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <DollarSign size={28} />
            </div>
            <div>
              <p className="small text-muted fw-bold mb-0">累计总开销</p>
              <h4 className="fw-black mb-0 text-dark">RM {stats.totalCost.toFixed(2)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-soft rounded-4 p-4 d-flex flex-row align-items-center gap-4">
            <div className="bg-primary bg-opacity-10 text-primary rounded-4 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <Users size={28} />
            </div>
            <div>
              <p className="small text-muted fw-bold mb-0">累计参与人次</p>
              <h4 className="fw-black mb-0 text-dark">{stats.totalParticipants}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-soft rounded-4 p-4 d-flex flex-row align-items-center gap-4">
            <div className="bg-warning bg-opacity-10 text-warning rounded-4 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <Award size={28} />
            </div>
            <div>
              <p className="small text-muted fw-bold mb-0">场均开销 (AA前)</p>
              <h4 className="fw-black mb-0 text-dark">RM {stats.avgCostPerSession.toFixed(2)}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-center justify-content-md-start">
        <div className="nav nav-pills bg-light p-1 rounded-3 border">
          {scaleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeScale(tab.id as TimeScale)}
              className={`nav-link small fw-black border-0 rounded-2 py-1 px-4 ${timeScale === tab.id ? 'active shadow-sm' : ''}`}
            >
              <span className="d-flex align-items-center gap-1">
                <tab.icon size={14} />
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card border-0 shadow-soft rounded-4xl p-4 p-md-5 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h5 className="fw-black mb-1">开销趋势</h5>
            <p className="small text-muted mb-0">总金额变化曲线 ({timeScale === 'day' ? '每日' : timeScale === 'month' ? '每月' : '每年'})</p>
          </div>
          <TrendingUp size={24} className="text-success" />
        </div>
        
        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}}
              />
              <Tooltip 
                formatter={(value: number) => [`RM ${value.toFixed(2)}`, '总支出']}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="cost" 
                stroke="#10b981" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorCost)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card border-0 shadow-soft rounded-4xl p-4 p-md-5 bg-white">
         <div className="mb-5">
           <h5 className="fw-black mb-1">打球人次分布</h5>
           <p className="small text-muted mb-0">直观对比不同时间段的参与活跃度</p>
         </div>
         <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc', radius: 10}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Bar 
                dataKey="participants" 
                name="累计人次"
                fill="#3b82f6" 
                radius={[10, 10, 0, 0]} 
                barSize={timeScale === 'day' ? 24 : 48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
