
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, Settings, BarChart3, Users, Clock, History, MapPin, Lock, Unlock, LogOut, ShieldCheck, User as UserIcon, MapPinned } from 'lucide-react';
import { Session, LocationConfig } from './types';
import SessionCard from './components/SessionCard';
import AdminModal from './components/AdminModal';
import AnalyticsSection from './components/AnalyticsSection';
import SmartAdvisor from './components/SmartAdvisor';
import LoginPage from './components/LoginPage';
import LocationManager from './components/LocationManager';

const STORAGE_KEY = 'badminton_hub_sessions';
const LOCATIONS_KEY = 'badminton_hub_locations';
const AUTH_KEY = 'badminton_hub_auth_role';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  // 更新初始场地列表
  const [locations, setLocations] = useState<LocationConfig[]>([
    { id: '1', name: 'SRC', defaultCourtFee: 20 },
    { id: '2', name: 'Perfect Win', defaultCourtFee: 30 }
  ]);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'analytics' | 'settings'>('sessions');

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    const savedLocations = localStorage.getItem(LOCATIONS_KEY);
    const savedRole = localStorage.getItem(AUTH_KEY) as 'admin' | 'user' | null;
    
    if (savedSessions) try { setSessions(JSON.parse(savedSessions)); } catch (e) {}
    if (savedLocations) try { setLocations(JSON.parse(savedLocations)); } catch (e) {}
    if (savedRole) setUserRole(savedRole);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  }, [locations]);

  const handleLogin = (role: 'admin' | 'user') => {
    setUserRole(role);
    localStorage.setItem(AUTH_KEY, role);
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem(AUTH_KEY);
  };

  const addSession = (sessionData: Omit<Session, 'id' | 'participants'>) => {
    const newSession: Session = {
      ...sessionData,
      id: crypto.randomUUID(),
      participants: [],
    };
    setSessions([newSession, ...sessions]);
    setIsModalOpen(false);
  };

  const updateSession = (id: string, updated: Partial<Session>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const deleteSession = (id: string) => {
    if (isAdmin && window.confirm('确定要删除这个场次吗？')) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  const saveLocations = (newLocs: LocationConfig[]) => {
    setLocations(newLocs);
  };

  const isSessionActive = (session: Session) => {
    try {
      const parts = session.time.split(' - ');
      const endTimeStr = parts[1];
      const sessionEnd = new Date(`${session.date}T${endTimeStr}:00`);
      const now = new Date();
      const expiryTime = new Date(sessionEnd.getTime() + 2 * 60 * 60 * 1000);
      return now < expiryTime;
    } catch (e) {
      return true;
    }
  };

  const { activeSessions, archivedSessions } = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return {
      activeSessions: sorted.filter(isSessionActive),
      archivedSessions: sorted.filter(s => !isSessionActive(s))
    };
  }, [sessions]);

  const frequentParticipants = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach(s => s.participants.forEach(p => names.add(p)));
    return Array.from(names).sort();
  }, [sessions]);

  if (!userRole) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <Calendar className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">Badminton Hub</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {isAdmin ? <ShieldCheck className="w-3 h-3 text-emerald-600" /> : <UserIcon className="w-3 h-3 text-blue-500" />}
              {isAdmin ? '管理员模式' : '普通成员'}
            </div>

            {isAdmin && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-emerald-200 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">创建活动</span>
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
              title="登出"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
        <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'sessions' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>场次预定</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>统计历史</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'settings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <MapPinned className="w-4 h-4" />
              <span>场地管理</span>
            </button>
          )}
        </div>

        {activeTab === 'sessions' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                <Clock className="w-5 h-5 text-emerald-500" />
                正在报名 ({activeSessions.length})
              </h2>
              {activeSessions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400">目前暂无活跃活动</p>
                  {isAdmin && <p className="text-xs text-slate-300 mt-2">管理员请点击右上角发布新球局</p>}
                </div>
              ) : (
                activeSessions.map(session => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    isAdmin={isAdmin}
                    frequentParticipants={frequentParticipants}
                    onUpdate={(updated) => updateSession(session.id, updated)}
                    onDelete={() => deleteSession(session.id)}
                  />
                ))
              )}
            </div>
            
            <div className="space-y-6">
              <SmartAdvisor sessions={sessions} />

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                   <MapPin className="w-4 h-4 text-emerald-500" />
                   活跃场地与价格
                </h3>
                <div className="space-y-2">
                  {locations.map(loc => (
                    <div key={loc.id} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700">{loc.name}</span>
                      <span className="text-emerald-600 font-black">RM {loc.defaultCourtFee}</span>
                    </div>
                  ))}
                  {isAdmin && (
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="w-full mt-2 py-2 text-[10px] text-emerald-600 font-bold border border-dashed border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      前往管理场地库
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <AnalyticsSection sessions={sessions} />
            <div className="space-y-4">
               <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500" />
                已归档历史
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {archivedSessions.map(session => (
                  <div key={session.id} className="opacity-70 grayscale-[0.5] hover:grayscale-0 transition-all">
                    <SessionCard 
                      session={session} 
                      isAdmin={isAdmin}
                      frequentParticipants={frequentParticipants}
                      onUpdate={(updated) => updateSession(session.id, updated)}
                      onDelete={() => deleteSession(session.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && isAdmin && (
          <LocationManager locations={locations} onUpdateLocations={saveLocations} />
        )}
      </main>

      <AdminModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={addSession} 
        locations={locations}
      />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default App;
