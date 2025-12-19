
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Session } from '../types';
import { TrendingUp, DollarSign, Users, Award, CalendarDays, CalendarRange, CalendarDays as CalendarYear } from 'lucide-react';

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
    
    // 根据时间跨度聚合数据
    const groupedData = sessions.reduce((acc: any, session) => {
      let key = session.date; // 默认 'day'
      if (timeScale === 'month') {
        key = session.date.substring(0, 7); // YYYY-MM
      } else if (timeScale === 'year') {
        key = session.date.substring(0, 4); // YYYY
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
    { id: 'year', label: '按年', icon: CalendarYear },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">累计总开销</p>
            <p className="text-2xl font-bold text-slate-800">RM {stats.totalCost.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">累计参与人次</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalParticipants}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">场均开销 (AA前)</p>
            <p className="text-2xl font-bold text-slate-800">RM {stats.avgCostPerSession.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 控制条 */}
      <div className="flex justify-center md:justify-start">
        <div className="bg-slate-200/50 p-1.5 rounded-2xl inline-flex shadow-inner">
          {scaleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeScale(tab.id as TimeScale)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${
                timeScale === tab.id 
                  ? 'bg-white text-emerald-600 shadow-md transform scale-105' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 开销趋势 */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-black text-slate-800">开销趋势 ({timeScale === 'day' ? '每日' : timeScale === 'month' ? '每月' : '每年'})</h3>
            <p className="text-sm text-slate-400 font-medium">总金额变化曲线</p>
          </div>
          <TrendingUp className="w-6 h-6 text-emerald-500" />
        </div>
        
        <div className="h-[350px] w-full">
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
                contentStyle={{ 
                  borderRadius: '20px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  padding: '16px',
                  fontWeight: 'bold'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="cost" 
                stroke="#10b981" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorCost)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 人数对比 */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
         <div className="mb-8">
           <h3 className="text-lg font-black text-slate-800">打球人次分布</h3>
           <p className="text-sm text-slate-400 font-medium">直观对比不同时间段的参与活跃度</p>
         </div>
         <div className="h-[300px] w-full">
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
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="participants" 
                name="累计人次"
                fill="#3b82f6" 
                radius={[10, 10, 0, 0]} 
                barSize={timeScale === 'day' ? 24 : 48}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
