
import * as Realm from 'realm-web';

const CONFIG_KEY = 'sbg_mongodb_config';

const getConfiguration = () => {
  const savedConfig = localStorage.getItem(CONFIG_KEY);
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch (e) {
      console.error("Failed to parse saved MongoDB config");
    }
  }
  
  return {
    appId: '',
    dbName: 'badminton',
    dataSource: 'mongodb-atlas'
  };
};

const config = getConfiguration();
let app: Realm.App | null = null;
// Fix: Removed 'globalThis.' prefix as Realm is imported from 'realm-web'
let mongodb: Realm.Services.MongoDB | null = null;

if (config.appId) {
  try {
    app = new Realm.App({ id: config.appId });
  } catch (e) {
    console.error("MongoDB Atlas App initialization failed:", e);
  }
}

const ensureAuth = async () => {
  if (!app) return null;
  if (!app.currentUser) {
    await app.logIn(Realm.Credentials.anonymous());
  }
  return app.currentUser;
};

const getCollection = async (name: string) => {
  const user = await ensureAuth();
  if (!user || !app) return null;
  return user.mongoClient(config.dataSource).db(config.dbName).collection(name);
};

export const mongodbService = {
  isConfigured: () => !!app && !!config.appId,

  saveConfig: (newConfig: any) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    window.location.reload();
  },

  clearConfig: () => {
    localStorage.removeItem(CONFIG_KEY);
    window.location.reload();
  },

  subscribeSessions: (callback: (data: any[]) => void) => {
    let cancelled = false;
    const fetchAndWatch = async () => {
      const col = await getCollection('sessions');
      if (!col || cancelled) return;

      // Initial fetch
      const docs = await col.find({}, { sort: { date: -1 } });
      callback(docs.map(d => ({ ...d, id: d._id.toString() })));

      // Watch for changes (Real-time)
      for await (const change of col.watch()) {
        if (cancelled) break;
        const updatedDocs = await col.find({}, { sort: { date: -1 } });
        callback(updatedDocs.map(d => ({ ...d, id: d._id.toString() })));
      }
    };

    fetchAndWatch();
    return () => { cancelled = true; };
  },

  subscribeLocations: (callback: (data: any[]) => void) => {
    let cancelled = false;
    const fetchAndWatch = async () => {
      const col = await getCollection('locations');
      if (!col || cancelled) return;

      const docs = await col.find({});
      callback(docs.map(d => ({ ...d, id: d._id.toString() })));

      for await (const change of col.watch()) {
        if (cancelled) break;
        const updatedDocs = await col.find({});
        callback(updatedDocs.map(d => ({ ...d, id: d._id.toString() })));
      }
    };

    fetchAndWatch();
    return () => { cancelled = true; };
  },

  addSession: async (session: any) => {
    const col = await getCollection('sessions');
    if (!col) return;
    const { id, ...data } = session;
    await col.insertOne({ _id: id, ...data });
  },

  updateSession: async (id: string, data: any) => {
    const col = await getCollection('sessions');
    if (!col) return;
    await col.updateOne({ _id: id }, { $set: data });
  },

  deleteSession: async (id: string) => {
    const col = await getCollection('sessions');
    if (!col) return;
    await col.deleteOne({ _id: id });
  },

  saveLocations: async (locations: any[]) => {
    const col = await getCollection('locations');
    if (!col) return;
    for (const loc of locations) {
      const { id, ...data } = loc;
      await col.updateOne({ _id: id }, { $set: data }, { upsert: true });
    }
  },

  deleteLocation: async (id: string) => {
    const col = await getCollection('locations');
    if (!col) return;
    await col.deleteOne({ _id: id });
  }
};
