
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  enableNetwork
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const CONFIG_KEY = 'sbg_firebase_config';

const getConfiguration = () => {
  const savedConfig = localStorage.getItem(CONFIG_KEY);
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch (e) {
      console.error("Failed to parse saved Firebase config");
    }
  }
  return null;
};

const config = getConfiguration();
let db: any = null;
let auth: any = null;
let lastError: string | null = null;

if (config && config.apiKey && config.projectId) {
  try {
    // 自动清洗配置中的多余空格
    const cleanConfig = {
      apiKey: config.apiKey.trim(),
      authDomain: (config.authDomain || '').trim(),
      projectId: config.projectId.trim(),
      storageBucket: (config.storageBucket || '').trim(),
      messagingSenderId: (config.messagingSenderId || '').trim(),
      appId: (config.appId || '').trim()
    };

    const app = !getApps().length ? initializeApp(cleanConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    
    enableNetwork(db).catch(() => {});
    
    if (auth) {
      signInAnonymously(auth).catch((err: any) => {
        lastError = `身份认证失败: ${err.message} (请检查 Firebase 控制台是否开启了 Anonymous 登录)`;
        console.error(lastError);
      });
    }
  } catch (e: any) {
    if (e.message.includes('firestore is not available')) {
      lastError = `数据库未激活: 请前往 Firebase 控制台点击 "Create Database" 开启 Firestore 服务。`;
    } else {
      lastError = `Firebase 初始化错误: ${e.message}`;
    }
    console.error("Firebase Init Error:", e);
  }
}

export const firebaseService = {
  isConfigured: () => !!db,
  getLastError: () => lastError,

  saveConfig: (newConfig: any) => {
    // 保存前先去空格
    const trimmedConfig = Object.keys(newConfig).reduce((acc: any, key) => {
      acc[key] = typeof newConfig[key] === 'string' ? newConfig[key].trim() : newConfig[key];
      return acc;
    }, {});
    localStorage.setItem(CONFIG_KEY, JSON.stringify(trimmedConfig));
    window.location.reload();
  },

  clearConfig: () => {
    localStorage.removeItem(CONFIG_KEY);
    window.location.reload();
  },

  subscribeSessions: (callback: (data: any[]) => void, onError?: (err: string) => void) => {
    if (!db) return () => {};
    
    try {
      const q = query(collection(db, "sessions"), orderBy("date", "desc"));
      return onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        callback(sessions);
      }, (error) => {
        let msg = "";
        if (error.code === 'permission-denied') {
          msg = "权限不足：请在 Firebase 控制台将 Firestore 规则设置为测试模式。";
        } else if (error.message.includes('firestore is not available')) {
          msg = "Firestore 服务不可用：请确保已在控制台点击了 'Create Database'。";
        } else {
          msg = `数据库连接错误: ${error.message}`;
        }
        if (onError) onError(msg);
      });
    } catch (e: any) {
      if (onError) onError(e.message);
      return () => {};
    }
  },

  subscribeLocations: (callback: (data: any[]) => void) => {
    if (!db) return () => {};
    try {
      return onSnapshot(collection(db, "locations"), (snapshot) => {
        const locations = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        callback(locations);
      }, (err) => {
        console.warn("Locations sync error:", err.message);
      });
    } catch (e) {
      return () => {};
    }
  },

  addSession: async (session: any) => {
    if (!db) return;
    const { id, ...data } = session;
    await setDoc(doc(db, "sessions", id), data);
  },

  updateSession: async (id: string, data: any) => {
    if (!db) return;
    const sessionRef = doc(db, "sessions", id);
    await updateDoc(sessionRef, data);
  },

  deleteSession: async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "sessions", id));
  },

  saveLocations: async (locations: any[]) => {
    if (!db) return;
    for (const loc of locations) {
      const { id, ...data } = loc;
      await setDoc(doc(db, "locations", id), data);
    }
  }
};
