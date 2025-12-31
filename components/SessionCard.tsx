
import React from 'react';
import { Users, MapPin, X, Trash2, UserPlus, Save, Edit3, Clock, CheckCircle2, Edit2, DollarSign, Timer, Calculator, Package, TrendingUp } from 'lucide-react';
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
  
  const [editDate, setEditDate] = React.useState(session.date);
  const [editStartTime, setEditStartTime] = React.useState(session.time.split(' - ')[0] || '19:00');
  const [editEndTime, setEditEndTime] = React.useState(session.time.split(' - ')[1] || '21:00');
  const [editCourtCount, setEditCourtCount] = React.useState(session.courtCount);
  const [editMaxParticipants, setEditMaxParticipants] = React.useState(session.maxParticipants || 8);

  const [showSuccessToast, setShowSuccessToast] = React.useState(false);

  const isCompleted = session.status === 'completed';

  const calculateDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const duration = (endH + endM / 60) - (startH + startM / 60);
    return duration > 0 ? duration : 0;
  };

  const currentDuration = calculateDuration(session.time.split(' - ')[0], session.time.split(' - ')[1]);
  const totalShuttleCost = session.shuttleQty * session.shuttlePrice;
  const totalEventCost = session.courtFee + totalShuttleCost;
  const participantCount = session.participants.length;
  const maxParticipants = session.maxParticipants || 8;
  const isFull = participantCount >= maxParticipants;
  
  const costPerPerson = participantCount > 0 ? totalEventCost / participantCount : 0;

  const previewTotal = Number(tempCourtFee) + (Number(tempShuttleQty) * Number(tempShuttlePrice));

  const handleUpdateCosts = () => {
    onUpdate({ 
      courtFee: Number(tempCourtFee),
      shuttleQty: Number(tempShuttleQty),
      shuttlePrice: Number(tempShuttlePrice) 
    });
    setIsEditingCosts(false);
  };

  const handleUpdateDetails = () => {
    const duration = calculateDuration(editStartTime, editEndTime);
    const config = locations.find(l => l.name === session.location);
    let newCourtFee = session.courtFee;

    if (config) {
      newCourtFee = Number(config.defaultCourtFee) * editCourtCount * duration;
    }

    onUpdate({ 
      date: editDate,
      time: `${editStartTime} - ${editEndTime}`,
      courtCount: Number(editCourtCount),
      maxParticipants: Number(editMaxParticipants),
      courtFee: Number(newCourtFee)
    });
    setIsEditingDetails(false);
  };

  const handleAddName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || isCompleted) return;
    if (session.participants.includes(trimmed) || (session.waitingList || []).includes(trimmed)) {
      alert('名字已在名单中');
      return;
    }

    if (!isFull) {
      onUpdate({ participants: [...session.participants, trimmed] });
    } else {
      const currentWaiting = session.waitingList || [];
      onUpdate({ waitingList: [...currentWaiting, trimmed] });
    }
    
    setNewName('');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2000);
  };

  const handleRemoveClick = (name: string, isFromWaitingList: boolean = false) => {
    if (isCompleted) return;
    if (!window.confirm(isAdmin ? `确定移除 "${name}" 吗？` : `确定申请退出吗？`)) return;

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
      onUpdate({ participants: updatedP, waitingList: updatedW });
    } else {
      const currentReqs = session.deletionRequests || [];
      onUpdate({ deletionRequests: [...currentReqs, name] });
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
          <span className="small fw-black">报名成功！</span>
        </div>
      )}

      {/* 头部展示 */}
      <div className={`card-header border-0 p-4 ${isCompleted ? 'bg-secondary bg-opacity-10' : 'bg-light'}`}>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            {isEditingDetails ? (
              <div className="vstack gap-3 mt-2 bg-white p-3 rounded-4 shadow-sm border border-success border-opacity-25">
                <div className="row g-2">
                   <div className="col-12">
                     <label className="x-small fw-black text-muted text-uppercase d-block mb-1">修改日期</label>
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
                    <label className="x-small fw-black text-muted text-uppercase d-block mb-1">最大人数</label>
                    <input type="number" min="1" value={editMaxParticipants} onChange={(e) => setEditMaxParticipants(parseInt(e.target.value) || 1)} className="form-control form-control-sm fw-black" />
                  </div>
                </div>
                <div className="d-flex gap-2 pt-1">
                  <button onClick={handleUpdateDetails} className="btn btn-success btn-sm flex-grow-1 fw-black shadow-sm">保存并重算场费</button>
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
                  <div className="d-flex align-items-center gap-1 small fw-bold text-muted bg-white px-2 py-1 rounded-pill border shadow-sm">
                    <MapPin size={12} className="text-danger" />
                    <span>{session.location}</span>
                    <span className="opacity-25 mx-1">|</span>
                    <span className="text-dark">{session.courtCount} 场地</span>
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
            <button onClick={onDelete} className="btn btn-link text-muted p-2"><Trash2 size={20} /></button>
          )}
        </div>
      </div>

      {/* 核心财务区 */}
      <div className="bg-light border-top border-bottom">
        {isEditingCosts ? (
          <div className="p-4 vstack gap-3">
            <h6 className="fw-black x-small text-uppercase text-muted d-flex align-items-center justify-content-between mb-0">
              <span className="d-flex align-items-center gap-2"><Calculator size={14} /> 财务修正</span>
              <span className="text-primary fw-black">预览: RM {previewTotal.toFixed(2)}</span>
            </h6>
            <div className="row g-2">
              <div className="col-12">
                <label className="x-small fw-black text-muted mb-1">纯场地费 (RM)</label>
                <input type="number" value={tempCourtFee} onChange={e => setTempCourtFee(parseFloat(e.target.value) || 0)} className="form-control form-control-sm fw-bold border-0 shadow-sm" />
              </div>
              <div className="col-6">
                <label className="x-small fw-black text-muted mb-1">羽球用量 (个)</label>
                <input type="number" value={tempShuttleQty} onChange={e => setTempShuttleQty(parseInt(e.target.value) || 0)} className="form-control form-control-sm fw-bold border-0 shadow-sm" />
              </div>
              <div className="col-6">
                <label className="x-small fw-black text-muted mb-1">羽球单价 (RM)</label>
                <input type="number" step="0.1" value={tempShuttlePrice} onChange={e => setTempShuttlePrice(parseFloat(e.target.value) || 0)} className="form-control form-control-sm fw-bold border-0 shadow-sm" />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button onClick={handleUpdateCosts} className="btn btn-primary btn-sm flex-grow-1 fw-black">保存开销</button>
              <button onClick={() => setIsEditingCosts(false)} className="btn btn-white btn-sm border">取消</button>
            </div>
          </div>
        ) : (
          <div className="row g-0">
            {/* 左侧：总预算 */}
            <div className="col-6 p-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted fw-black text-uppercase" style={{ fontSize: '0.65rem' }}>活动总额</small>
                {isAdmin && !isCompleted && <Edit3 size={14} className="text-muted cursor-pointer" onClick={() => setIsEditingCosts(true)} />}
              </div>
              <h4 className="fw-black mb-1">RM {totalEventCost.toFixed(2)}</h4>
              <div className="d-flex flex-column gap-1 text-muted fw-bold" style={{ fontSize: '0.6rem' }}>
                <span>场费: RM {session.courtFee.toFixed(2)}</span>
                <span>羽球: RM {totalShuttleCost.toFixed(2)}</span>
              </div>
            </div>
            {/* 右侧：人均 AA (白色框样式) */}
            <div className="col-6 p-3">
              <div className={`h-100 p-3 rounded-4 bg-white border shadow-sm d-flex flex-column justify-content-center ${isCompleted ? 'opacity-75' : ''}`}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-dark fw-black text-uppercase opacity-50" style={{ fontSize: '0.65rem' }}>每个人应 AA</small>
                  <span className={`badge rounded-pill fw-black px-2 ${isFull ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-10' : 'bg-light text-muted border'}`} style={{ fontSize: '0.6rem' }}>
                    {participantCount}/{maxParticipants}
                  </span>
                </div>
                <h4 className="fw-black mb-1 text-dark">
                  {participantCount > 0 ? `RM ${costPerPerson.toFixed(2)}` : 'RM --'}
                </h4>
                <div className="d-flex align-items-center gap-1 text-muted fw-bold" style={{ fontSize: '0.6rem' }}>
                  <TrendingUp size={10} className="text-success" />
                  <span>用球: {session.shuttleQty} 个</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 名单区域 */}
      <div className="card-body p-4 d-flex flex-column gap-3">
        <h6 className="fw-black mb-0 d-flex align-items-center gap-2">
          <Users size={18} className="text-success" /> 出席名单 & 缴费
        </h6>
        
        <div className="vstack gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {session.participants.map(name => (
            <div key={name} className="d-flex align-items-center justify-content-between p-2 px-3 border rounded-3 bg-white shadow-sm hover-border-success transition-all">
              <div>
                <span className="fw-bold me-2">{name}</span>
                <span className="x-small fw-black text-muted opacity-75">(RM {costPerPerson.toFixed(2)})</span>
              </div>
              {!isCompleted && (
                <button onClick={() => handleRemoveClick(name)} className="btn btn-link p-1 text-muted border-0 hover-danger">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          {session.participants.length === 0 && <div className="text-center py-3 text-muted small fw-bold italic bg-white rounded-3 border border-dashed">等待报名...</div>}
        </div>

        {session.waitingList && session.waitingList.length > 0 && (
          <div className="mt-2 pt-2 border-top">
            <h6 className="fw-black text-warning small mb-2 d-flex align-items-center gap-2"><Timer size={14} /> 候补排队 ({session.waitingList.length})</h6>
            <div className="vstack gap-1">
              {session.waitingList.map((name, i) => (
                <div key={name} className="d-flex justify-content-between p-2 px-3 bg-warning bg-opacity-5 border border-warning border-opacity-10 rounded-3">
                  <span className="small fw-bold">{i+1}. {name}</span>
                  {!isCompleted && <X size={14} className="text-muted cursor-pointer" onClick={() => handleRemoveClick(name, true)} />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-top">
          {!isCompleted && (
            <form onSubmit={(e) => { e.preventDefault(); handleAddName(newName); }} className="input-group shadow-sm border rounded-3 overflow-hidden">
              <input type="text" placeholder={isFull ? "正赛已满，进入候补..." : "输入姓名..."} value={newName} onChange={(e) => setNewName(e.target.value)} className="form-control border-0 bg-white fw-bold px-3 py-2" />
              <button type="submit" className={`btn border-0 rounded-0 px-3 ${isFull ? 'btn-warning' : 'btn-success'}`}>
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
