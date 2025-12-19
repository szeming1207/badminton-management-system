
// Fix: Separate value and type imports for initializeApp and FirebaseApp
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  Firestore
} from 'firebase/firestore';

// 定义配置键名
const CONFIG_KEY = 'sbg_firebase_config';

// 尝试从 localStorage 获取配置，如果没有则使用环境变量
const getConfiguration = () => {
  const savedConfig = localStorage.getItem(CONFIG_KEY);
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch (e) {
      console.error("Failed to parse saved Firebase config");
    }
  }
  
  return {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || ''
  };
};

// Use the explicit FirebaseApp type from modular SDK
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

const config = getConfiguration();

if (config.projectId && config.apiKey) {
  try {
    // Correct modular initialization
    app = initializeApp(config);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

// Collection Names
const SESSIONS_COL = 'sessions';
const LOCATIONS_COL = 'locations';

export const firebaseService = {
  isConfigured: () => !!(app && db),

  // 保存配置到本地并刷新页面以生效
  saveConfig: (newConfig: any) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    window.location.reload();
  },

  // 清除配置
  clearConfig: () => {
    localStorage.removeItem(CONFIG_KEY);
    window.location.reload();
  },

  // Listen for real-time updates for sessions
  subscribeSessions: (callback: (data: any[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, SESSIONS_COL), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data() as any, id: doc.id }));
      callback(docs);
    });
  },

  // Listen for real-time updates for locations
  subscribeLocations: (callback: (data: any[]) => void) => {
    if (!db) return () => {};
    const q = collection(db, LOCATIONS_COL);
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data() as any, id: doc.id }));
      callback(docs);
    });
  },

  addSession: async (session: any) => {
    if (!db) return;
    const docRef = doc(collection(db, SESSIONS_COL), session.id);
    await setDoc(docRef, session);
  },

  updateSession: async (id: string, data: any) => {
    if (!db) return;
    const docRef = doc(db, SESSIONS_COL, id);
    await updateDoc(docRef, data);
  },

  deleteSession: async (id: string) => {
    if (!db) return;
    const docRef = doc(db, SESSIONS_COL, id);
    await deleteDoc(docRef);
  },

  saveLocations: async (locations: any[]) => {
    if (!db) return;
    const batch = writeBatch(db);
    for (const loc of locations) {
      const docRef = doc(db, LOCATIONS_COL, loc.id);
      batch.set(docRef, loc);
    }
    await batch.commit();
  },

  deleteLocation: async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, LOCATIONS_COL, id));
  }
};
