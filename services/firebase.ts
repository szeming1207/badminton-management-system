
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

/**
 * 【关键步骤】
 * 请将你在网页表单中填写的 Firebase 配置粘贴到下面的 GLOBAL_CONFIG 中。
 * 这样部署后，所有人打开网页都会自动连接，无需再次输入。
 */
const GLOBAL_CONFIG = {
  apiKey: "AIzaSyDpjLq0-sP7U-YpgfFvZRpjpvq3TNj1Fdc", // 粘贴你的 apiKey
  authDomain: "badminton-b513e.firebaseapp.com", // 粘贴你的 authDomain
  projectId: "badminton-b513e", // 粘贴你的 projectId
  storageBucket: "badminton-b513e.firebasestorage.app", // 粘贴你的 storageBucket
  messagingSenderId: "504434789296", // 粘贴你的 messagingSenderId
  appId: "1:504434789296:web:e1510b72b16af858bc6475" // 粘贴你的 appId
};

const getConfiguration = () => {
  // 优先使用硬编码的全局配置
  if (GLOBAL_CONFIG.apiKey && GLOBAL_CONFIG.projectId) {
    return GLOBAL_CONFIG;
  }
  
  // 备选：从 LocalStorage 读取（用于开发调试）
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
        lastError = `身份认证失败: ${err.message}`;
        console.error(lastError);
      });
    }
  } catch (e: any) {
    lastError = `Firebase 初始化错误: ${e.message}`;
    console.error("Firebase Init Error:", e);
  }
}

export const firebaseService = {
  isConfigured: () => !!db,
  isGlobal: () => !!(GLOBAL_CONFIG.apiKey && GLOBAL_CONFIG.projectId),
  getLastError: () => lastError,

  saveConfig: (newConfig: any) => {
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
        if (onError) onError(error.message);
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
