
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
    shuttleQty: 3, // 修改默认值为 3
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="text-2xl font-black text-slate-800">发布球局</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> 活动地点
            </label>
            {locations.length > 0 ? (
              <select
                value={formData.location}
                onChange={e => handleLocationSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
              >
                {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
              </select>
            ) : (
              <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 text-xs font-bold">
                请先在“场地管理”页面添加地点。
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> 打球日期
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">开始</label>
                <select
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold"
                >
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">结束</label>
                <select
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold"
                >
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                场地数
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.courtCount}
                onChange={e => setFormData({ ...formData, courtCount: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-black text-slate-700 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> 最大报名人数
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.maxParticipants}
                onChange={e => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-black text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> 场地费(RM)
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.courtFee}
              onChange={e => setFormData({ ...formData, courtFee: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-black text-slate-700 outline-none"
            />
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={locations.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-emerald-100 active:scale-[0.97] disabled:opacity-50"
            >
              确认发布
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;
