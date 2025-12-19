
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, Users } from 'lucide-react';
import { Session, LocationConfig } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (session: Omit<Session, 'id' | 'participants'>) => void;
  locations: LocationConfig[];
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onSubmit, locations }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '21:00',
    location: '',
    courtCount: 2,
    courtFee: 0,
    shuttleQty: 3,
    shuttlePrice: 10,
    maxParticipants: 8,
  });

  useEffect(() => {
    if (locations.length > 0 && (!formData.location || !locations.find(l => l.name === formData.location))) {
      setFormData(prev => ({
        ...prev,
        location: locations[0].name,
        courtFee: locations[0].defaultCourtFee
      }));
    }
  }, [isOpen, locations]);

  if (!isOpen) return null;

  const handleLocationSelect = (locName: string) => {
    const loc = locations.find(l => l.name === locName);
    setFormData({
      ...formData,
      location: locName,
      courtFee: loc ? loc.defaultCourtFee : formData.courtFee
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
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

          <form onSubmit={handleSubmit} className="modal-body p-4 p-md-5 vstack gap-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <div>
              <label className="form-label small fw-black text-muted text-uppercase tracking-wider d-flex align-items-center gap-2 mb-2">
                <MapPin size={16} /> 活动地点
              </label>
              {locations.length > 0 ? (
                <select
                  value={formData.location}
                  onChange={e => handleLocationSelect(e.target.value)}
                  className="form-select form-select-lg bg-light border-0 rounded-3 fw-bold"
                >
                  {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                </select>
              ) : (
                <div className="alert alert-warning rounded-3 small fw-bold mb-0">
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
                <label className="form-label small fw-black text-muted text-uppercase tracking-wider d-block mb-2">场地数</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.courtCount}
                  onChange={e => setFormData({ ...formData, courtCount: parseInt(e.target.value) || 1 })}
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

            <div>
              <label className="form-label small fw-black text-muted text-uppercase tracking-wider d-flex align-items-center gap-2 mb-2">
                <DollarSign size={16} /> 场地费(RM)
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.courtFee}
                onChange={e => setFormData({ ...formData, courtFee: parseFloat(e.target.value) || 0 })}
                className="form-control form-control-lg bg-light border-0 rounded-3 fw-black"
              />
            </div>

            <div className="pt-3">
              <button 
                type="submit"
                disabled={locations.length === 0}
                className="btn btn-success btn-lg w-100 rounded-pill py-3 fw-black shadow-lg"
              >
                确认发布
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
