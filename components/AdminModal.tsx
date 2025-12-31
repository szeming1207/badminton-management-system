
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

  // 辅助函数：计算时长（小时）
  const calculateDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startTotal = startH + startM / 60;
    const endTotal = endH + endM / 60;
    const diff = endTotal - startTotal;
    return diff > 0 ? diff : 0;
  };

  const getRate = (locName: string) => {
    const loc = locations.find(l => l.name === locName);
    return loc ? Number(loc.defaultCourtFee) : 0;
  };

  // 核心计算逻辑：单价 * 数量 * 小时
  const updateCalculatedFee = (data: typeof formData) => {
    const rate = getRate(data.location);
    const duration = calculateDuration(data.startTime, data.endTime);
    const newFee = rate * (data.courtCount || 0) * duration;
    return newFee;
  };

  React.useEffect(() => {
    if (isOpen) {
      if (locations && locations.length > 0) {
        const defaultLoc = locations[0];
        const initialData = {
          ...initialState,
          location: defaultLoc.name,
        };
        const fee = updateCalculatedFee(initialData);
        setFormData({ ...initialData, courtFee: fee });
      } else {
        setFormData(initialState);
      }
    }
  }, [isOpen, locations]);

  if (!isOpen) return null;

  const handleInputChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      const newFee = updateCalculatedFee(newData);
      return { ...newData, courtFee: newFee };
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

  const currentDuration = calculateDuration(formData.startTime, formData.endTime);

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
                  onChange={e => handleInputChange({ location: e.target.value })}
                  className="form-select form-select-lg bg-light border-0 rounded-3 fw-bold"
                  required
                >
                  <option value="" disabled>-- 请选择场地 --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} (RM{loc.defaultCourtFee}/小时/场)
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
                  onChange={e => handleInputChange({ date: e.target.value })}
                  className="form-control form-control-lg bg-light border-0 rounded-3 fw-bold"
                />
              </div>
              <div className="col-12 col-md-6">
                 <label className="form-label small fw-black text-muted text-uppercase tracking-wider d-flex align-items-center gap-2 mb-2">
                  <Clock size={16} /> 时间段 ({currentDuration.toFixed(1)}小时)
                </label>
                <div className="d-flex gap-2">
                  <select
                    value={formData.startTime}
                    onChange={e => handleInputChange({ startTime: e.target.value })}
                    className="form-select bg-light border-0 rounded-3 small fw-bold"
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="align-self-center text-muted">-</span>
                  <select
                    value={formData.endTime}
                    onChange={e => handleInputChange({ endTime: e.target.value })}
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
                  value={formData.courtCount}
                  onChange={e => handleInputChange({ courtCount: parseInt(e.target.value) || 0 })}
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
                <Calculator size={14} /> 自动计算总场费 (RM)
              </h6>
              <div className="vstack gap-3">
                <div className="d-flex justify-content-between align-items-end">
                  <div>
                    <label className="form-label x-small fw-black text-muted text-uppercase mb-1">计算详情</label>
                    <div className="small fw-bold text-muted">
                      RM {getRate(formData.location)} × {formData.courtCount}场 × {currentDuration.toFixed(1)}h
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="h3 fw-black text-success mb-0">RM {formData.courtFee.toFixed(2)}</span>
                  </div>
                </div>
                
                <hr className="my-1 opacity-10" />

                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label x-small fw-black text-muted text-uppercase mb-2">预计羽毛球用量</label>
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
                disabled={!locations || locations.length === 0 || currentDuration <= 0}
                className="btn btn-success btn-lg w-100 rounded-pill py-3 fw-black shadow-lg"
              >
                立即发布球局
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
