
import React from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, Users, Calculator, Package } from 'lucide-react';
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

  const updateCalculatedFee = (data: typeof formData) => {
    const rate = getRate(data.location);
    const duration = calculateDuration(data.startTime, data.endTime);
    return rate * (data.courtCount || 0) * duration;
  };

  React.useEffect(() => {
    if (isOpen) {
      if (locations && locations.length > 0) {
        const defaultLoc = locations[0];
        const initialData = { ...initialState, location: defaultLoc.name };
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
  const totalShuttleCost = formData.shuttleQty * formData.shuttlePrice;
  const totalEventBudget = formData.courtFee + totalShuttleCost;
  const estimatedAA = formData.maxParticipants > 0 ? totalEventBudget / formData.maxParticipants : 0;

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
              <select
                value={formData.location}
                onChange={e => handleInputChange({ location: e.target.value })}
                className="form-select form-select-lg bg-light border-0 rounded-3 fw-bold"
                required
              >
                <option value="" disabled>-- 请选择场地 --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name} (RM{loc.defaultCourtFee}/h)</option>
                ))}
              </select>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-black text-muted text-uppercase tracking-wider mb-2">打球日期</label>
                <input type="date" required value={formData.date} onChange={e => handleInputChange({ date: e.target.value })} className="form-control form-control-lg bg-light border-0 rounded-3 fw-bold" />
              </div>
              <div className="col-12 col-md-6">
                 <label className="form-label small fw-black text-muted text-uppercase tracking-wider mb-2">时间段 ({currentDuration.toFixed(1)}h)</label>
                <div className="d-flex gap-2">
                  <select value={formData.startTime} onChange={e => handleInputChange({ startTime: e.target.value })} className="form-select bg-light border-0 rounded-3 small fw-bold">
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={formData.endTime} onChange={e => handleInputChange({ endTime: e.target.value })} className="form-select bg-light border-0 rounded-3 small fw-bold">
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label small fw-black text-muted text-uppercase tracking-wider mb-2">场地数量</label>
                <input type="number" min="1" required value={formData.courtCount} onChange={e => handleInputChange({ courtCount: parseInt(e.target.value) || 0 })} className="form-control form-control-lg bg-light border-0 rounded-3 fw-black" />
              </div>
              <div className="col-6">
                <label className="form-label small fw-black text-muted text-uppercase tracking-wider mb-2">最大人数</label>
                <input type="number" min="1" required value={formData.maxParticipants} onChange={e => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 1 })} className="form-control form-control-lg bg-light border-0 rounded-3 fw-black" />
              </div>
            </div>

            <div className="bg-light p-4 rounded-4 border border-dashed shadow-inner">
              <h6 className="fw-black text-uppercase tracking-widest small text-muted mb-4 d-flex align-items-center gap-2">
                <Calculator size={14} /> 费用概览 (包含羽球)
              </h6>
              
              <div className="vstack gap-3 mb-4">
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label x-small fw-black text-muted text-uppercase mb-2">预计羽球用量</label>
                    <input type="number" min="0" required value={formData.shuttleQty} onChange={e => setFormData({ ...formData, shuttleQty: parseInt(e.target.value) || 0 })} className="form-control border-0 fw-black shadow-sm" />
                  </div>
                  <div className="col-6">
                    <label className="form-label x-small fw-black text-muted text-uppercase mb-2">羽球单价 (RM)</label>
                    <input type="number" step="0.1" required value={formData.shuttlePrice} onChange={e => setFormData({ ...formData, shuttlePrice: parseFloat(e.target.value) || 0 })} className="form-control border-0 fw-black shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-3 shadow-sm border border-success border-opacity-10">
                <div className="d-flex justify-content-between mb-2">
                  <span className="small text-muted fw-bold">场地费:</span>
                  <span className="small fw-black">RM {formData.courtFee.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="small text-muted fw-bold">羽球费:</span>
                  <span className="small fw-black">RM {totalShuttleCost.toFixed(2)}</span>
                </div>
                <hr className="my-2 opacity-10" />
                <div className="d-flex justify-content-between align-items-center">
                  <div className="small fw-black text-uppercase text-success">总计/预计人均:</div>
                  <div className="text-end">
                    <div className="h4 fw-black text-success mb-0">RM {totalEventBudget.toFixed(2)}</div>
                    <div className="x-small fw-bold text-muted">满员预估: RM {estimatedAA.toFixed(2)} /人</div>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={currentDuration <= 0} className="btn btn-success btn-lg w-100 rounded-pill py-3 fw-black shadow-lg">立即发布球局</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
