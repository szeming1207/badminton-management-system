
import React from 'react';
import { Users, MapPin, X, Trash2, UserPlus, Save, Edit3, Clock, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Edit2, Check, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
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
  
  React.useEffect(() => {
    if (!isEditingCosts) {
      setTempCourtFee(session.courtFee);
      setTempShuttleQty(session.shuttleQty);
      setTempShuttlePrice(session.shuttlePrice);
    }
  }, [session.courtFee, session.shuttleQty, session.shuttlePrice, isEditingCosts]);

  // 编辑详情状态，包括日期
  const [editDate, setEditDate] = React.useState(session.date);
  const [editStartTime, setEditStartTime] = React.useState(session.time.split(' - ')[0] || '19:00');
  const [editEndTime, setEditEndTime] = React.useState(session.time.split(' - ')[1] || '21:00');
  const [editCourtCount, setEditCourtCount] = React.useState(session.courtCount);

  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);

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
    
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
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
    let newCourtFee = session.courtFee;
    const config = locations.find(l => l.name === session.location);
    
    // 如果找到了对应的场地配置，重新计算默认场地费
    if (config) {
      newCourtFee = Number(config.defaultCourtFee) * editCourtCount;
    } else {
      // 否则根据当前费用比例缩放
      const oldRate = session.courtFee / (session.courtCount || 1);
      newCourtFee = oldRate * editCourtCount;
    }

    onUpdate({ 
      date: editDate,
      time: `${editStartTime} - ${editEndTime}`,
      courtCount: editCourtCount,
      courtFee: newCourtFee
    });
    setIsEditingDetails(false);
  };

  const removeParticipant = (name: string) => {
    const confirmMsg = isAdmin ? `确定要移除 "${name}" 吗？` : `确定要取消 "${name}" 的报名吗？`;
    if (window.confirm(confirmMsg)) {
      onUpdate({ participants: session.participants.filter(p => p !== name) });
    }
  };

  const timeOptions = [];
  for (let i = 8; i <= 23; i++) {
    const hour = i.toString().padStart(2, '0');
    timeOptions.push(`${hour}:00`, `${hour}:30`);
  }

  return (
    <div className="card border-0 shadow-soft rounded-4xl overflow-hidden position-relative h-100" style={{ borderBottom: '4px solid rgba(16, 185, 129, 0.2)' }}>
      {showSuccessToast && (
        <div className="position-absolute top-0 start-50 translate-middle-x mt-3 z-3 bg-success text-white px-4 py-2 rounded-pill shadow d-flex align-items-center gap-2">
          <CheckCircle2 size={18} />
          <span className="small fw-black">报名成功！ 🎉</span>
        </div>
      )}

      <div className="card-header border-0 bg-light p-4">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            {isEditingDetails ? (
              <div className="vstack gap-2 mt-2 bg-white p-3 rounded-3 shadow-sm border border-success border-opacity-25">
                <div>
                  <label className="x-small fw-black text-muted text-uppercase d-block mb-1">修改活动日期</label>
                  <div className="d-flex align-items-center gap-2">
                    <CalendarIcon size={14} className="text-success" />
                    <input 
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="form-control form-control-sm fw-bold rounded-2 border-success border-opacity-50"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                
                <div className="row g-2">
                  <div className="col-8">
                    <label className="x-small fw-black text-muted text-uppercase d-block mb-1">时间段</label>
                    <div className="d-flex align-items-center gap-2">
                      <Clock size={14} className="text-success" />
                      <select 
                        value={editStartTime} 
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="form-select form-select-sm fw-bold rounded-2"
                      >
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-muted">-</span>
                      <select 
                        value={editEndTime} 
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="form-select form-select-sm fw-bold rounded-2"
                      >
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="col-4">
                    <label className="x-small fw-black text-muted text-uppercase d-block mb-1">场地数</label>
                    <input 
                      type="number" 
                      min="1"
                      value={editCourtCount} 
                      onChange={(e) => setEditCourtCount(parseInt(e.target.value) || 1)}
                      className="form-control form-control-sm fw-bold rounded-2 text-center"
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 mt-2">
                  <button onClick={handleUpdateDetails} className="btn btn-success btn-sm flex-grow-1 fw-black d-flex align-items-center justify-content-center gap-1 shadow-sm">
                    <Check size={14} /> 保存修改
                  </button>
                  <button onClick={() => {
                    setIsEditingDetails(false);
                    setEditDate(session.date);
                    setEditStartTime(session.time.split(' - ')[0]);
                    setEditEndTime(session.time.split(' - ')[1]);
                    setEditCourtCount(session.courtCount);
                  }} className="btn btn-light btn-sm px-3 border">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h4 className="fw-black text-dark mb-2">
                  {new Date(session.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
                </h4>
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 d-flex align-items-center gap-1 border border-success border-opacity-25">
                    <Clock size={14} />
                    <span className="fw-bold">{session.time}</span>
                  </span>
                  <div className="d-flex align-items-center gap-1 small fw-bold text-muted">
                    <MapPin size={14} className="text-danger" />
                    <span className="text-truncate" style={{ maxWidth: '120px' }}>{session.location}</span>
                    <span className="text-muted opacity-25 mx-1">/</span>
                    <span>{session.courtCount} 场地</span>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => setIsEditingDetails(true)} 
                      className="btn btn-link text-success p-1 rounded-circle hover-bg-light"
                      title="编辑日期、时间及场地数量"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          
          {isAdmin && (
            <button onClick={onDelete} className="btn btn-link text-muted p-2 rounded-circle hover-danger">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="row g-0 border-top border-bottom">
        <div className="col-6 p-4 border-end">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="text-muted fw-black text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>总费用预算</small>
            {isAdmin && (
              <button 
                onClick={() => setIsEditingCosts(!isEditingCosts)} 
                className={`btn btn-sm p-1 rounded ${isEditingCosts ? 'btn-success bg-opacity-10' : 'text-muted hover-success'}`}
                title="修改羽毛球费用"
              >
                <Edit3 size={14} />
              </button>
            )}
          </div>
          <h4 className="fw-black mb-1">RM {totalCost.toFixed(2)}</h4>
          <div className="vstack">
            {isEditingCosts ? (
              <div className="vstack gap-1 mt-2 p-2 bg-success bg-opacity-10 rounded-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <small className="fw-black text-success" style={{ fontSize: '0.6rem' }}>场地费 (锁定)</small>
                  <input 
                    type="number" 
                    readOnly
                    value={tempCourtFee.toFixed(2)} 
                    className="form-control form-control-sm fw-black border-0 bg-transparent py-0 px-1 text-success cursor-not-allowed"
                    style={{ height: '24px' }}
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <small className="fw-black text-success" style={{ fontSize: '0.6rem' }}>球数量</small>
                  <input 
                    type="number" 
                    value={tempShuttleQty} 
                    onChange={(e) => setTempShuttleQty(parseInt(e.target.value) || 0)}
                    className="form-control form-control-sm fw-black border-success py-0 px-1 shadow-sm"
                    style={{ height: '24px' }}
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <small className="fw-black text-success" style={{ fontSize: '0.6rem' }}>球单价</small>
                  <input 
                    type="number" 
                    step="0.1"
                    value={tempShuttlePrice} 
                    onChange={(e) => setTempShuttlePrice(parseFloat(e.target.value) || 0)}
                    className="form-control form-control-sm fw-black border-success py-0 px-1 shadow-sm"
                    style={{ height: '24px' }}
                  />
                </div>
                <div className="d-flex gap-1 mt-2">
                  <button onClick={handleUpdateCosts} className="btn btn-success btn-sm w-100 py-0 fw-black shadow-sm" style={{ fontSize: '0.7rem' }}>保存</button>
                  <button onClick={() => {
                    setIsEditingCosts(false);
                    setTempCourtFee(session.courtFee);
                    setTempShuttleQty(session.shuttleQty);
                    setTempShuttlePrice(session.shuttlePrice);
                  }} className="btn btn-light btn-sm w-100 py-0 border" style={{ fontSize: '0.7rem' }}>取消</button>
                </div>
              </div>
            ) : (
              <>
                <small className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>场地: RM {session.courtFee.toFixed(2)}</small>
                <small className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>
                  羽毛球: {session.shuttleQty} x RM {session.shuttlePrice.toFixed(2)}
                </small>
              </>
            )}
          </div>
        </div>
        <div className="col-6 p-4 bg-light bg-opacity-50">
          <small className="text-success fw-black text-uppercase tracking-wider d-block mb-1" style={{ fontSize: '0.65rem' }}>每人应缴 (AA)</small>
          <h4 className="fw-black text-success mb-2">RM {costPerPerson.toFixed(2)}</h4>
          <div className="d-flex align-items-center gap-2">
             <span className={`badge rounded-pill fw-black py-1 px-2 border ${isFull ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25' : 'bg-white text-success border-success border-opacity-25'}`}>
               {participantCount} / {maxParticipants} 人
             </span>
          </div>
        </div>
      </div>

      <div className="card-body p-4 d-flex flex-column gap-3">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="fw-black mb-0 d-flex align-items-center gap-2">
            <Users size={18} className="text-success" />
            报名名单
          </h6>
          <button onClick={() => setShowQuickAdd(!showQuickAdd)} className="btn btn-link btn-sm text-success text-decoration-none fw-black p-0 d-flex align-items-center gap-1">
            {showQuickAdd ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            <small>常用名单</small>
          </button>
        </div>

        {showQuickAdd && (
          <div className="p-3 bg-light rounded-4 border animate-in fade-in">
            <div className="d-flex flex-wrap gap-2 overflow-auto" style={{ maxHeight: '100px' }}>
              {frequentParticipants.filter(n => !session.participants.includes(n)).map(name => (
                <button 
                  key={name}
                  onClick={() => handleAddName(name)}
                  disabled={isFull}
                  className="btn btn-sm btn-white border rounded-pill px-3 py-1 fw-bold small shadow-sm"
                >
                  + {name}
                </button>
              ))}
              {frequentParticipants.length === 0 && <span className="small text-muted">暂无历史名单</span>}
            </div>
          </div>
        )}

        <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: '120px', maxHeight: '200px' }}>
          {session.participants.length > 0 ? (
            <div className="d-flex flex-wrap gap-2 align-content-start">
              {session.participants.map(name => (
                <div key={name} className="participant-chip d-flex align-items-center gap-2 bg-white border rounded-pill ps-3 pe-1 py-1 shadow-sm hover-success transition-all">
                  <span className="small fw-bold">{name}</span>
                  <button 
                    onClick={() => removeParticipant(name)} 
                    className="btn btn-link p-1 text-muted hover-danger border-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center border border-dashed rounded-4 p-4 text-muted opacity-50">
              <Users size={32} className="mb-2" />
              <small className="fw-bold">暂时还没有人报名...</small>
            </div>
          )}
        </div>

        <div className="pt-2 border-top">
          {isFull ? (
            <div className="alert alert-danger bg-danger bg-opacity-10 border-0 rounded-4 d-flex align-items-center gap-2 p-3 mb-0">
               <AlertCircle size={18} className="flex-shrink-0" />
               <small className="fw-bold">本场报名已满</small>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleAddName(newName); }} className="input-group">
              <input
                type="text"
                placeholder="填写名字报名..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="form-control bg-light border-0 rounded-start-4 px-4 py-3 fw-bold shadow-none"
              />
              <button 
                type="submit"
                className="btn btn-success rounded-end-4 px-4 shadow-sm"
                disabled={!newName.trim() || isFull}
              >
                <UserPlus size={24} />
              </button>
            </form>
          )}
        </div>
      </div>
      
      <style>{`
        .participant-chip:hover { border-color: #10b981 !important; background-color: #f0fdf4 !important; }
        .hover-danger:hover { color: #ef4444 !important; }
        .hover-success:hover { color: #10b981 !important; }
        .fw-black { font-weight: 900 !important; }
        .btn-white { background-color: white !important; }
        .cursor-not-allowed { cursor: not-allowed; }
        .x-small { font-size: 0.65rem; }
      `}</style>
    </div>
  );
};

export default SessionCard;
