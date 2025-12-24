
import React from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, Users, Calculator } from 'lucide-react';
import { Session, LocationConfig } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (session: Omit<Session, 'id' | 'participants'>) => void;
  locations: LocationConfig[];
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onSubmit, locations }) => {
  // 初始状态定义
  const initialState = {
    date: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '21:00',
    location: '',
    courtCount: 2,
    courtFee: 0,
    shuttleQty: 3,
    shuttlePrice: 10.58,
    maxParticipants: 8,
  };

  const [formData, setFormData] = React.useState(initialState);

  // 辅助函数：根据场地名称获取单价
  const getRate = (locName: string) => {
    const loc = locations.find(l => l.name === locName);
    return loc ? Number(loc.defaultCourtFee) : 0;
  };

  // 关键修复：每次打开弹窗时重置状态并自动计算初始场地费
  React.useEffect(() => {
    if (isOpen) {
      if (locations && locations.length > 0) {
        const defaultLoc = locations[0];
        setFormData({
          ...initialState,
          location: defaultLoc.name,
          courtFee: Number(defaultLoc.defaultCourtFee) * initialState.courtCount
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [isOpen, locations]);

  if (!isOpen) return null;

  const handleLocationSelect = (locName: string) => {
    const rate = getRate(locName);
    setFormData(prev => ({
      ...prev,
      location: locName,
      courtFee: rate * prev.courtCount
    }));
  };

  const handleCourtCountChange = (value: string) => {
    // 处理空输入
    if (value === '') {
      setFormData(prev => ({ ...prev, courtCount: 0, courtFee: 0 }));
      return;
    }
    
    const count = parseInt(value);
    const safeCount = isNaN(count) ? 0 : count;
    
    setFormData(prev => {
      const rate = getRate(prev.location);
      const newFee = rate * safeCount;
      return {
        ...prev,
        courtCount: safeCount,
        courtFee: newFee
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location && locations.length > 0) {
      alert("请选择活动地点");
      return;
    }
    
    onSubmit({
      ...formData,
      courtCount: Number(formData.courtCount),
      courtFee: Number(formData.courtFee),
      shuttleQty: Number(formData.shuttleQty),
      shuttlePrice: Number(formData.shuttlePrice),
      maxParticipants: Number(formData.maxParticipants),
      time: `${formData.startTime} - ${formData.endTime}`
    });
    
    onClose();
  };

  const timeOptions = [];
  for (let i = 8; i <= 23; i++) {
    const hour = i.toString().padStart(2, '0');
    timeOptions.push(`${hour}:00`, `${hour}:30`);
  }

  return (
    <div className="modal show d-block" tabIndex={-1}>
      <div className="modal-backdrop fade show position-fixed" onClick={onClose} style={{ zIndex: 1040 }}></div>
      <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
        <div className="modal-content border-0 rounded-4xl shadow-2xl overflow-hidden">
          <div className="modal-header border-bottom-0 px-4 pt-4 pb-0">
            <h5 className="modal-title fw-black h4">发布球局</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body p-4 p-md-5 vstack gap-4" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div>
              <label className="form-label small fw-black text-muted text-uppercase tracking-wider d-flex align-items-center gap-2 mb-2">
                <MapPin size={16} /> 活动地点
              </label>
              {locations && locations.length > 0 ? (
                <select
                  value={formData.location}
                  onChange={e => handleLocationSelect(e.target.value)}
                  className="form-select form-select-lg bg-light border-0 rounded-3 fw-bold"
                  required
                >
                  <option value="" disabled>-- 请选择场地 --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} (单价 RM{loc.defaultCourtFee})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="alert alert-warning rounded-3 small fw-bold mb-0 border-0">
                  <Calculator size={16} className="me-2" />
                  请先在“场地管理”页面添加地点。
                </div>
              )}
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-black text-muted text-uppercase tracking-wider d-flex align-items-center gap-2 mb-2">
                  <Calendar size={16} /> 打球日期
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="form-control form-control-lg bg-light border-0 rounded-3 fw-bold"
                />
              </div>
              <div className="col-12 col-md-6">
                 <label className="form-label small fw-black text-muted text-uppercase tracking-wider d-flex align-items-center gap-2 mb-2">
                  <Clock size={16} /> 时间段
                </label>
                <div className="d-flex gap-2">
                  <select
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="form-select bg-light border-0 rounded-3 small fw-bold"
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="align-self-center text-muted">-</span>
                  <select
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="form-select bg-light border-0 rounded-3 small fw-bold"
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label small fw-black text-muted text-uppercase tracking-wider d-block mb-2">场地数量</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.courtCount === 0 ? '' : formData.courtCount}
                  onChange={e => handleCourtCountChange(e.target.value)}
                  className="form-control form-control-lg bg-light border-0 rounded-3 fw-black"
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-black text-muted text-uppercase tracking-wider d-flex align-items-center gap-2 mb-2">
                  <Users size={16} /> 最大人数
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.maxParticipants}
                  onChange={e => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 1 })}
                  className="form-control form-control-lg bg-light border-0 rounded-3 fw-black"
                />
              </div>
            </div>

            <div className="bg-light p-4 rounded-4 border border-dashed shadow-inner">
              <h6 className="fw-black text-uppercase tracking-widest small text-muted mb-4 d-flex align-items-center gap-2">
                <Calculator size={14} /> 费用预算控制 (RM)
              </h6>
              <div className="vstack gap-3">
                <div>
                  <label className="form-label x-small fw-black text-muted text-uppercase mb-2">场地总费用 (根据数量自动计算)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-0 px-2 fw-bold text-muted">RM</span>
                    <input
                      type="number"
                      readOnly
                      value={formData.courtFee.toFixed(2)}
                      className="form-control form-control-lg border-0 fw-black text-success bg-transparent cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label x-small fw-black text-muted text-uppercase mb-2">羽毛球数量</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.shuttleQty}
                      onChange={e => setFormData({ ...formData, shuttleQty: parseInt(e.target.value) || 0 })}
                      className="form-control border-0 fw-black shadow-sm"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label x-small fw-black text-muted text-uppercase mb-2">羽毛球单价</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-0 px-2 small">RM</span>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.shuttlePrice}
                        onChange={e => setFormData({ ...formData, shuttlePrice: parseFloat(e.target.value) || 0 })}
                        className="form-control border-0 fw-black shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={!locations || locations.length === 0}
                className="btn btn-success btn-lg w-100 rounded-pill py-3 fw-black shadow-lg"
              >
                立即发布球局
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        .x-small { font-size: 0.65rem; }
        .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05); }
        .cursor-not-allowed { cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default AdminModal;
