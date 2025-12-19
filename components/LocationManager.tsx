
import React, { useState, useRef } from 'react';
import { Plus, Trash2, MapPin, Download, Upload, MapPinned, Edit2, Check, Database, ShieldAlert, RotateCcw } from 'lucide-react';
import { LocationConfig } from '../types';

interface LocationManagerProps {
  locations: LocationConfig[];
  onUpdateLocations: (locs: LocationConfig[]) => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({ locations, onUpdateLocations }) => {
  const [newName, setNewName] = useState('');
  const [newFee, setNewFee] = useState(20);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFee, setEditFee] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onUpdateLocations([...locations, { id: crypto.randomUUID(), name: newName.trim(), defaultCourtFee: newFee }]);
    setNewName('');
    setNewFee(20);
  };

  const handleResetDefaults = () => {
    if (window.confirm('确定要恢复默认场地设置（SRC 和 Perfect Win）吗？这将覆盖您当前的自定义场地库。')) {
      onUpdateLocations([
        { id: '1', name: 'SRC', defaultCourtFee: 20 },
        { id: '2', name: 'Perfect Win', defaultCourtFee: 30 }
      ]);
    }
  };

  const saveEditing = (id: string) => {
    if (!editName.trim()) return;
    onUpdateLocations(locations.map(loc => loc.id === id ? { ...loc, name: editName.trim(), defaultCourtFee: editFee } : loc));
    setEditingId(null);
  };

  const handleRemove = (id: string) => {
    if (window.confirm('确定要删除吗？这将使该场地在未来不可选。')) {
      onUpdateLocations(locations.filter(l => l.id !== id));
    }
  };

  const exportData = () => {
    const sessions = localStorage.getItem('badminton_hub_sessions');
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      locations: locations,
      sessions: sessions ? JSON.parse(sessions) : []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SBG_Badminton_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.locations && data.sessions) {
          if (window.confirm('检测到备份文件，是否覆盖当前所有数据（包括历史记录）？')) {
            onUpdateLocations(data.locations);
            localStorage.setItem('badminton_hub_sessions', JSON.stringify(data.sessions));
            window.location.reload();
          }
        } else {
          alert('文件格式不正确');
        }
      } catch (err) {
        alert('解析失败，请确保文件是正确的备份 JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="vstack gap-5 pb-5">
      <div className="card border-0 shadow-soft rounded-4xl p-4 p-md-5 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 text-success rounded-4 d-flex align-items-center justify-content-center h-auto" style={{ width: '56px', height: '56px' }}>
              <MapPinned size={28} />
            </div>
            <div>
              <h4 className="fw-black text-dark mb-1">场地库管理</h4>
              <p className="small text-muted mb-0">管理常用球馆及其默认场费</p>
            </div>
          </div>
          <button onClick={handleResetDefaults} className="btn btn-link text-muted fw-bold d-flex align-items-center gap-2 p-0 text-decoration-none small">
            <RotateCcw size={16} />
            恢复系统默认
          </button>
        </div>

        <form onSubmit={handleAdd} className="row g-3 mb-5 p-4 bg-light rounded-4 border">
          <div className="col-lg-6">
            <label className="form-label small fw-black text-muted text-uppercase tracking-wider px-1">场地名称</label>
            <input type="text" required placeholder="例如：Sibu Sports Center" value={newName} onChange={e => setNewName(e.target.value)} className="form-control form-control-lg border-0 rounded-3 fw-bold" />
          </div>
          <div className="col-lg-4">
            <label className="form-label small fw-black text-muted text-uppercase tracking-wider px-1">默认费用 (RM)</label>
            <input type="number" required value={newFee} onChange={e => setNewFee(parseFloat(e.target.value) || 0)} className="form-control form-control-lg border-0 rounded-3 fw-bold" />
          </div>
          <div className="col-lg-2 d-flex align-items-end">
            <button type="submit" className="btn btn-success btn-lg w-100 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 py-3">
              <Plus size={20} />
              <span>添加</span>
            </button>
          </div>
        </form>

        <div className="row g-3">
          {locations.map(loc => (
            <div key={loc.id} className="col-md-6">
              <div className="card border bg-white rounded-3 shadow-sm p-4 h-100 hover-border-success transition-all">
                {editingId === loc.id ? (
                  <div className="d-flex gap-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="form-control fw-bold" />
                    <button onClick={() => saveEditing(loc.id)} className="btn btn-success px-3"><Check size={20} /></button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <MapPin size={24} className="text-muted opacity-25" />
                      <div>
                        <p className="fw-black text-dark mb-0">{loc.name}</p>
                        <p className="small text-success fw-black mb-0">RM {loc.defaultCourtFee}</p>
                      </div>
                    </div>
                    <div className="btn-group">
                      <button onClick={() => { setEditingId(loc.id); setEditName(loc.name); setEditFee(loc.defaultCourtFee); }} className="btn btn-link text-muted p-2 hover-primary"><Edit2 size={18} /></button>
                      <button onClick={() => handleRemove(loc.id)} className="btn btn-link text-muted p-2 hover-danger"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card border-0 shadow-soft rounded-4xl p-4 p-md-5 bg-white">
        <div className="d-flex align-items-center gap-3 mb-5">
          <div className="bg-primary bg-opacity-10 text-primary rounded-4 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
            <Database size={28} />
          </div>
          <div>
            <h4 className="fw-black text-dark mb-1">数据备份与迁移</h4>
            <p className="small text-muted mb-0">将球馆和活动记录保存到文件或从文件恢复</p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-6">
            <div className="p-4 bg-light rounded-4 border h-100 d-flex flex-column gap-3">
               <h6 className="fw-black text-dark mb-1 d-flex align-items-center gap-2">
                 <Download size={18} className="text-success" />
                 导出数据
               </h6>
               <p className="small text-muted mb-auto">下载包含所有场地设置和历史记录的 JSON 备份。建议定期手动下载保存。</p>
               <button onClick={exportData} className="btn btn-outline-dark rounded-3 fw-bold py-2 mt-3 d-flex align-items-center justify-content-center gap-2">
                 <span>立即导出备份</span>
               </button>
            </div>
          </div>

          <div className="col-md-6">
            <div className="p-4 bg-light rounded-4 border h-100 d-flex flex-column gap-3">
               <h6 className="fw-black text-dark mb-1 d-flex align-items-center gap-2">
                 <Upload size={18} className="text-primary" />
                 导入恢复
               </h6>
               <p className="small text-muted mb-auto">从备份文件恢复。警告：导入操作将覆盖当前所有的本地记录，请谨慎操作。</p>
               <input type="file" ref={fileInputRef} onChange={importData} className="d-none" accept=".json" />
               <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline-primary rounded-3 fw-bold py-2 mt-3 d-flex align-items-center justify-content-center gap-2">
                 <span>从本地文件恢复</span>
               </button>
            </div>
          </div>
        </div>

        <div className="alert alert-warning bg-warning bg-opacity-10 border-0 rounded-4 d-flex gap-3 mt-5 p-4">
           <ShieldAlert size={24} className="text-warning flex-shrink-0" />
           <p className="small text-dark text-opacity-75 mb-0 lh-base">
             <b>重要：</b> 数据存储在您的浏览器中。清理缓存或更换设备将丢失数据。请务必定期导出备份到云端。
           </p>
        </div>
      </div>
      <style>{`
        .hover-border-success:hover { border-color: #10b981 !important; transform: translateY(-3px); }
        .hover-primary:hover { color: #3b82f6 !important; }
      `}</style>
    </div>
  );
};

export default LocationManager;
