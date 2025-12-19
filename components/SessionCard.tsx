
import React, { useState } from 'react';
import { Users, MapPin, X, Trash2, UserPlus, Save, Edit3, Clock, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Edit2, Check, DollarSign } from 'lucide-react';
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
  const [isEditingCosts, setIsEditingCosts] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  
  // States for cost editing
  const [tempShuttleQty, setTempShuttleQty] = useState(session.shuttleQty);
  const [tempShuttlePrice, setTempShuttlePrice] = useState(session.shuttlePrice);
  
  // States for basic details editing
  const [editStartTime, setEditStartTime] = useState(session.time.split(' - ')[0] || '19:00');
  const [editEndTime, setEditEndTime] = useState(session.time.split(' - ')[1] || '21:00');
  const [editCourtCount, setEditCourtCount] = useState(session.courtCount);

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
    
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const handleUpdateCosts = () => {
    onUpdate({ 
      shuttleQty: tempShuttleQty,
      shuttlePrice: tempShuttlePrice 
    });
    setIsEditingCosts(false);
  };

  const handleUpdateDetails = () => {
    onUpdate({ 
      time: `${editStartTime} - ${editEndTime}`,
      courtCount: editCourtCount
    });
    setIsEditingDetails(false);
  };

  const removeParticipant = (name: string) => {
    // 允许普通成员删除，但增加确认步骤防止误操作
    const confirmMsg = isAdmin ? `确定要移除 "${name}" 吗？` : `确定要取消 "${name}" 的报名吗？`;
    if (window.confirm(confirmMsg)) {
      onUpdate({ participants: session.participants.filter(p => p !== name) });
    }
  };

  // Generate time options
  const timeOptions = [];
  for (let i = 8; i <= 23; i++) {
    const hour = i.toString().padStart(2, '0');
    timeOptions.push(`${hour}:00`, `${hour}:30`);
  }

  return (
    <div className="card border-0 shadow-soft rounded-4xl overflow-hidden position-relative h-100" style={{ borderBottom: '4px solid rgba(16, 185, 129, 0.2)' }}>
      
      {/* Toast Overlay */}
      {showSuccessToast && (
        <div className="position-absolute top-0 start-50 translate-middle-x mt-3 z-3 bg-success text-white px-4 py-2 rounded-pill shadow d-flex align-items-center gap-2">
          <CheckCircle2 size={18} />
          <span className="small fw-black">报名成功！ 🎉</span>
        </div>
      )}

      {/* Card Header */}
      <div className="card-header border-0 bg-light p-4">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <h4 className="fw-black text-dark mb-2">
              {new Date(session.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
            </h4>
            
            {isEditingDetails ? (
              <div className="vstack gap-2 mt-2">
                <div className="d-flex align-items-center gap-2">
                  <Clock size={14} className="text-success" />
                  <select 
                    value={editStartTime} 
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="form-select form-select-sm fw-bold rounded-2"
                    style={{ width: '90px' }}
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-muted">-</span>
                  <select 
                    value={editEndTime} 
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="form-select form-select-sm fw-bold rounded-2"
                    style={{ width: '90px' }}
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <MapPin size={14} className="text-danger" />
                  <div className="input-group input-group-sm" style={{ width: '120px' }}>
                    <input 
                      type="number" 
                      min="1"
                      value={editCourtCount} 
                      onChange={(e) => setEditCourtCount(parseInt(e.target.value) || 1)}
                      className="form-control fw-bold"
                    />
                    <span className="input-group-text small px-2">场地</span>
                  </div>
                  <button onClick={handleUpdateDetails} className="btn btn-success btn-sm rounded-circle p-1 ms-2">
                    <Check size={16} />
                  </button>
                  <button onClick={() => {
                    setIsEditingDetails(false);
                    setEditStartTime(session.time.split(' - ')[0]);
                    setEditEndTime(session.time.split(' - ')[1]);
                    setEditCourtCount(session.courtCount);
                  }} className="btn btn-light btn-sm rounded-circle p-1 border">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
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
                    title="编辑时间及场地"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
          
          {isAdmin && (
            <button onClick={onDelete} className="btn btn-link text-muted p-2 rounded-circle hover-danger">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Price Summary */}
      <div className="row g-0 border-top border-bottom">
        <div className="col-6 p-4 border-end">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="text-muted fw-black text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>总费用</small>
            {isAdmin && (
              <button 
                onClick={() => setIsEditingCosts(!isEditingCosts)} 
                className={`btn btn-sm p-1 rounded ${isEditingCosts ? 'btn-success bg-opacity-10' : 'text-muted hover-success'}`}
                title="修改羽毛球数量及单价"
              >
                <Edit3 size={14} />
              </button>
            )}
          </div>
          <h4 className="fw-black mb-1">RM {totalCost.toFixed(2)}</h4>
          <div className="vstack">
            <small className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>场地: RM {session.courtFee}</small>
            {isEditingCosts ? (
              <div className="vstack gap-1 mt-2 p-2 bg-success bg-opacity-10 rounded-3">
                <div className="d-flex align-items-center gap-2">
                  <small className="fw-black text-success" style={{ fontSize: '0.6rem' }}>数量</small>
                  <input 
                    type="number" 
                    value={tempShuttleQty} 
                    onChange={(e) => setTempShuttleQty(parseInt(e.target.value) || 0)}
                    className="form-control form-control-sm fw-black border-success py-0 px-1"
                    style={{ height: '24px' }}
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <small className="fw-black text-success" style={{ fontSize: '0.6rem' }}>单价</small>
                  <input 
                    type="number" 
                    value={tempShuttlePrice} 
                    onChange={(e) => setTempShuttlePrice(parseFloat(e.target.value) || 0)}
                    className="form-control form-control-sm fw-black border-success py-0 px-1"
                    style={{ height: '24px' }}
                  />
                </div>
                <div className="d-flex gap-1 mt-1">
                  <button onClick={handleUpdateCosts} className="btn btn-success btn-sm w-100 py-0" style={{ fontSize: '0.7rem' }}>保存</button>
                  <button onClick={() => setIsEditingCosts(false)} className="btn btn-light btn-sm w-100 py-0 border" style={{ fontSize: '0.7rem' }}>取消</button>
                </div>
              </div>
            ) : (
              <small className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>
                羽毛球: {session.shuttleQty} x RM {session.shuttlePrice.toFixed(2)} (RM {totalShuttleCost.toFixed(2)})
              </small>
            )}
          </div>
        </div>
        <div className="col-6 p-4 bg-light bg-opacity-50">
          <small className="text-success fw-black text-uppercase tracking-wider d-block mb-1" style={{ fontSize: '0.65rem' }}>每人分担 (AA)</small>
          <h4 className="fw-black text-success mb-2">RM {costPerPerson.toFixed(2)}</h4>
          <div className="d-flex align-items-center gap-2">
             <span className={`badge rounded-pill fw-black py-1 px-2 border ${isFull ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25' : 'bg-white text-success border-success border-opacity-25'}`}>
               {participantCount} / {maxParticipants} 人
             </span>
             {isFull && <small className="text-danger fw-black" style={{ fontSize: '0.65rem' }}>已满</small>}
          </div>
        </div>
      </div>

      {/* Participants List */}
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
            </div>
          </div>
        )}

        <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: '120px', maxHeight: '200px' }}>
          {session.participants.length > 0 ? (
            <div className="d-flex flex-wrap gap-2 align-content-start">
              {session.participants.map(name => (
                <div key={name} className="participant-chip d-flex align-items-center gap-2 bg-white border rounded-pill ps-3 pe-1 py-1 shadow-sm hover-success transition-all">
                  <span className="small fw-bold">{name}</span>
                  {/* 现在允许所有成员点击删除按钮 */}
                  <button 
                    onClick={() => removeParticipant(name)} 
                    className="btn btn-link p-1 text-muted hover-danger border-0"
                    title="移除报名"
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
               <small className="fw-bold">报名名额已满，下次请早点哦！</small>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleAddName(newName); }} className="input-group">
              <input
                type="text"
                placeholder="填下名字参与..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="form-control bg-light border-0 rounded-start-4 px-4 py-3 fw-bold"
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
        .hover-bg-light:hover { background-color: rgba(0,0,0,0.05); }
        .fw-black { font-weight: 900 !important; }
        .btn-white { background-color: white !important; }
        .btn-white:hover { border-color: #10b981 !important; color: #10b981 !important; }
      `}</style>
    </div>
  );
};

export default SessionCard;
