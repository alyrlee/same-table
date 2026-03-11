import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18nData from '../data/i18n';

const AppContext = createContext();

const DB_NAME = 'health-heritage-db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pantry')) {
        db.createObjectStore('pantry', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('saved')) {
        db.createObjectStore('saved', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(storeName) {
  try {
    const db = await openDB();
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function dbPut(storeName, item) {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch { /* offline fallback */ }
}

async function dbDelete(storeName, id) {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch { /* offline fallback */ }
}

const AUTH_TOKEN_KEY = 'hh-token';

async function authFetch(path, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api/auth${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('hh-lang') || 'en'; } catch { return 'en'; }
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pantryItems, setPantryItems] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const t = useCallback((key) => {
    return i18nData[lang]?.[key] || i18nData.en?.[key] || key;
  }, [lang]);

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    try { localStorage.setItem('hh-lang', newLang); } catch { /* noop */ }
    document.documentElement.lang = newLang;
  }, []);

  // ─── Auth: validate saved token on mount ───
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { setAuthLoading(false); return; }
    authFetch('/me')
      .then((data) => setUser(data.user))
      .catch(() => { localStorage.removeItem(AUTH_TOKEN_KEY); })
      .finally(() => setAuthLoading(false));
  }, []);

  const register = useCallback(async (email, password, name) => {
    const data = await authFetch('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const loginAsGuest = useCallback(async () => {
    const data = await authFetch('/guest', { method: 'POST' });
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  }, []);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Load pantry from IndexedDB
  useEffect(() => {
    dbGetAll('pantry').then((items) => {
      if (items.length > 0) {
        setPantryItems(items);
      } else {
        // Default items
        const defaults = [
          { id: 1, emoji: '🍗', name: 'Chicken thighs' },
          { id: 2, emoji: '🫘', name: 'Black beans' },
          { id: 3, emoji: '🌽', name: 'Plantains' },
          { id: 4, emoji: '🧄', name: 'Garlic' },
          { id: 5, emoji: '🍋', name: 'Limes' },
        ];
        setPantryItems(defaults);
        defaults.forEach((item) => dbPut('pantry', item));
      }
    });
    dbGetAll('saved').then(setSavedRecipes);
  }, []);

  const addPantryItem = useCallback((name) => {
    const emojis = ['🥦','🍅','🧅','🌶️','🥕','🥑','🍋','🌿','🥚','🍞','🧄','🫘'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const item = { id: Date.now(), emoji, name };
    setPantryItems((prev) => [...prev, item]);
    dbPut('pantry', item);
  }, []);

  const removePantryItem = useCallback((id) => {
    setPantryItems((prev) => prev.filter((i) => i.id !== id));
    dbDelete('pantry', id);
  }, []);

  const toggleSavedRecipe = useCallback((recipeId) => {
    setSavedRecipes((prev) => {
      const exists = prev.find((r) => r.id === recipeId);
      if (exists) {
        dbDelete('saved', recipeId);
        return prev.filter((r) => r.id !== recipeId);
      } else {
        const item = { id: recipeId };
        dbPut('saved', item);
        return [...prev, item];
      }
    });
  }, []);

  const isRecipeSaved = useCallback((recipeId) => {
    return savedRecipes.some((r) => r.id === recipeId);
  }, [savedRecipes]);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        isOnline,
        user,
        authLoading,
        isAuthenticated: !!user,
        register,
        login,
        loginAsGuest,
        logout,
        pantryItems,
        addPantryItem,
        removePantryItem,
        savedRecipes,
        toggleSavedRecipe,
        isRecipeSaved,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
