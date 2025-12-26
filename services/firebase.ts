
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
  setDoc
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// 统一获取 API Key 的逻辑
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  return (import.meta as any).env?.[`VITE_${key}`] || (import.meta as any).env?.[key];
};

const SECURE_CONFIG = {
  apiKey: getEnv('FIREBASE_API_KEY') || getEnv('API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || "badminton-b513e.firebaseapp.com",
  projectId: getEnv('FIREBASE_PROJECT_ID') || "badminton-b513e",
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || "badminton-b513e.firebasestorage.app",
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || "504434789296",
  appId: getEnv('FIREBASE_APP_ID') || "1:504434789296:web:e1510b72b16af858bc6475"
};

const isConfigValid = !!SECURE_CONFIG.apiKey;

let db: any = null;
let auth: any = null;
let connectionPromise: Promise<void> | null = null;

if (isConfigValid) {
  try {
    const app = !getApps().length ? initializeApp(SECURE_CONFIG) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    
    connectionPromise = signInAnonymously(auth).then(() => {
      console.log("Firebase Connected");
    }).catch(err => {
      console.error("Auth failed:", err);
    });
  } catch (e) {
    console.error("Firebase Init Error:", e);
  }
}

export const firebaseService = {
  isConfigured: () => isConfigValid && !!db,
  
  waitUntilReady: () => connectionPromise || Promise.resolve(),

  subscribeSessions: (callback: (data: any[]) => void, onError?: (err: string) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, "sessions"), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        waitingList: doc.data().waitingList || [],
        participants: doc.data().participants || [],
        status: doc.data().status || 'active'
      }));
      callback(sessions);
    }, (error) => {
      console.error("Firestore Subscribe Error:", error);
      if (onError) onError(error.message);
    });
  },

  subscribeLocations: (callback: (data: any[]) => void) => {
    if (!db) return () => {};
    return onSnapshot(collection(db, "locations"), (snapshot) => {
      const locations = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      callback(locations);
    });
  },

  addSession: async (session: any) => {
    if (!db) return;
    const { id, ...data } = session;
    await setDoc(doc(db, "sessions", id), data);
  },

  updateSession: async (id: string, data: any) => {
    if (!db) return;
    await updateDoc(doc(db, "sessions", id), data);
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
