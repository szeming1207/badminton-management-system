
import React from 'react';
import { Session } from '../types';
import { 
  DollarSign, 
  Users, 
  Award, 
  CalendarDays, 
  MapPin, 
  Gauge, 
  Activity, 
  TrendingUp, 
  Table as TableIcon, 
  CalendarRange, 
  CalendarClock 
} from 'lucide-react';

interface AnalyticsSectionProps {
  sessions: Session[];
}

type ViewType = 'detail' | 'month' | 'year';

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ sessions }) => {
  const [viewType, setViewType] = React.useState<ViewType>('detail');

  // 核心数据处理逻辑：计算每日、每月、每年的统计数据
  const stats = React.useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { totalCost: 0, totalParticipants: 0, avgCostPerSession: 0, detail: [], monthly: [], yearly: [] };
    }

    // 1. 处理每日明细 (Detail/Day)
    const detail = sessions.map(s => {
      const courtCost = Number(s.courtFee) || 0;
      const shuttleCost = (Number(s.shuttleQty) || 0) * (Number(s.shuttlePrice) || 0);
      const totalCost = courtCost + shuttleCost;
      const pCount = Array.isArray(s.participants) ? s.participants.length : 0;
      const perPerson = pCount > 0 ? totalCost / pCount : totalCost;

      return {
        ...s,
        totalCost,
        pCount,
        perPerson
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 2. 汇总函数：支持按月或按年聚合
    const aggregate = (type: 'month' | 'year') => {
      const grouped = detail.reduce((acc: any, s) => {
        const d = new Date(s.date);
        if (isNaN(d.getTime())) return acc; // 跳过无效日期

        const key = type === 'month' 
          ? `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
          : `${d.getFullYear()}`;
        
        if (!acc[key]) {
          acc[key] = { 
            key, 
            sessionCount: 0, 
            totalCost: 0, 
            totalParticipants: 0, 
            totalShuttles: 0, 
            locations: new Set<string>() 
          };
        }
        
        acc[key].sessionCount += 1;
        acc[key].totalCost += s.totalCost;
        acc[key].totalParticipants += s.pCount;
        acc[key].totalShuttles += Number(s.shuttleQty) || 0;
        acc[key].locations.add(s.location);
        
        return acc;
      }, {});

      return Object.values(grouped).map((item: any) => ({
        ...item,
        perPerson: item.totalParticipants > 0 ? item.totalCost / item.totalParticipants : item.totalCost,
        locationStr: Array.from(item.locations).slice(0, 2).join(', ') + (item.locations.size > 2 ? '...' : '')
      })).sort((a: any, b: any) => b.key.localeCompare(a.key));
    };

    const monthly = aggregate('month');
    const yearly = aggregate('year');

    // 3. 全局统计看板数据
    const totalCost = detail.reduce((sum, s) => sum + s.totalCost, 0);
    const totalParticipants = detail.reduce((sum, s) => sum + s.pCount, 0);
    const avgCostPerSession = detail.length > 0 ? totalCost / detail.length : 0;

    return { totalCost, totalParticipants, avgCostPerSession, detail, monthly, yearly };
  }, [sessions]);

  if (!sessions || sessions.length === 0) {
    return (
      <div className="card border-0 shadow-soft rounded-4xl p-5 text-center bg-white animate-in fade-in zoom-in duration-500">
        <div className="bg-light d-inline-flex p-4 rounded-circle mb-4 mx-auto">
          <Activity size={48} className="text-muted opacity-50" />
        </div>
        <h4 className="fw-black text-dark mb-2">数据统计待更新</h4>
        <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
          您目前还没有已发布的球局。管理员发布第一场球局并有人报名后，系统将自动在此生成详细的统计明细表。
        </p>
      </div>
    );
  }

  return (
    <div className="vstack gap-4 animate-in fade-in duration-700">
      {/* 顶部汇总指标卡片 */}
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-soft rounded-4 p-4 d-flex flex-row align-items-center gap-4 bg-white shadow-sm border-start border-success border-4">
            <div className="bg-success bg-opacity-10 text-success rounded-4 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <DollarSign size={28} />
            </div>
            <div>
              <p className="small text-muted fw-bold mb-0 text-uppercase tracking-wider">累计总支出</p>
              <h4 className="fw-black mb-0 text-dark">RM {stats.totalCost.toFixed(2)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-soft rounded-4 p-4 d-flex flex-row align-items-center gap-4 bg-white shadow-sm border-start border-primary border-4">
            <div className="bg-primary bg-opacity-10 text-primary rounded-4 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <Users size={28} />
            </div>
            <div>
              <p className="small text-muted fw-bold mb-0 text-uppercase tracking-wider">累计总人次</p>
              <h4 className="fw-black mb-0 text-dark">{stats.totalParticipants}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-soft rounded-4 p-4 d-flex flex-row align-items-center gap-4 bg-white shadow-sm border-start border-warning border-4">
            <div className="bg-warning bg-opacity-10 text-warning rounded-4 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <Award size={28} />
            </div>
            <div>
              <p className="small text-muted fw-bold mb-0 text-uppercase tracking-wider">单场均支出</p>
              <h4 className="fw-black mb-0 text-dark">RM {stats.avgCostPerSession.toFixed(2)}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* 视图切换：每日/每月/年度 */}
      <div className="d-flex justify-content-center justify-content-md-start">
        <div className="nav nav-pills bg-white p-1 rounded-3 border shadow-sm">
          <button 
            onClick={() => setViewType('detail')} 
            className={`nav-link small fw-black border-0 rounded-2 py-1 px-4 d-flex align-items-center gap-2 ${viewType === 'detail' ? 'active shadow-sm' : 'text-muted'}`}
          >
            <TableIcon size={14} /> 每日明细
          </button>
          <button 
            onClick={() => setViewType('month')} 
            className={`nav-link small fw-black border-0 rounded-2 py-1 px-4 d-flex align-items-center gap-2 ${viewType === 'month' ? 'active shadow-sm' : 'text-muted'}`}
          >
            <CalendarRange size={14} /> 每月汇总
          </button>
          <button 
            onClick={() => setViewType('year')} 
            className={`nav-link small fw-black border-0 rounded-2 py-1 px-4 d-flex align-items-center gap-2 ${viewType === 'year' ? 'active shadow-sm' : 'text-muted'}`}
          >
            <CalendarClock size={14} /> 年度汇总
          </button>
        </div>
      </div>

      {/* 简单明了的统计表格 */}
      <div className="card border-0 shadow-soft rounded-4xl overflow-hidden bg-white shadow-sm">
        <div className="card-header bg-white p-4 border-bottom-0">
          <h5 className="fw-black mb-1 d-flex align-items-center gap-2">
            <TrendingUp size={20} className="text-success" />
            {viewType === 'detail' ? '球局明细表' : viewType === 'month' ? '月度收支汇总' : '年度统计报表'}
          </h5>
          <p className="small text-muted mb-0">
            {viewType === 'detail' ? '实时追踪每一场球局的开销' : viewType === 'month' ? '按月份聚合展示财务与活跃情况' : '查看年度运营概况'}
          </p>
        </div>
        
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light text-muted">
              {viewType === 'detail' ? (
                <tr>
                  <th className="ps-4 py-3 border-0 small fw-black text-uppercase">打球日期</th>
                  <th className="py-3 border-0 small fw-black text-uppercase">场地地点</th>
                  <th className="py-3 border-0 small fw-black text-uppercase text-end">总花费 (RM)</th>
                  <th className="py-3 border-0 small fw-black text-muted text-uppercase text-center">出席人数</th>
                  <th className="py-3 border-0 small fw-black text-uppercase text-end text-success">个人花费 (AA)</th>
                  <th className="pe-4 py-3 border-0 small fw-black text-muted text-uppercase text-center">羽毛球用量</th>
                </tr>
              ) : (
                <tr>
                  <th className="ps-4 py-3 border-0 small fw-black text-uppercase">时间周期</th>
                  <th className="py-3 border-0 small fw-black text-uppercase text-center">场次总数</th>
                  <th className="py-3 border-0 small fw-black text-uppercase text-end">累计总花费 (RM)</th>
                  <th className="py-3 border-0 small fw-black text-muted text-uppercase text-center">累计人次</th>
                  <th className="py-3 border-0 small fw-black text-uppercase text-end text-success">场均个人花费</th>
                  <th className="pe-4 py-3 border-0 small fw-black text-muted text-uppercase text-center">累计用球</th>
                </tr>
              )}
            </thead>
            <tbody className="border-top-0">
              {viewType === 'detail' ? (
                stats.detail.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4 fw-bold text-dark">{item.date}</td>
                    <td><span className="badge bg-light text-dark fw-bold border">{item.location}</span></td>
                    <td className="text-end fw-black text-dark">RM {item.totalCost.toFixed(2)}</td>
                    <td className="text-center">
                      <span className={`badge rounded-pill ${item.pCount >= item.maxParticipants ? 'bg-danger bg-opacity-10 text-danger' : 'bg-primary bg-opacity-10 text-primary'}`}>
                        {item.pCount} / {item.maxParticipants} 人
                      </span>
                    </td>
                    <td className="text-end fw-black text-success">RM {item.perPerson.toFixed(2)}</td>
                    <td className="pe-4 text-center fw-bold">{item.shuttleQty} 个</td>
                  </tr>
                ))
              ) : (
                (viewType === 'month' ? stats.monthly : stats.yearly).map((item: any) => (
                  <tr key={item.key}>
                    <td className="ps-4 fw-black text-dark">{item.key}</td>
                    <td className="text-center"><span className="badge bg-success bg-opacity-10 text-success">{item.sessionCount} 场</span></td>
                    <td className="text-end fw-black text-dark">RM {item.totalCost.toFixed(2)}</td>
                    <td className="text-center fw-bold">{item.totalParticipants} 人次</td>
                    <td className="text-end fw-black text-success">RM {item.perPerson.toFixed(2)}</td>
                    <td className="pe-4 text-center fw-bold">{item.totalShuttles} 个</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* 如果过滤后没有数据（理论上不会，因为已在上方处理了空状态） */}
        {(viewType === 'detail' ? stats.detail : (viewType === 'month' ? stats.monthly : stats.yearly)).length === 0 && (
          <div className="p-5 text-center text-muted fw-bold">
            暂无此维度的统计数据
          </div>
        )}
      </div>

      <style>{`
        .table thead th { 
          background-color: #f8fafc; 
          font-size: 0.7rem; 
          letter-spacing: 0.05em; 
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .table tbody td { 
          padding-top: 1.25rem; 
          padding-bottom: 1.25rem; 
          font-size: 0.9rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .table-hover tbody tr:hover {
          background-color: #f8fafc;
        }
        .fw-black { font-weight: 900 !important; }
      `}</style>
    </div>
  );
};

export default AnalyticsSection;
