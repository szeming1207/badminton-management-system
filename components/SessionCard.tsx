
import React, { useState, useEffect } from 'react';
import { Users, MapPin, X, Trash2, UserPlus, Save, Edit3, Clock, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { Session } from '../types';

interface SessionCardProps {
  session: Session;
  isAdmin: boolean;
  frequentParticipants: string[];
  onUpdate: (updated: Partial<Session>) => void;
  onDelete: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, isAdmin, frequentParticipants, onUpdate, onDelete }) => {
  const [newName, setNewName] = useState('');
  const [isEditingShuttles, setIsEditingShuttles] = useState(false);
  const [tempShuttleQty, setTempShuttleQty] = useState(session.shuttleQty);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const totalShuttleCost = session.shuttleQty * session.shuttlePrice;
  const totalCost = session.courtFee + totalShuttleCost;
  const participantCount = session.participants.length;
  const maxParticipants = session.maxParticipants || 8;
  const isFull = participantCount >= maxParticipants;
  const costPerPerson = participantCount > 0 ? totalCost / participantCount : totalCost;

  const handleAddName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    if (session.participants.includes(trimmed)) {
      alert('名字已在名单中');
      return;
    }

    if (isFull) {
      alert('名额已满，无法报名。');
      return;
    }

    onUpdate({ participants: [...session.participants, trimmed] });
    setNewName('');
    
    // 显示成功提示
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const handleUpdateShuttles = () => {
    onUpdate({ shuttleQty: tempShuttleQty });
    setIsEditingShuttles(false);
  };

  const removeParticipant = (name: string) => {
    if (!isAdmin) {
      alert('普通成员仅能填入名字，移除或修改请联系管理员。');
      return;
    }
    onUpdate({ participants: session.participants.filter(p => p !== name) });
  };

  return (
    <div className="relative bg-white rounded-[2rem] border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 flex flex-col h-full border-b-4 border-b-emerald-500/20">
      
      {/* 成功报名 Toast */}
      {showSuccessToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 border border-emerald-500/50">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-black">报名成功！成功参与 🎉</span>
        </div>
      )}

      {/* Card Header */}
      <div className="px-7 py-6 flex justify-between items-start bg-slate-50/80">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {new Date(session.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-1.5 font-black text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full border border-emerald-100">
              <Clock className="w-4 h-4" />
              <span>{session.time}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-600">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span className="truncate max-w-[140px]">{session.location}</span>
              <span className="text-slate-300 mx-1">/</span>
              <span>{session.courtCount} 场地</span>
            </div>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={onDelete}
            className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
            title="删除活动"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 border-y border-slate-100">
        <div className="p-6 border-r border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">活动总费用</p>
            {isAdmin && (
              <button 
                onClick={() => setIsEditingShuttles(!isEditingShuttles)} 
                className={`p-1.5 rounded-lg transition-colors ${isEditingShuttles ? 'bg-emerald-100 text-emerald-600 shadow-inner' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-3xl font-black text-slate-800">RM {totalCost.toFixed(2)}</p>
          <div className="mt-2 space-y-0.5">
            <p className="text-[11px] font-bold text-slate-400">场地: RM {session.courtFee}</p>
            {isEditingShuttles ? (
              <div className="flex items-center gap-2 mt-2 animate-in slide-in-from-left-2">
                <input 
                  type="number" 
                  autoFocus
                  value={tempShuttleQty} 
                  onChange={(e) => setTempShuttleQty(parseInt(e.target.value) || 0)}
                  className="w-16 text-sm font-black border-2 border-emerald-500 rounded-xl px-2 py-1 outline-none"
                />
                <button onClick={handleUpdateShuttles} className="bg-emerald-600 text-white p-2 rounded-xl active:scale-95 transition-transform shadow-lg shadow-emerald-100">
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-[11px] font-bold text-slate-400">羽毛球: {session.shuttleQty} 个 (RM {totalShuttleCost.toFixed(2)})</p>
            )}
          </div>
        </div>
        <div className="p-6 bg-emerald-50/40">
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-2">每人分担 (AA)</p>
          <p className="text-3xl font-black text-emerald-700">RM {costPerPerson.toFixed(2)}</p>
          <div className="mt-2 flex items-center gap-2">
             <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black shadow-sm border ${isFull ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-white text-emerald-600 border-emerald-100'}`}>
               {participantCount} / {maxParticipants} 人参与
             </div>
             {isFull && <span className="text-[10px] font-bold text-rose-500">已满</span>}
          </div>
        </div>
      </div>

      {/* Participants Area */}
      <div className="p-7 flex flex-col flex-1 space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            报名名单
          </h4>
          <button 
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="text-[11px] text-emerald-600 font-black hover:text-emerald-700 transition-colors flex items-center gap-1.5"
          >
            {showQuickAdd ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
            常用名单
          </button>
        </div>

        {showQuickAdd && (
          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {frequentParticipants.filter(n => !session.participants.includes(n)).length > 0 ? (
                frequentParticipants.filter(n => !session.participants.includes(n)).map(name => (
                  <button 
                    key={name}
                    onClick={() => handleAddName(name)}
                    disabled={isFull}
                    className="text-[10px] font-bold bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 px-3 py-1.5 rounded-full transition-all active:scale-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {name}
                  </button>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 italic w-full text-center py-2">无更多记录</p>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Participants List */}
        <div className="relative flex-1">
          <div className="max-h-[180px] overflow-y-auto pr-2 custom-scrollbar flex flex-wrap gap-2.5 content-start">
            {session.participants.length > 0 ? (
              session.participants.map(name => (
                <div key={name} className="group flex items-center gap-2 bg-white text-slate-700 pl-4 pr-1 py-1.5 rounded-full text-xs font-bold border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm">
                  <span className="truncate max-w-[120px]">{name}</span>
                  <button 
                    onClick={() => removeParticipant(name)} 
                    className={`text-slate-300 hover:text-rose-500 transition-colors p-1.5 ${!isAdmin ? 'cursor-not-allowed opacity-0' : 'group-hover:opacity-100 opacity-0'}`}
                    disabled={!isAdmin}
                    title={isAdmin ? "移除" : "仅管理员可移除"}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="w-full py-10 flex flex-col items-center justify-center border-4 border-dashed border-slate-50 rounded-[2rem]">
                <Users className="w-10 h-10 text-slate-100 mb-2" />
                <p className="text-[11px] text-slate-300 font-bold">暂时还没有人报名...</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Participant Form */}
        <div className="pt-4 border-t border-slate-50">
          {isFull ? (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-600">
               <AlertCircle className="w-5 h-5 shrink-0" />
               <p className="text-xs font-bold">本场次报名名额已满，下次请早点哦！</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleAddName(newName); }} className="flex gap-2">
              <input
                type="text"
                placeholder="填下名字参与..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 bg-slate-100/50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-14 flex items-center justify-center rounded-2xl transition-all shadow-xl shadow-emerald-100 active:scale-90 disabled:opacity-50 disabled:grayscale"
                disabled={!newName.trim() || isFull}
              >
                <UserPlus className="w-6 h-6" />
              </button>
            </form>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

export default SessionCard;
