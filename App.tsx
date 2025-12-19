
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, Settings, BarChart3, Users, Clock, History, MapPin, LogOut, ShieldCheck, User as UserIcon, MapPinned, Cloud, CloudOff, Loader2, Info, ExternalLink, Database, Save, Trash2 } from 'lucide-react';
import { Session, LocationConfig } from './types';
import SessionCard from './components/SessionCard';
import AdminModal from './components/AdminModal';
import AnalyticsSection from './components/AnalyticsSection';
import SmartAdvisor from './components/SmartAdvisor';
import LoginPage from './components/LoginPage';
import LocationManager from './components/LocationManager';
import { mongodbService } from './services/mongodb';

const STORAGE_KEY = 'badminton_hub_sessions';
const LOCATIONS_KEY = 'badminton_hub_locations';
const AUTH_KEY = 'badminton_hub_auth_role';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locations, setLocations] = useState<LocationConfig[]>([
    { id: '1', name: 'SRC', defaultCourtFee: 20 },
    { id: '2', name: 'Perfect Win', defaultCourtFee: 30 }
  ]);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'analytics' | 'settings'>('sessions');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // MongoDB Config Form State
  const [mgConfig, setMgConfig] = useState({
    appId: '',
    dbName: 'badminton',
    dataSource: 'mongodb-atlas'
  });

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const savedRole = localStorage.getItem(AUTH_KEY) as 'admin' | 'user' | null;
    if (savedRole) setUserRole(savedRole);

    const savedSessions = localStorage.getItem(STORAGE_KEY);
    const savedLocations = localStorage.getItem(LOCATIONS_KEY);
    if (savedSessions) try { setSessions(JSON.parse(savedSessions)); } catch (e) {}
    if (savedLocations) try { setLocations(JSON.parse(savedLocations)); } catch (e) {}

    const savedMgConfig = localStorage.getItem('sbg_mongodb_config');
    if (savedMgConfig) {
      try { setMgConfig(JSON.parse(savedMgConfig)); } catch (e) {}
    }

    if (!mongodbService.isConfigured()) {
      setIsLoading(false);
      setIsOnline(false);
      return;
    }

    const unsubscribeSessions = mongodbService.subscribeSessions((data) => {
      setSessions(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setIsOnline(true);
      setIsLoading(false);
    });

    const unsubscribeLocations = mongodbService.subscribeLocations((data) => {
      if (data.length > 0) {
        setLocations(data);
        localStorage.setItem(LOCATIONS_KEY, JSON.stringify(data));
      }
    });

    return () => {
      unsubscribeSessions();
      unsubscribeLocations();
    };
  }, []);

  const handleLogin = (role: 'admin' | 'user') => {
    setUserRole(role);
    localStorage.setItem(AUTH_KEY, role);
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem(AUTH_KEY);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mgConfig.appId) {
      alert("请输入 Atlas App ID");
      return;
    }
    mongodbService.saveConfig(mgConfig);
  };

  const handleClearConfig = () => {
    if (window.confirm("确定要清除配置并切换回本地模式吗？")) {
      mongodbService.clearConfig();
    }
  };

  const updateSession = async (id: string, updated: Partial<Session>) => {
    if (mongodbService.isConfigured()) {
      try {
        setIsSyncing(true);
        await mongodbService.updateSession(id, updated);
      } catch (err) {
        console.error("MongoDB Update Error:", err);
      } finally {
        setIsSyncing(false);
      }
    } else {
      const updatedSessions = sessions.map(s => s.id === id ? { ...s, ...updated } : s);
      setSessions(updatedSessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    }
  };

  const addSession = async (sessionData: Omit<Session, 'id' | 'participants'>) => {
    const newSession: Session = {
      ...sessionData,
      id: crypto.randomUUID(),
      participants: [],
    };
    setIsModalOpen(false);
    if (mongodbService.isConfigured()) {
      try {
        setIsSyncing(true);
        await mongodbService.addSession(newSession);
      } catch (err) { console.error(err); } finally { setIsSyncing(false); }
    } else {
      const updated = [newSession, ...sessions];
      setSessions(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const deleteSession = async (id: string) => {
    if (isAdmin && window.confirm('确定要删除吗？')) {
      if (mongodbService.isConfigured()) {
        try {
          setIsSyncing(true);
          await mongodbService.deleteSession(id);
        } catch (err) { console.error(err); } finally { setIsSyncing(false); }
      } else {
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    }
  };

  const saveLocations = async (newLocs: LocationConfig[]) => {
    if (mongodbService.isConfigured()) {
      try {
        setIsSyncing(true);
        await mongodbService.saveLocations(newLocs);
      } catch (err) { console.error(err); } finally { setIsSyncing(false); }
    } else {
      setLocations(newLocs);
      localStorage.setItem(LOCATIONS_KEY, JSON.stringify(newLocs));
    }
  };

  const isSessionActive = (session: Session) => {
    try {
      const parts = session.time.split(' - ');
      const sessionEnd = new Date(`${session.date}T${parts[1]}:00`);
      return new Date() < new Date(sessionEnd.getTime() + 2 * 60 * 60 * 1000);
    } catch (e) { return true; }
  };

  const { activeSessions } = useMemo(() => ({
    activeSessions: [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).filter(isSessionActive)
  }), [sessions]);

  const frequentParticipants = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach(s => s.participants.forEach(p => names.add(p)));
    return Array.from(names).sort();
  }, [sessions]);

  if (!userRole) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="pb-5">
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm mb-4">
        <div className="container">
          <div className="navbar-brand d-flex align-items-center gap-2">
            <div className="bg-success p-2 rounded-3 text-white">
              <Calendar size={20} />
            </div>
            <span className="fw-black h5 mb-0">SBG Badminton</span>
            
            <button 
              className={`ms-2 btn btn-sm rounded-pill border-0 d-flex align-items-center gap-1 ${isOnline ? 'text-primary bg-primary bg-opacity-10' : 'text-danger bg-danger bg-opacity-10'}`}
              onClick={() => setShowConfigGuide(!showConfigGuide)}
            >
              {isSyncing ? <Loader2 size={12} className="animate-spin" /> : isOnline ? <Cloud size={14} /> : <CloudOff size={14} />}
              <span style={{ fontSize: '0.7rem' }} className="fw-black">{isOnline ? 'MongoDB 已连接' : '本地模式 (点击配置)'}</span>
            </button>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <div className="badge rounded-pill bg-light text-secondary border px-3 py-2 d-flex align-items-center gap-1">
              {isAdmin ? <ShieldCheck size={14} className="text-success" /> : <UserIcon size={14} className="text-primary" />}
              <small className="fw-bold">{isAdmin ? '管理员' : '成员'}</small>
            </div>
            {isAdmin && (
              <button onClick={() => setIsModalOpen(true)} className="btn btn-success btn-sm rounded-pill px-3 fw-bold shadow-sm">
                <Plus size={16} /> 创建
              </button>
            )}
            <button onClick={handleLogout} className="btn btn-link text-secondary p-2 rounded-circle hover-danger">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-2">
        {showConfigGuide && (
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden mb-4 animate-in slide-in-from-top duration-300">
            <div className="card-header bg-dark text-white p-4 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <Database size={20} className="text-success" />
                <h6 className="fw-black mb-0 text-uppercase tracking-wider">MongoDB Atlas 连接中心</h6>
              </div>
              <button className="btn-close btn-close-white" onClick={() => setShowConfigGuide(false)}></button>
            </div>
            <div className="card-body p-4 bg-white">
              <form onSubmit={handleSaveConfig}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <p className="small text-muted mb-3 fw-bold">请从 Atlas App Services 复制 App ID：</p>
                    <div className="vstack gap-2">
                      <div>
                        <label className="x-small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>App ID</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          placeholder="application-0-xxxx" 
                          value={mgConfig.appId}
                          onChange={e => setMgConfig({...mgConfig, appId: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="x-small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>数据库名称</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          value={mgConfig.dbName}
                          onChange={e => setMgConfig({...mgConfig, dbName: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 border-start border-light ps-md-4">
                    <p className="small text-muted mb-3 fw-bold">集群设置：</p>
                    <div>
                      <label className="x-small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Data Source (服务名)</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={mgConfig.dataSource}
                        onChange={e => setMgConfig({...mgConfig, dataSource: e.target.value})}
                      />
                    </div>
                    
                    <div className="mt-4 d-flex gap-2">
                      <button type="submit" className="btn btn-success btn-sm flex-grow-1 fw-black d-flex align-items-center justify-content-center gap-2">
                        <Save size={14} /> 保存并连接
                      </button>
                      <button type="button" onClick={handleClearConfig} className="btn btn-outline-danger btn-sm fw-black">
                        <Trash2 size={14} /> 切换本地
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mb-5">
          <ul className="nav nav-pills bg-white p-1 rounded-4 shadow-sm d-inline-flex border">
            {['sessions', 'analytics', 'settings'].map(tab => (
              (tab !== 'settings' || isAdmin) && (
                <li key={tab} className="nav-item">
                  <button 
                    onClick={() => setActiveTab(tab as any)} 
                    className={`nav-link rounded-3 px-4 fw-bold text-capitalize ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab === 'sessions' ? '场次预定' : tab === 'analytics' ? '数据统计' : '场地管理'}
                  </button>
                </li>
              )
            ))}
          </ul>
        </div>

        {activeTab === 'sessions' && (
          <div className="row g-4">
            <div className="col-lg-8">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <Clock size={20} className="text-success" />
                活跃场次 ({activeSessions.length})
              </h5>
              {isLoading ? (
                <div className="text-center py-5"><Loader2 size={32} className="animate-spin text-success opacity-25" /></div>
              ) : activeSessions.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-4 border border-dashed text-muted">目前暂无活动</div>
              ) : (
                <div className="vstack gap-4">
                  {activeSessions.map(s => (
                    <SessionCard 
                      key={s.id} 
                      session={s} 
                      isAdmin={isAdmin} 
                      frequentParticipants={frequentParticipants} 
                      onUpdate={(u) => updateSession(s.id, u)} 
                      onDelete={() => deleteSession(s.id)} 
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="col-lg-4">
              <SmartAdvisor sessions={sessions} />
              <div className="card border-0 shadow-soft rounded-4 p-4 mt-4 bg-white">
                <h6 className="fw-black mb-3 small text-uppercase text-muted tracking-widest">场地参考</h6>
                <div className="vstack gap-2">
                  {locations.map(loc => (
                    <div key={loc.id} className="d-flex justify-content-between p-2 border-bottom">
                      <span className="small fw-bold">{loc.name}</span>
                      <span className="small fw-black text-success">RM {loc.defaultCourtFee}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsSection sessions={sessions} />}
        {activeTab === 'settings' && isAdmin && <LocationManager locations={locations} onUpdateLocations={saveLocations} />}
      </main>

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={addSession} locations={locations} />
      
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .family-monospace { font-family: monospace; }
        .animate-in { animation: enter 0.3s ease-out; }
        @keyframes enter { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .x-small { font-size: 0.65rem; }
      `}</style>
    </div>
  );
};

export default App;
