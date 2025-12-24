
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
 * 【安全配置区域】
 * 优先从环境变量读取，如果环境变量不存在，请在下方手动填写你的 Firebase 配置。
 * 建议在生产环境中使用 CI/CD 注入环境变量。
 */
const SECURE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.API_KEY || "YOUR_FIREBASE_API_KEY", // 填入你的 API Key
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID", // 填入你的 Project ID
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID"
};

const getConfiguration = () => {
  // 检查关键参数是否已替换（不是占位符且不为空）
  const isConfigured = 
    SECURE_CONFIG.apiKey && 
    SECURE_CONFIG.apiKey !== "YOUR_FIREBASE_API_KEY" &&
    SECURE_CONFIG.projectId && 
    SECURE_CONFIG.projectId !== "YOUR_PROJECT_ID";

  if (!isConfigured) {
    console.warn("Firebase 尚未配置。请在 services/firebase.ts 中填入你的 Firebase 密钥。");
    return null;
  }
  return SECURE_CONFIG;
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
    
    // 强制尝试在线连接
    enableNetwork(db).catch(() => {});
    
    if (auth) {
      signInAnonymously(auth).catch((err: any) => {
        lastError = `Security Auth Error: ${err.code}`;
      });
    }
  } catch (e: any) {
    lastError = "Connection initialization failed.";
    console.error("Firebase Init Error:", e);
  }
}

export const firebaseService = {
  isConfigured: () => !!db,
  getLastError: () => lastError,

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
        console.error("Snapshot error:", error);
        if (onError) onError("Permission denied or connection lost.");
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
