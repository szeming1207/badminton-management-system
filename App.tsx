
import React from 'react';
import { Plus, Calendar, Settings, BarChart3, Users, Clock, History, MapPin, LogOut, ShieldCheck, User as UserIcon, MapPinned, Cloud, CloudOff, Loader2, Info, ExternalLink, Database, Save, Trash2, Flame, AlertCircle } from 'lucide-react';
import { Session, LocationConfig } from './types';
import SessionCard from './components/SessionCard';
import AdminModal from './components/AdminModal';
import AnalyticsSection from './components/AnalyticsSection';
import SmartAdvisor from './components/SmartAdvisor';
import LoginPage from './components/LoginPage';
import LocationManager from './components/LocationManager';
import { firebaseService } from './services/firebase';

const STORAGE_KEY = 'badminton_hub_sessions';
const LOCATIONS_KEY = 'badminton_hub_locations';
const AUTH_KEY = 'badminton_hub_auth_role';

const App: React.FC = () => {
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [locations, setLocations] = React.useState<LocationConfig[]>([
    { id: '1', name: 'SRC', defaultCourtFee: 20 },
    { id: '2', name: 'Perfect Win', defaultCourtFee: 30 }
  ]);
  const [userRole, setUserRole] = React.useState<'admin' | 'user' | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'sessions' | 'analytics' | 'settings'>('sessions');
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOnline, setIsOnline] = React.useState(false);
  const [showConfigGuide, setShowConfigGuide] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const [fbConfig, setFbConfig] = React.useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  const isAdmin = userRole === 'admin';

  React.useEffect(() => {
    const savedRole = localStorage.getItem(AUTH_KEY) as 'admin' | 'user' | null;
    if (savedRole) setUserRole(savedRole);

    const savedSessions = localStorage.getItem(STORAGE_KEY);
    const savedLocations = localStorage.getItem(LOCATIONS_KEY);
    if (savedSessions) try { setSessions(JSON.parse(savedSessions)); } catch (e) {}
    if (savedLocations) try { setLocations(JSON.parse(savedLocations)); } catch (e) {}

    const savedFbConfig = localStorage.getItem('sbg_firebase_config');
    if (savedFbConfig) {
      try { setFbConfig(JSON.parse(savedFbConfig)); } catch (e) {}
    }

    if (!firebaseService.isConfigured()) {
      setIsLoading(false);
      setIsOnline(false);
      return;
    }

    const initError = firebaseService.getLastError();
    if (initError) setSyncError(initError);

    const unsubscribeSessions = firebaseService.subscribeSessions((data) => {
      setSessions(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setIsOnline(true);
      setIsLoading(false);
      setSyncError(null);
    }, (err) => {
      setSyncError(err);
      setIsOnline(false);
      setIsLoading(false);
    });

    const unsubscribeLocations = firebaseService.subscribeLocations((data) => {
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
    if (!fbConfig.apiKey || !fbConfig.projectId) {
      alert("请输入至少 API Key 和 Project ID");
      return;
    }
    firebaseService.saveConfig(fbConfig);
  };

  const handleClearConfig = () => {
    if (window.confirm("确定要清除 Firebase 配置并切换回本地模式吗？")) {
      firebaseService.clearConfig();
    }
  };

  const updateSession = async (id: string, updated: Partial<Session>) => {
    if (firebaseService.isConfigured() && isOnline) {
      try {
        setIsSyncing(true);
        await firebaseService.updateSession(id, updated);
      } catch (err) {
        console.error("Firebase Update Error:", err);
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
    if (firebaseService.isConfigured() && isOnline) {
      try {
        setIsSyncing(true);
        await firebaseService.addSession(newSession);
      } catch (err) { console.error(err); } finally { setIsSyncing(false); }
    } else {
      const updated = [newSession, ...sessions];
      setSessions(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const deleteSession = async (id: string) => {
    if (isAdmin && window.confirm('确定要删除吗？')) {
      if (firebaseService.isConfigured() && isOnline) {
        try {
          setIsSyncing(true);
          await firebaseService.deleteSession(id);
        } catch (err) { console.error(err); } finally { setIsSyncing(false); }
      } else {
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    }
  };

  const saveLocations = async (newLocs: LocationConfig[]) => {
    if (firebaseService.isConfigured() && isOnline) {
      try {
        setIsSyncing(true);
        await firebaseService.saveLocations(newLocs);
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

  const activeSessions = React.useMemo(() => (
    [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(isSessionActive)
  ), [sessions]);

  const frequentParticipants = React.useMemo(() => {
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
              <span style={{ fontSize: '0.7rem' }} className="fw-black">
                {syncError ? '同步错误' : isOnline ? 'Firebase 已同步' : '本地模式'}
              </span>
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
                <Flame size={20} className="text-warning" />
                <h6 className="fw-black mb-0 text-uppercase tracking-wider">Firebase 连接中心</h6>
              </div>
              <button className="btn-close btn-close-white" onClick={() => setShowConfigGuide(false)}></button>
            </div>
            <div className="card-body p-4 bg-white">
              {syncError && (
                <div className="alert alert-danger border-0 rounded-3 d-flex align-items-start gap-3 p-3 mb-4">
                  <AlertCircle size={20} className="mt-1 flex-shrink-0" />
                  <div className="small">
                    <p className="fw-black mb-1">连接中断</p>
                    <p className="mb-0 opacity-75">{syncError}</p>
                    <div className="mt-2 pt-2 border-top border-danger border-opacity-10">
                      请前往 Firebase 控制台确认：<br/>
                      1. <b>Build > Authentication</b> 已开启 <b>Anonymous</b> 登录方式。<br/>
                      2. <b>Build > Firestore Database</b> 已点击 <b>Create Database</b>。<br/>
                      3. <b>Rules</b> 允许匿名读写。
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleSaveConfig}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="vstack gap-2">
                      <div>
                        <label className="x-small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Firebase API Key</label>
                        <input type="text" className="form-control form-control-sm" placeholder="AIzaSy..." value={fbConfig.apiKey} onChange={e => setFbConfig({...fbConfig, apiKey: e.target.value})} />
                      </div>
                      <div>
                        <label className="x-small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Project ID</label>
                        <input type="text" className="form-control form-control-sm" placeholder="my-project-id" value={fbConfig.projectId} onChange={e => setFbConfig({...fbConfig, projectId: e.target.value})} />
                      </div>
                      <div>
                        <label className="x-small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Auth Domain</label>
                        <input type="text" className="form-control form-control-sm" placeholder="project.firebaseapp.com" value={fbConfig.authDomain} onChange={e => setFbConfig({...fbConfig, authDomain: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 border-start border-light ps-md-4">
                    <p className="small text-muted mb-3 fw-bold">额外参数 (可选)：</p>
                    <div className="vstack gap-2">
                      <input type="text" className="form-control form-control-sm" placeholder="App ID" value={fbConfig.appId} onChange={e => setFbConfig({...fbConfig, appId: e.target.value})} />
                      <input type="text" className="form-control form-control-sm" placeholder="Storage Bucket" value={fbConfig.storageBucket} onChange={e => setFbConfig({...fbConfig, storageBucket: e.target.value})} />
                    </div>
                    <div className="mt-4 d-flex gap-2">
                      <button type="submit" className="btn btn-success btn-sm flex-grow-1 fw-black d-flex align-items-center justify-content-center gap-2">
                        <Save size={14} /> 保存配置
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
                  <button onClick={() => setActiveTab(tab as any)} className={`nav-link rounded-3 px-4 fw-bold text-capitalize ${activeTab === tab ? 'active' : ''}`}>
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
                    <SessionCard key={s.id} session={s} isAdmin={isAdmin} locations={locations} frequentParticipants={frequentParticipants} onUpdate={(u) => updateSession(s.id, u)} onDelete={() => deleteSession(s.id)} />
                  ))}
                </div>
              )}
            </div>
            <div className="col-lg-4">
              <SmartAdvisor sessions={sessions} />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsSection sessions={sessions} />}
        {activeTab === 'settings' && isAdmin && <LocationManager locations={locations} onUpdateLocations={saveLocations} />}
      </main>

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={addSession} locations={locations} />
    </div>
  );
};

export default App;
