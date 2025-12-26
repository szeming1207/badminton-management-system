
import React from 'react';
import { Plus, Calendar, Settings, BarChart3, Users, Clock, History, MapPin, LogOut, ShieldCheck, User as UserIcon, MapPinned, Cloud, CloudOff, Loader2, Info, ExternalLink, Database, Save, Trash2, Flame, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
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
const USER_ROLE_KEY = 'sbg_user_role_persistent'; // 成员持久化
const ADMIN_ROLE_KEY = 'sbg_admin_role_session'; // 管理员会话化

const App: React.FC = () => {
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [locations, setLocations] = React.useState<LocationConfig[]>([
    { id: '1', name: 'SRC', defaultCourtFee: 20 },
    { id: '2', name: 'Perfect Win', defaultCourtFee: 30 }
  ]);
  
  // 智能身份初始化
  const [userRole, setUserRole] = React.useState<'admin' | 'user' | null>(() => {
    // 1. 优先检查会话中的管理员身份
    const sessionAdmin = sessionStorage.getItem(ADMIN_ROLE_KEY);
    if (sessionAdmin === 'admin') return 'admin';
    
    // 2. 其次检查持久化的成员身份
    const persistentUser = localStorage.getItem(USER_ROLE_KEY);
    if (persistentUser === 'user') return 'user';
    
    return null;
  });
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'sessions' | 'analytics' | 'settings'>('sessions');
  const [showHistory, setShowHistory] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOnline, setIsOnline] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  // 核心连接逻辑：增强稳定性
  const connectCloud = React.useCallback(async () => {
    if (!firebaseService.isConfigured()) {
      setIsLoading(false);
      setIsOnline(false);
      setSyncError("Cloud Config Missing");
      return;
    }

    setIsLoading(true);
    setSyncError(null);

    try {
      // 确保 Auth 匿名登录成功
      await firebaseService.waitUntilReady();
      
      const unsubSessions = firebaseService.subscribeSessions((data) => {
        setSessions(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setIsOnline(true);
        setIsLoading(false); // 只有收到数据后才取消 Loading
        setSyncError(null);
      }, (err) => {
        console.warn("Sync slow or failed:", err);
        // 如果已经有缓存数据，不强制显示错误
        if (sessions.length === 0) {
          setSyncError("连接不稳定，请重试");
        }
        setIsOnline(false);
        setIsLoading(false);
      });

      const unsubLocations = firebaseService.subscribeLocations((data) => {
        if (data.length > 0) {
          setLocations(data);
          localStorage.setItem(LOCATIONS_KEY, JSON.stringify(data));
        }
      });

      return () => {
        unsubSessions();
        unsubLocations();
      };
    } catch (e) {
      console.error("Connection process failed:", e);
      setIsLoading(false);
      setIsOnline(false);
    }
  }, [sessions.length]);

  React.useEffect(() => {
    // 加载缓存数据，确保首屏速度
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    const savedLocations = localStorage.getItem(LOCATIONS_KEY);
    if (savedSessions) try { setSessions(JSON.parse(savedSessions)); } catch (e) {}
    if (savedLocations) try { setLocations(JSON.parse(savedLocations)); } catch (e) {}

    connectCloud();
  }, [connectCloud]);

  const handleLogin = (role: 'admin' | 'user') => {
    setUserRole(role);
    if (role === 'admin') {
      // 管理员身份存入 sessionStorage (关闭浏览器即消失)
      sessionStorage.setItem(ADMIN_ROLE_KEY, 'admin');
      localStorage.removeItem(USER_ROLE_KEY); // 清除普通身份
    } else {
      // 成员身份存入 localStorage (持久保持)
      localStorage.setItem(USER_ROLE_KEY, 'user');
      sessionStorage.removeItem(ADMIN_ROLE_KEY); // 清除管理身份
    }
  };

  const handleLogout = () => {
    if (window.confirm("确定要退出吗？")) {
      setUserRole(null);
      localStorage.removeItem(USER_ROLE_KEY);
      sessionStorage.removeItem(ADMIN_ROLE_KEY);
    }
  };

  const updateSession = async (id: string, updated: Partial<Session>) => {
    if (firebaseService.isConfigured() && isOnline) {
      try {
        setIsSyncing(true);
        await firebaseService.updateSession(id, updated);
      } catch (err) {
        console.error("Cloud update error");
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
      waitingList: [],
      deletionRequests: [],
      maxParticipants: sessionData.maxParticipants || 8,
      status: 'active'
    };
    setIsModalOpen(false);
    if (firebaseService.isConfigured() && isOnline) {
      try {
        setIsSyncing(true);
        await firebaseService.addSession(newSession);
      } catch (err) { console.error("Write error"); } finally { setIsSyncing(false); }
    } else {
      const updated = [newSession, ...sessions];
      setSessions(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const deleteSession = async (id: string) => {
    if (isAdmin && window.confirm('确定要彻底删除这场活动吗？')) {
      if (firebaseService.isConfigured() && isOnline) {
        try {
          setIsSyncing(true);
          await firebaseService.deleteSession(id);
        } catch (err) { console.error("Delete failed"); } finally { setIsSyncing(false); }
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
      } catch (err) { console.error("Update failed"); } finally { setIsSyncing(false); }
    } else {
      setLocations(newLocs);
      localStorage.setItem(LOCATIONS_KEY, JSON.stringify(newLocs));
    }
  };

  const isSessionActive = (session: Session) => {
    if (session.status === 'completed') return false;
    try {
      const parts = session.time.split(' - ');
      const sessionEnd = new Date(`${session.date}T${parts[1]}:00`);
      return new Date() < new Date(sessionEnd.getTime() + 4 * 60 * 60 * 1000);
    } catch (e) { return true; }
  };

  const filteredSessions = React.useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (showHistory) {
      return sorted.filter(s => s.status === 'completed' || !isSessionActive(s));
    }
    return sorted.filter(s => s.status === 'active' && isSessionActive(s));
  }, [sessions, showHistory]);

  const frequentParticipants = React.useMemo(() => {
    const names = new Set<string>();
    sessions.forEach(s => {
      s.participants?.forEach(p => names.add(p));
      s.waitingList?.forEach(p => names.add(p));
    });
    return Array.from(names).sort();
  }, [sessions]);

  // 全屏加载动画
  if (isLoading && !sessions.length) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <div className="bg-white p-5 rounded-4xl shadow-soft text-center animate-in zoom-in">
          <Loader2 size={48} className="text-success animate-spin mb-4" />
          <h5 className="fw-black mb-1">正在连接云端...</h5>
          <p className="text-muted small mb-0">同步 SBG 羽毛球实时数据</p>
        </div>
      </div>
    );
  }

  if (!userRole) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="pb-5">
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm mb-4">
        <div className="container">
          <div className="navbar-brand d-flex align-items-center gap-2">
            <div className="bg-success p-2 rounded-3 text-white shadow-sm">
              <Calendar size={20} />
            </div>
            <span className="fw-black h5 mb-0">SBG Badminton</span>
            
            <div className={`ms-2 px-2 py-1 rounded-pill d-flex align-items-center gap-1 transition-all ${isOnline ? 'text-primary bg-primary bg-opacity-10' : 'text-danger bg-danger bg-opacity-10'}`}>
              {isSyncing ? <Loader2 size={12} className="animate-spin" /> : isOnline ? <Cloud size={14} /> : <CloudOff size={14} />}
              <span style={{ fontSize: '0.7rem' }} className="fw-black text-uppercase">
                {isOnline ? 'Cloud Active' : isSyncing ? 'Linking...' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <div className={`badge rounded-pill border px-3 py-2 d-flex align-items-center gap-1 ${isAdmin ? 'bg-success bg-opacity-10 text-success border-success' : 'bg-light text-secondary'}`}>
              {isAdmin ? <ShieldCheck size={14} /> : <UserIcon size={14} />}
              <small className="fw-bold">{isAdmin ? '管理员模式' : '成员身份'}</small>
            </div>
            {isAdmin && (
              <button onClick={() => setIsModalOpen(true)} className="btn btn-success btn-sm rounded-pill px-3 fw-bold shadow-sm">
                <Plus size={16} /> 创建活动
              </button>
            )}
            <button onClick={handleLogout} className="btn btn-link text-secondary p-2 rounded-circle hover-danger transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-2">
        {syncError && (
          <div className="alert alert-warning rounded-4 shadow-sm mb-4 d-flex justify-content-between align-items-center border-0 bg-warning bg-opacity-10">
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} className="text-warning" />
              <small className="fw-bold text-dark">{syncError}</small>
            </div>
            <button onClick={connectCloud} className="btn btn-sm btn-warning rounded-pill px-3 fw-black py-1">
              <RefreshCw size={12} className="me-1" /> 点击重试
            </button>
          </div>
        )}

        <div className="mb-5 d-flex flex-wrap justify-content-between align-items-end gap-3">
          <ul className="nav nav-pills bg-white p-1 rounded-4 shadow-sm d-inline-flex border">
            {['sessions', 'analytics', 'settings'].map(tab => (
              (tab !== 'settings' || isAdmin) && (
                <li key={tab} className="nav-item">
                  <button onClick={() => setActiveTab(tab as any)} className={`nav-link rounded-3 px-4 fw-bold text-capitalize ${activeTab === tab ? 'active shadow' : ''}`}>
                    {tab === 'sessions' ? '场次预定' : tab === 'analytics' ? '数据统计' : '场地管理'}
                  </button>
                </li>
              )
            ))}
          </ul>

          {activeTab === 'sessions' && (
            <div className="form-check form-switch p-2 px-4 bg-white rounded-pill border shadow-sm transition-all">
              <input className="form-check-input" type="checkbox" id="historySwitch" checked={showHistory} onChange={e => setShowHistory(e.target.checked)} />
              <label className="form-check-label small fw-black text-muted ms-2 cursor-pointer" htmlFor="historySwitch">
                {showHistory ? '查看活跃球局' : '查看历史记录'}
              </label>
            </div>
          )}
        </div>

        {activeTab === 'sessions' && (
          <div className="row g-4">
            <div className="col-lg-8">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                {showHistory ? <History size={20} className="text-secondary" /> : <Clock size={20} className="text-success" />}
                {showHistory ? '历史记录' : '活跃场次'} ({filteredSessions.length})
              </h5>
              
              {filteredSessions.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-4 border border-dashed text-muted shadow-sm">
                  {showHistory ? '暂无历史活动记录' : '目前暂无活跃活动'}
                </div>
              ) : (
                <div className="vstack gap-4">
                  {filteredSessions.map(s => (
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
      
      <style>{`
        .cursor-pointer { cursor: pointer; }
        .hover-danger:hover { color: #ef4444 !important; background: #fee2e2; }
        .rounded-4xl { border-radius: 2rem !important; }
      `}</style>
    </div>
  );
};

export default App;
