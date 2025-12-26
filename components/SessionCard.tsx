
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

  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);

  const totalShuttleCost = session.shuttleQty * session.shuttlePrice;
  const totalCost = session.courtFee + totalShuttleCost;
  const participantCount = session.participants.length;
  const maxParticipants = session.maxParticipants || 8;
  const isFull = participantCount >= maxParticipants;
  const costPerPerson = participantCount > 0 ? totalCost / participantCount : totalCost;

  const isPendingDeletion = (name: string) => {
    return session.deletionRequests?.includes(name) || false;
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
    if (config) {
      newCourtFee = Number(config.defaultCourtFee) * editCourtCount;
    } else {
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

  // 核心逻辑：从待定名单晋升一名到正式名单
  const promoteFromWaiting = (currentParticipants: string[], currentWaiting: string[]) => {
    if (currentParticipants.length < maxParticipants && currentWaiting.length > 0) {
      const [next, ...rest] = currentWaiting;
      return { 
        participants: [...currentParticipants, next], 
        waitingList: rest 
      };
    }
    return { participants: currentParticipants, waitingList: currentWaiting };
  };

  const handleRemoveClick = (name: string, isFromWaitingList: boolean = false) => {
    if (isCompleted) return;
    
    const confirmMsg = isAdmin 
      ? `管理员权限：确定直接移除 "${name}" 吗？` 
      : `确定要申请退出吗？\n您的申请将提交给管理员审核。`;

    if (!window.confirm(confirmMsg)) return;

    if (isAdmin) {
      let updatedParticipants = [...session.participants];
      let updatedWaiting = [...(session.waitingList || [])];

      if (isFromWaitingList) {
        updatedWaiting = updatedWaiting.filter(p => p !== name);
      } else {
        updatedParticipants = updatedParticipants.filter(p => p !== name);
        // 自动顺延
        const promoted = promoteFromWaiting(updatedParticipants, updatedWaiting);
        updatedParticipants = promoted.participants;
        updatedWaiting = promoted.waitingList;
      }

      onUpdate({ 
        participants: updatedParticipants,
        waitingList: updatedWaiting,
        deletionRequests: (session.deletionRequests || []).filter(p => p !== name)
      });
    } else {
      if (isPendingDeletion(name)) {
        alert("您已经提交过申请了。");
        return;
      }
      onUpdate({ deletionRequests: [...(session.deletionRequests || []), name] });
    }
  };

  const handleApproveDeletion = (name: string) => {
    if (!window.confirm(`确认批准 "${name}" 退出吗？系统将尝试让待定人员补位。`)) return;
    
    let updatedParticipants = session.participants.filter(p => p !== name);
    let updatedWaiting = [...(session.waitingList || [])];
    
    // 自动顺延
    const promoted = promoteFromWaiting(updatedParticipants, updatedWaiting);
    
    onUpdate({ 
      participants: promoted.participants,
      waitingList: promoted.waitingList,
      deletionRequests: (session.deletionRequests || []).filter(p => p !== name)
    });
  };

  const handleCompleteActivity = () => {
    if (window.confirm('确定结束本场活动吗？结束后将无法再次报名或修改，活动将移至历史记录。')) {
      onUpdate({ status: 'completed' });
    }
  };

  const timeOptions = [];
  for (let i = 8; i <= 23; i++) {
    const hour = i.toString().padStart(2, '0');
    timeOptions.push(`${hour}:00`, `${hour}:30`);
  }

  return (
    <div className={`card border-0 shadow-soft rounded-4xl overflow-hidden position-relative h-100 transition-all ${isCompleted ? 'grayscale-75 opacity-90' : ''}`} style={{ borderBottom: isCompleted ? '4px solid #94a3b8' : '4px solid rgba(16, 185, 129, 0.2)' }}>
      {showSuccessToast && (
        <div className="position-absolute top-0 start-50 translate-middle-x mt-3 z-3 bg-success text-white px-4 py-2 rounded-pill shadow d-flex align-items-center gap-2">
          <CheckCircle2 size={18} />
          <span className="small fw-black">报名成功！ 🎉</span>
        </div>
      )}

      {isCompleted && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center pointer-events-none z-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
           <div className="bg-dark bg-opacity-75 text-white px-4 py-2 rounded-pill fw-black shadow-lg animate-in zoom-in">
             <PackageCheck className="me-2 d-inline" size={20} /> 已圆满结束
           </div>
        </div>
      )}

      <div className={`card-header border-0 p-4 ${isCompleted ? 'bg-secondary bg-opacity-10' : 'bg-light'}`}>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            {isEditingDetails ? (
              <div className="vstack gap-2 mt-2 bg-white p-3 rounded-3 shadow-sm border border-success border-opacity-25 animate-in slide-in-from-top-2">
                <div className="row g-2">
                   <div className="col-12">
                     <label className="x-small fw-black text-muted text-uppercase d-block mb-1">修改活动日期</label>
                     <input 
                       type="date"
                       value={editDate}
                       onChange={(e) => setEditDate(e.target.value)}
                       className="form-control form-control-sm fw-bold border-success border-opacity-50"
                     />
                   </div>
                   <div className="col-8">
                    <label className="x-small fw-black text-muted text-uppercase d-block mb-1">时间段</label>
                    <div className="d-flex align-items-center gap-2">
                      <select value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="form-select form-select-sm fw-bold">
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-muted">-</span>
                      <select value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="form-select form-select-sm fw-bold">
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="col-4">
                    <label className="x-small fw-black text-muted text-uppercase d-block mb-1">场地数</label>
                    <input type="number" min="1" value={editCourtCount} onChange={(e) => setEditCourtCount(parseInt(e.target.value) || 1)} className="form-control form-control-sm fw-bold text-center" />
                  </div>
                </div>
                <div className="d-flex gap-2 mt-2">
                  <button onClick={handleUpdateDetails} className="btn btn-success btn-sm flex-grow-1 fw-black shadow-sm">保存</button>
                  <button onClick={() => setIsEditingDetails(false)} className="btn btn-light btn-sm border">取消</button>
                </div>
              </div>
            ) : (
              <>
                <h4 className={`fw-black mb-2 ${isCompleted ? 'text-muted' : 'text-dark'}`}>
                  {new Date(session.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
                </h4>
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <span className={`badge rounded-pill px-3 py-2 d-flex align-items-center gap-1 border ${isCompleted ? 'bg-secondary bg-opacity-10 text-muted border-secondary' : 'bg-success bg-opacity-10 text-success border-success border-opacity-25'}`}>
                    <Clock size={14} />
                    <span className="fw-bold">{session.time}</span>
                  </span>
                  <div className="d-flex align-items-center gap-1 small fw-bold text-muted">
                    <MapPin size={14} className={isCompleted ? 'text-secondary' : 'text-danger'} />
                    <span className="text-truncate" style={{ maxWidth: '120px' }}>{session.location}</span>
                    <span className="text-muted opacity-25 mx-1">/</span>
                    <span>{session.courtCount} 场地</span>
                  </div>
                  {isAdmin && !isCompleted && (
                    <button onClick={() => setIsEditingDetails(true)} className="btn btn-link text-success p-1 rounded-circle hover-bg-light" title="编辑详情">
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
                <button onClick={handleCompleteActivity} className="btn btn-outline-success btn-sm rounded-pill fw-black px-3 py-1 shadow-sm d-flex align-items-center gap-1" title="结束并归档">
                  <CheckCircle size={14} /> 结束活动
                </button>
              )}
              <button onClick={onDelete} className="btn btn-link text-muted p-2 rounded-circle hover-danger">
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="row g-0 border-top border-bottom">
        <div className="col-6 p-4 border-end">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="text-muted fw-black text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>总费用预算</small>
            {isAdmin && !isCompleted && (
              <button onClick={() => setIsEditingCosts(!isEditingCosts)} className={`btn btn-sm p-1 rounded ${isEditingCosts ? 'btn-success bg-opacity-10' : 'text-muted hover-success'}`}>
                <Edit3 size={14} />
              </button>
            )}
          </div>
          <h4 className="fw-black mb-1">RM {totalCost.toFixed(2)}</h4>
          <div className="vstack">
            {isEditingCosts ? (
              <div className="vstack gap-1 mt-2 p-2 bg-success bg-opacity-10 rounded-3">
                <div className="d-flex align-items-center justify-content-between px-1">
                  <small className="fw-black text-success x-small">球数</small>
                  <input type="number" value={tempShuttleQty} onChange={(e) => setTempShuttleQty(parseInt(e.target.value) || 0)} className="form-control form-control-sm border-success py-0 px-1 text-center" style={{ width: '40px', height: '22px' }} />
                </div>
                <div className="d-flex align-items-center justify-content-between px-1">
                  <small className="fw-black text-success x-small">单价</small>
                  <input type="number" step="0.1" value={tempShuttlePrice} onChange={(e) => setTempShuttlePrice(parseFloat(e.target.value) || 0)} className="form-control form-control-sm border-success py-0 px-1 text-center" style={{ width: '60px', height: '22px' }} />
                </div>
                <button onClick={handleUpdateCosts} className="btn btn-success btn-sm w-100 py-0 fw-black shadow-sm mt-1" style={{ fontSize: '0.7rem' }}>保存</button>
              </div>
            ) : (
              <>
                <small className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>场地: RM {session.courtFee.toFixed(2)}</small>
                <small className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>用球: {session.shuttleQty} x RM {session.shuttlePrice.toFixed(2)}</small>
              </>
            )}
          </div>
        </div>
        <div className={`col-6 p-4 ${isCompleted ? 'bg-secondary bg-opacity-10' : 'bg-light bg-opacity-50'}`}>
          <small className="text-success fw-black text-uppercase tracking-wider d-block mb-1" style={{ fontSize: '0.65rem' }}>每人应缴 (AA)</small>
          <h4 className={`fw-black mb-2 ${isCompleted ? 'text-muted' : 'text-success'}`}>RM {costPerPerson.toFixed(2)}</h4>
          <div className="d-flex align-items-center gap-2">
             <span className={`badge rounded-pill fw-black py-1 px-2 border ${isFull ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25' : 'bg-white text-success border-success border-opacity-25'}`}>
               {participantCount} / {maxParticipants} 人
             </span>
             {session.waitingList && session.waitingList.length > 0 && (
               <span className="badge rounded-pill bg-warning text-dark fw-black py-1 px-2 border-warning border-opacity-25">
                 +{session.waitingList.length} 排队
               </span>
             )}
          </div>
        </div>
      </div>

      <div className="card-body p-4 d-flex flex-column gap-3">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="fw-black mb-0 d-flex align-items-center gap-2">
            <Users size={18} className={isCompleted ? 'text-muted' : 'text-success'} />
            正式名单
          </h6>
          {!isCompleted && (
            <button onClick={() => setShowQuickAdd(!showQuickAdd)} className="btn btn-link btn-sm text-success text-decoration-none fw-black p-0 d-flex align-items-center gap-1">
              {showQuickAdd ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              <small>常用名单</small>
            </button>
          )}
        </div>

        {showQuickAdd && !isCompleted && (
          <div className="p-3 bg-light rounded-4 border animate-in fade-in">
            <div className="d-flex flex-wrap gap-2 overflow-auto" style={{ maxHeight: '100px' }}>
              {frequentParticipants.filter(n => !session.participants.includes(n) && !session.waitingList?.includes(n)).map(name => (
                <button key={name} onClick={() => handleAddName(name)} className="btn btn-sm btn-white border rounded-pill px-3 py-1 fw-bold small shadow-sm">+ {name}</button>
              ))}
              {frequentParticipants.length === 0 && <span className="small text-muted">暂无常用名单</span>}
            </div>
          </div>
        )}

        {/* 正式名单区域 */}
        <div className="vstack gap-2 overflow-auto pe-1" style={{ minHeight: '60px', maxHeight: '180px' }}>
          {session.participants.map(name => {
            const pending = isPendingDeletion(name);
            return (
              <div key={name} className={`d-flex align-items-center justify-content-between p-2 px-3 border rounded-3 transition-all ${pending ? 'bg-warning bg-opacity-10 border-warning border-dashed' : 'bg-white shadow-sm'}`}>
                <div className="d-flex align-items-center gap-2">
                  <span className={`fw-bold ${pending ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>{name}</span>
                  {pending && (
                    <span className="badge bg-warning text-warning bg-opacity-10 border border-warning border-opacity-25 rounded-pill px-2 py-1 x-small animate-pulse d-flex align-items-center gap-1">
                      <ShieldAlert size={10} /> 待审批
                    </span>
                  )}
                </div>
                
                <div className="d-flex align-items-center gap-1">
                  {isAdmin && pending && !isCompleted ? (
                    <div className="d-flex gap-1 animate-in zoom-in">
                      <button onClick={() => handleApproveDeletion(name)} className="btn btn-success btn-sm rounded-circle p-1 shadow-sm" title="批准退出"><UserCheck size={14} /></button>
                      <button onClick={() => onUpdate({ deletionRequests: (session.deletionRequests || []).filter(p => p !== name) })} className="btn btn-outline-danger btn-sm rounded-circle p-1" title="驳回申请"><UserX size={14} /></button>
                    </div>
                  ) : !isCompleted && (
                    <button onClick={() => handleRemoveClick(name)} className={`btn btn-link p-1 text-muted border-0 hover-${isAdmin ? 'danger' : 'warning'}`} title={isAdmin ? "直接移除" : "申请退出"}>
                      {isAdmin ? <Trash2 size={16} /> : <X size={16} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 待定名单区域 */}
        {session.waitingList && session.waitingList.length > 0 && (
          <div className="mt-2 pt-2 border-top">
            <h6 className="fw-black text-warning small mb-2 d-flex align-items-center gap-2">
              <Timer size={14} /> 待定名单 (排队中)
            </h6>
            <div className="vstack gap-2">
              {session.waitingList.map((name, index) => (
                <div key={name} className="d-flex align-items-center justify-content-between p-2 px-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 border-dashed rounded-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-black text-warning small">{index + 1}.</span>
                    <span className="fw-bold text-dark small">{name}</span>
                  </div>
                  {!isCompleted && (
                    <button onClick={() => handleRemoveClick(name, true)} className="btn btn-link p-1 text-muted border-0 hover-danger" title="移除排队">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-top">
          {isCompleted ? (
            <div className="alert alert-secondary bg-secondary bg-opacity-10 border-0 rounded-4 d-flex align-items-center gap-2 p-3 mb-0">
               <PackageCheck size={18} className="flex-shrink-0" />
               <small className="fw-bold">此活动已结束归档</small>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleAddName(newName); }} className="input-group">
              <input type="text" placeholder={isFull ? "正式名额已满，点此进入待定..." : "填写名字报名..."} value={newName} onChange={(e) => setNewName(e.target.value)} className={`form-control border-0 rounded-start-4 px-4 py-3 fw-bold shadow-none ${isFull ? 'bg-warning bg-opacity-10' : 'bg-light'}`} />
              <button type="submit" className={`btn rounded-end-4 px-4 shadow-sm ${isFull ? 'btn-warning text-dark' : 'btn-success text-white'}`} disabled={!newName.trim()}>
                {isFull ? <Timer size={24} /> : <UserPlus size={24} />}
              </button>
            </form>
          )}
        </div>
      </div>
      
      <style>{`
        .grayscale-75 { filter: grayscale(0.75); }
        .hover-danger:hover { color: #ef4444 !important; }
        .hover-warning:hover { color: #f59e0b !important; }
        .fw-black { font-weight: 900 !important; }
        .x-small { font-size: 0.65rem; }
        .transition-all { transition: all 0.2s ease; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
        .animate-pulse { animation: pulse 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default SessionCard;
