
// Fix: Use namespace imports for app and auth to resolve 'no exported member' errors in certain environments
import * as firebaseApp from "firebase/app";
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
import * as firebaseAuth from "firebase/auth";

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

// Initialize Firebase using the namespace-safe access patterns for modular SDK
if (config && config.apiKey && config.projectId) {
  try {
    const app = !firebaseApp.getApps().length ? firebaseApp.initializeApp(config) : firebaseApp.getApp();
    db = getFirestore(app);
    auth = firebaseAuth.getAuth(app);
    
    // Asynchronously attempt to enable network
    enableNetwork(db).catch(() => {});
    
    // Execute anonymous login via the auth namespace
    if (auth) {
      firebaseAuth.signInAnonymously(auth).catch((err: any) => {
        lastError = `登录失败: 请在 Firebase 控制台开启 Anonymous 登录。(${err.code})`;
        console.error(lastError);
      });
    }
  } catch (e: any) {
    lastError = `初始化失败: 请检查 API Key 是否正确。(${e.message})`;
    console.error(lastError);
  }
}

export const firebaseService = {
  isConfigured: () => !!db,
  getLastError: () => lastError,

  saveConfig: (newConfig: any) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
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
          msg = "权限不足：请在 Firebase 控制台将 Firestore 规则设置为测试模式，并开启匿名登录。";
        } else if (error.code === 'not-found') {
          msg = "数据库未就绪：请确保已在控制台点击了 'Create Database'。";
        } else {
          msg = `Firestore 错误: ${error.message}`;
        }
        console.error(msg);
        if (onError) onError(msg);
      });
    } catch (e: any) {
      console.error("Subscription Error:", e);
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
