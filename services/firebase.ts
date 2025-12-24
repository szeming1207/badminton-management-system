
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

/**
 * 安全最佳实践：
 * 所有敏感信息均通过环境变量 process.env 获取。
 * 在生产环境中，这些变量由构建系统或服务器注入，不会直接暴露在源码库中。
 */
const getConfiguration = () => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || process.env.API_KEY, // 兼容通用 API_KEY 变量
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };

  if (!config.apiKey || !config.projectId) {
    console.warn("Firebase configuration is missing. Running in limited local mode.");
    return null;
  }
  return config;
};

const config = getConfiguration();
let db: any = null;
let auth: any = null;
let lastError: string | null = null;

if (config) {
  try {
    const app = !getApps().length ? initializeApp(config) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    
    enableNetwork(db).catch(() => {});
    
    if (auth) {
      // 匿名登录以获取合法的 Auth 令牌，这配合 Firestore Security Rules 可以极大增加攻击成本
      signInAnonymously(auth).catch((err: any) => {
        lastError = `Security Auth Error: ${err.code}`;
      });
    }
  } catch (e: any) {
    lastError = "Connection initialization failed.";
    console.error("Firebase Init Error");
  }
}

export const firebaseService = {
  isConfigured: () => !!db,
  getLastError: () => lastError,

  // 移除了 saveConfig 和 clearConfig 以防止未经授权的操作

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
        if (onError) onError("Permission denied or link lost.");
      });
    } catch (e: any) {
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
