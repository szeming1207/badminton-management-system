
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  getDoc
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
  
  // Use environment variables as fallback
  return {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || ''
  };
};

const firebaseConfig = getConfiguration();
let app: any = null;
let db: any = null;
let auth: any = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    signInAnonymously(auth).catch(err => console.error("Firebase Auth Error:", err));
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
  }
}

export const firebaseService = {
  isConfigured: () => !!db,

  saveConfig: (newConfig: any) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    window.location.reload();
  },

  clearConfig: () => {
    localStorage.removeItem(CONFIG_KEY);
    window.location.reload();
  },

  subscribeSessions: (callback: (data: any[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, "sessions"), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      callback(sessions);
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
    // We use id if provided (UUID from app), or let firestore generate
    if (id) {
      await setDoc(doc(db, "sessions", id), data);
    } else {
      await addDoc(collection(db, "sessions"), data);
    }
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
  },

  deleteLocation: async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "locations", id));
  }
};
