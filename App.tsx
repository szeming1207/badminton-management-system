
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
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  React.useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    const savedLocations = localStorage.getItem(LOCATIONS_KEY);
    if (savedSessions) try { setSessions(JSON.parse(savedSessions)); } catch (e) {}
    if (savedLocations) try { setLocations(JSON.parse(savedLocations)); } catch (e) {}

    let unsubSessions: () => void = () => {};
    let unsubLocations: () => void = () => {};

    const startSubscriptions = () => {
      if (!firebaseService.isConfigured()) {
        setIsLoading(false);
        setIsOnline(false);
        return;
      }

      unsubSessions = firebaseService.subscribeSessions((data) => {
        setSessions(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setIsOnline(true);
        setIsLoading(false);
        setSyncError(null);
      }, (err) => {
        setSyncError("Secure connection lost.");
        setIsOnline(false);
        setIsLoading(false);
      });

      unsubLocations = firebaseService.subscribeLocations((data) => {
        if (data.length > 0) {
          setLocations(data);
          localStorage.setItem(LOCATIONS_KEY, JSON.stringify(data));
        }
      });
    };

    const timer = setTimeout(startSubscriptions, 100);

    return () => {
      clearTimeout(timer);
      unsubSessions();
      unsubLocations();
    };
  }, []);

  const handleLogin = (role: 'admin' | 'user') => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
  };

  const updateSession = async (id: string, updated: Partial<Session>) => {
    if (firebaseService.isConfigured() && isOnline) {
      try {
        setIsSyncing(true);
        await firebaseService.updateSession(id, updated);
      } catch (err) {
        console.error("Update restricted.");
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
      deletionRequests: [],
      maxParticipants: sessionData.maxParticipants || 8,
    };
    setIsModalOpen(false);
    if (firebaseService.isConfigured() && isOnline) {
      try {
        setIsSyncing(true);
        await firebaseService.addSession(newSession);
      } catch (err) { console.error("Write restricted."); } finally { setIsSyncing(false); }
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
        } catch (err) { console.error("Delete restricted."); } finally { setIsSyncing(false); }
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
      } catch (err) { console.error("Update restricted."); } finally { setIsSyncing(false); }
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
            
            <div className={`ms-2 px-2 py-1 rounded-pill d-flex align-items-center gap-1 ${isOnline ? 'text-primary bg-primary bg-opacity-10' : 'text-danger bg-danger bg-opacity-10'}`}>
              {isSyncing ? <Loader2 size={12} className="animate-spin" /> : isOnline ? <Cloud size={14} /> : <CloudOff size={14} />}
              <span style={{ fontSize: '0.7rem' }} className="fw-black text-uppercase">
                {isOnline ? 'Encrypted Sync' : 'Offline Mode'}
              </span>
            </div>
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
        {syncError && (
          <div className="alert alert-warning rounded-4 shadow-sm mb-4 d-flex align-items-center gap-2">
            <AlertCircle size={18} />
            <small className="fw-bold">{syncError}</small>
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
              {isLoading && !sessions.length ? (
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
