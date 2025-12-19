
import React, { useState, useRef } from 'react';
import { Plus, Trash2, MapPin, Download, Upload, Save, MapPinned, Edit2, Check, X, Database, ShieldAlert, RotateCcw } from 'lucide-react';
import { LocationConfig, Session } from '../types';

interface LocationManagerProps {
  locations: LocationConfig[];
  onUpdateLocations: (locs: LocationConfig[]) => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({ locations, onUpdateLocations }) => {
  const [newName, setNewName] = useState('');
  // 修改默认添加费用为 20
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

  // 导出数据
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

  // 导入数据
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
            window.location.reload(); // 刷新以应用数据
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 场地管理卡片 */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <MapPinned className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">场地库管理</h2>
              <p className="text-sm text-slate-500">管理常用球馆及其默认场费</p>
            </div>
          </div>
          <button 
            onClick={handleResetDefaults}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            恢复系统默认
          </button>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="md:col-span-6 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">场地名称</label>
            <input type="text" required placeholder="例如：Sibu Sports Center" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-emerald-500" />
          </div>
          <div className="md:col-span-4 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">默认费用 (RM)</label>
            <input type="number" required value={newFee} onChange={e => setNewFee(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none" />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"><Plus className="w-5 h-5" /><span>添加</span></button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className="flex items-center justify-between p-5 rounded-3xl border border-slate-100 bg-white hover:shadow-md transition-all">
              {editingId === loc.id ? (
                <div className="flex gap-2 w-full">
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 border rounded-xl px-3 py-1 text-sm font-bold" />
                  <button onClick={() => saveEditing(loc.id)} className="bg-emerald-500 text-white p-2 rounded-xl"><Check className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <MapPin className="text-slate-300 w-5 h-5" />
                    <div>
                      <p className="font-bold text-slate-800">{loc.name}</p>
                      <p className="text-xs text-emerald-600 font-black">RM {loc.defaultCourtFee}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingId(loc.id); setEditName(loc.name); setEditFee(loc.defaultCourtFee); }} className="p-2 text-slate-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleRemove(loc.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 数据管理模块 */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">数据备份与迁移</h2>
            <p className="text-sm text-slate-500">将球馆和活动记录保存到文件或从文件恢复</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
               <Download className="w-4 h-4 text-emerald-600" />
               导出数据
             </h3>
             <p className="text-xs text-slate-500 mb-4 leading-relaxed">下载一个 JSON 文件，其中包含所有场地设置和历史报名记录。建议每月手动备份一次。</p>
             <button 
               onClick={exportData}
               className="bg-white border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 font-bold px-6 py-3 rounded-2xl transition-all flex items-center gap-2"
             >
               <span>立即导出备份文件</span>
             </button>
          </div>

          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
               <Upload className="w-4 h-4 text-blue-600" />
               导入恢复
             </h3>
             <p className="text-xs text-slate-500 mb-4 leading-relaxed">从备份文件中恢复数据。警告：导入操作将覆盖当前所有的本地记录，请谨慎操作。</p>
             <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 font-bold px-6 py-3 rounded-2xl transition-all flex items-center gap-2"
             >
               <span>从本地文件恢复</span>
             </button>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
           <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
           <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
             <b>重要：</b> 本应用的所有数据仅存储在您的设备浏览器中。如果您更换电脑、浏览器，或者执行了“清除浏览数据”操作，数据将会清空。请务必定期使用上方的导出功能将数据保存到您的网盘或本地磁盘。
           </p>
        </div>
      </div>
    </div>
  );
};

export default LocationManager;
