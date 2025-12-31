
import React from 'react';
import { Users, MapPin, X, Trash2, UserPlus, Save, Edit3, Clock, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Edit2, Check, DollarSign, Calendar as CalendarIcon, UserX, UserCheck, ShieldAlert, Timer, CheckCircle, PackageCheck } from 'lucide-react';
import { Session, LocationConfig } from '../types';

interface SessionCardProps {
  session: Session;
  isAdmin: boolean;
  locations: LocationConfig[];
  frequentParticipants: string[];
  onUpdate: (updated: Partial<Session>) => void;
  onDelete: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, isAdmin, locations, frequentParticipants, onUpdate, onDelete }) => {
  const [newName, setNewName] = React.useState('');
  const [isEditingCosts, setIsEditingCosts] = React.useState(false);
  const [isEditingDetails, setIsEditingDetails] = React.useState(false);
  
  const [tempCourtFee, setTempCourtFee] = React.useState(session.courtFee);
  const [tempShuttleQty, setTempShuttleQty] = React.useState(session.shuttleQty);
  const [tempShuttlePrice, setTempShuttlePrice] = React.useState(session.shuttlePrice);
  
  const isCompleted = session.status === 'completed';

  React.useEffect(() => {
    if (!isEditingCosts) {
      setTempCourtFee(session.courtFee);
      setTempShuttleQty(session.shuttleQty);
      setTempShuttlePrice(session.shuttlePrice);
    }
  }, [session.courtFee, session.shuttleQty, session.shuttlePrice, isEditingCosts]);

  const [editDate, setEditDate] = React.useState(session.date);
  const [editStartTime, setEditStartTime] = React.useState(session.time.split(' - ')[0] || '19:00');
  const [editEndTime, setEditEndTime] = React.useState(session.time.split(' - ')[1] || '21:00');
  const [editCourtCount, setEditCourtCount] = React.useState(session.courtCount);
  const [editMaxParticipants, setEditMaxParticipants] = React.useState(session.maxParticipants || 8);

  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);

  const totalShuttleCost = session.shuttleQty * session.shuttlePrice;
  const totalCost = session.courtFee + totalShuttleCost;
  const participantCount = session.participants.length;
  const maxParticipants = session.maxParticipants || 8;
  const isFull = participantCount >= maxParticipants;
  const costPerPerson = participantCount > 0 ? totalCost / participantCount : totalCost;

  const calculateDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const duration = (endH + endM / 60) - (startH + startM / 60);
    return duration > 0 ? duration : 0;
  };

  const handleUpdateCosts = () => {
    onUpdate({ 
      courtFee: tempCourtFee,
      shuttleQty: tempShuttleQty,
      shuttlePrice: tempShuttlePrice 
    });
    setIsEditingCosts(false);
  };

  const handleUpdateDetails = () => {
    const duration = calculateDuration(editStartTime, editEndTime);
    const config = locations.find(l => l.name === session.location);
    let newCourtFee = session.courtFee;

    if (config) {
      // 按照最新的小时单价 * 场数 * 时长重新计算
      newCourtFee = Number(config.defaultCourtFee) * editCourtCount * duration;
    } else {
      // 如果没找到配置，尝试推算之前的单价
      const oldDuration = calculateDuration(session.time.split(' - ')[0], session.time.split(' - ')[1]) || 1;
      const oldRate = session.courtFee / (session.courtCount * oldDuration);
      newCourtFee = oldRate * editCourtCount * duration;
    }

    onUpdate({ 
      date: editDate,
      time: `${editStartTime} - ${editEndTime}`,
      courtCount: editCourtCount,
      maxParticipants: editMaxParticipants,
      courtFee: newCourtFee
    });
    setIsEditingDetails(false);
  };

  const handleAddName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || isCompleted) return;
    
    if (session.participants.includes(trimmed) || session.waitingList?.includes(trimmed)) {
      alert('名字已在名单或等候名单中');
      return;
    }

    if (!isFull) {
      onUpdate({ participants: [...session.participants, trimmed] });
    } else {
      const currentWaiting = session.waitingList || [];
      onUpdate({ waitingList: [...currentWaiting, trimmed] });
      alert('正式名单已满，您已进入待定名单。若有人退出将自动顺延。');
    }
    
    setNewName('');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const handleRemoveClick = (name: string, isFromWaitingList: boolean = false) => {
    if (isCompleted) return;
    const confirmMsg = isAdmin ? `确定直接移除 "${name}" 吗？` : `确定要申请退出吗？`;
    if (!window.confirm(confirmMsg)) return;

    if (isAdmin) {
      let updatedP = [...session.participants];
      let updatedW = [...(session.waitingList || [])];
      if (isFromWaitingList) {
        updatedW = updatedW.filter(p => p !== name);
      } else {
        updatedP = updatedP.filter(p => p !== name);
        if (updatedW.length > 0 && updatedP.length < maxParticipants) {
          const [next, ...rest] = updatedW;
          updatedP.push(next);
          updatedW = rest;
        }
      }
      onUpdate({ participants: updatedP, waitingList: updatedW, deletionRequests: (session.deletionRequests || []).filter(p => p !== name) });
    } else {
      onUpdate({ deletionRequests: [...(session.deletionRequests || []), name] });
    }
  };

  const timeOptions = [];
  for (let i = 8; i <= 23; i++) {
    const hour = i.toString().padStart(2, '0');
    timeOptions.push(`${hour}:00`, `${hour}:30`);
  }

  return (
    <div className={`card border-0 shadow-soft rounded-4xl overflow-hidden position-relative h-100 transition-all ${isCompleted ? 'grayscale-75' : ''}`}>
      {showSuccessToast && (
        <div className="position-absolute top-0 start-50 translate-middle-x mt-3 z-3 bg-success text-white px-4 py-2 rounded-pill shadow d-flex align-items-center gap-2">
          <CheckCircle2 size={18} />
          <span className="small fw-black">报名成功！ 🎉</span>
        </div>
      )}

      <div className={`card-header border-0 p-4 ${isCompleted ? 'bg-secondary bg-opacity-10' : 'bg-light'}`}>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            {isEditingDetails ? (
              <div className="vstack gap-3 mt-2 bg-white p-3 rounded-4 shadow-sm border border-success border-opacity-25">
                <div className="row g-2">
                   <div className="col-12">
                     <label className="x-small fw-black text-muted text-uppercase d-block mb-1">修改活动日期</label>
                     <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="form-control form-control-sm fw-bold" />
                   </div>
                   <div className="col-8">
                    <label className="x-small fw-black text-muted text-uppercase d-block mb-1">时间段</label>
                    <div className="d-flex align-items-center gap-2">
                      <select value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="form-select form-select-sm fw-bold">
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="form-select form-select-sm fw-bold">
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="col-4">
                    <label className="x-small fw-black text-muted text-uppercase d-block mb-1">场地数</label>
                    <input type="number" min="1" value={editCourtCount} onChange={(e) => setEditCourtCount(parseInt(e.target.value) || 1)} className="form-control form-control-sm fw-black text-center" />
                  </div>
                  <div className="col-12">
                    <label className="x-small fw-black text-muted text-uppercase d-block mb-1">最大人数限制 (当前已报 {participantCount} 人)</label>
                    <input type="number" min="1" value={editMaxParticipants} onChange={(e) => setEditMaxParticipants(parseInt(e.target.value) || 1)} className="form-control form-control-sm fw-black" />
                    <small className="text-muted" style={{ fontSize: '0.6rem' }}>* 增加场地数后建议同步增加人数限制</small>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button onClick={handleUpdateDetails} className="btn btn-success btn-sm flex-grow-1 fw-black shadow-sm">保存修改</button>
                  <button onClick={() => setIsEditingDetails(false)} className="btn btn-light btn-sm border">取消</button>
                </div>
              </div>
            ) : (
              <>
                <h4 className={`fw-black mb-2 ${isCompleted ? 'text-muted' : 'text-dark'}`}>
                  {new Date(session.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
                </h4>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fw-bold">
                    <Clock size={14} className="me-1" /> {session.time}
                  </span>
                  <div className="d-flex align-items-center gap-1 small fw-bold text-muted bg-white px-2 py-1 rounded-pill border">
                    <MapPin size={12} className="text-danger" />
                    <span>{session.location}</span>
                    <span className="opacity-25">|</span>
                    <span>{session.courtCount} 场地</span>
                  </div>
                  {isAdmin && !isCompleted && (
                    <button onClick={() => setIsEditingDetails(true)} className="btn btn-link text-success p-1 rounded-circle hover-bg-light">
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          {isAdmin && (
            <div className="d-flex gap-1">
              {!isCompleted && (
                <button onClick={() => { if(window.confirm('确认归档？')) onUpdate({ status: 'completed' }); }} className="btn btn-outline-success btn-sm rounded-pill fw-black px-3 py-1 shadow-sm">归档</button>
              )}
              <button onClick={onDelete} className="btn btn-link text-muted p-2"><Trash2 size={20} /></button>
            </div>
          )}
        </div>
      </div>

      <div className="row g-0 border-top border-bottom">
        <div className="col-6 p-4 border-end">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="text-muted fw-black text-uppercase" style={{ fontSize: '0.65rem' }}>总场费支出</small>
            {isAdmin && !isCompleted && <Edit3 size={14} className="text-muted cursor-pointer" onClick={() => setIsEditingCosts(!isEditingCosts)} />}
          </div>
          <h4 className="fw-black mb-1">RM {session.courtFee.toFixed(2)}</h4>
          <small className="text-muted fw-bold" style={{ fontSize: '0.65rem' }}>
            {session.courtCount} 场 × {calculateDuration(session.time.split(' - ')[0], session.time.split(' - ')[1]).toFixed(1)}h
          </small>
        </div>
        <div className={`col-6 p-4 ${isCompleted ? 'bg-secondary bg-opacity-10' : 'bg-light bg-opacity-50'}`}>
          <small className="text-success fw-black text-uppercase" style={{ fontSize: '0.65rem' }}>每人均分 (AA)</small>
          <h4 className={`fw-black mb-1 ${isCompleted ? 'text-muted' : 'text-success'}`}>RM {costPerPerson.toFixed(2)}</h4>
          <span className={`badge rounded-pill fw-black py-1 px-2 border ${isFull ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25' : 'bg-white text-success border-success border-opacity-25'}`}>
            {participantCount} / {maxParticipants} 人
          </span>
        </div>
      </div>

      <div className="card-body p-4 d-flex flex-column gap-3">
        <h6 className="fw-black mb-0 d-flex align-items-center gap-2">
          <Users size={18} className="text-success" /> 正式名单
        </h6>
        
        <div className="vstack gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {session.participants.map(name => (
            <div key={name} className="d-flex align-items-center justify-content-between p-2 px-3 border rounded-3 bg-white shadow-sm">
              <span className="fw-bold">{name}</span>
              {!isCompleted && (
                <button onClick={() => handleRemoveClick(name)} className="btn btn-link p-1 text-muted border-0 hover-danger">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {session.waitingList && session.waitingList.length > 0 && (
          <div className="mt-2 pt-2 border-top">
            <h6 className="fw-black text-warning small mb-2"><Timer size={14} className="me-1" /> 待定名单 (排队中)</h6>
            <div className="vstack gap-1">
              {session.waitingList.map((name, i) => (
                <div key={name} className="d-flex justify-content-between p-2 px-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-3">
                  <span className="small fw-bold">{i+1}. {name}</span>
                  {!isCompleted && <X size={14} className="text-muted cursor-pointer" onClick={() => handleRemoveClick(name, true)} />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-top">
          {!isCompleted && (
            <form onSubmit={(e) => { e.preventDefault(); handleAddName(newName); }} className="input-group shadow-sm">
              <input type="text" placeholder={isFull ? "正赛已满，进入待定..." : "输入名字报名..."} value={newName} onChange={(e) => setNewName(e.target.value)} className="form-control border-0 bg-light fw-bold" />
              <button type="submit" className={`btn ${isFull ? 'btn-warning' : 'btn-success'}`}>
                {isFull ? <Timer size={18} /> : <UserPlus size={18} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
