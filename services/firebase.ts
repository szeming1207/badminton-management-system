
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
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const SECURE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.API_KEY || "AIzaSyDpjLq0-sP7U-YpgfFvZRpjpvq3TNj1Fdc",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "badminton-b513e.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "badminton-b513e",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "badminton-b513e.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "504434789296",
  appId: process.env.FIREBASE_APP_ID || "1:504434789296:web:e1510b72b16af858bc6475"
};

const isConfigValid = SECURE_CONFIG.apiKey && SECURE_CONFIG.apiKey.length > 10;

let db: any = null;
let auth: any = null;
let connectionPromise: Promise<void> | null = null;

if (isConfigValid) {
  try {
    const app = !getApps().length ? initializeApp(SECURE_CONFIG) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    
    // 异步执行匿名登录，不阻塞导出
    connectionPromise = signInAnonymously(auth).then(() => {
      console.log("Firebase Connected Anonymously");
    }).catch(err => {
      console.error("Auth failed:", err);
    });
  } catch (e) {
    console.error("Firebase Init Error:", e);
  }
}

export const firebaseService = {
  isConfigured: () => isConfigValid && !!db,
  
  // 暴露等待初始化的能力
  waitUntilReady: () => connectionPromise || Promise.resolve(),

  subscribeSessions: (callback: (data: any[]) => void, onError?: (err: string) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, "sessions"), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        waitingList: doc.data().waitingList || [], // 强制兼容旧数据
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
