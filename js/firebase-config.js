// --- CONFIGURACIÓN DE FIREBASE PARA PAGNAV 2.0 (REAL) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAImsKBoJ-F9e6f2zOACcoBlhZzyx1kqiE",
  authDomain: "pagnav.firebaseapp.com",
  projectId: "pagnav",
  storageBucket: "pagnav.firebasestorage.app",
  messagingSenderId: "496589010975",
  appId: "1:496589010975:web:de4dd16239bc3d05f3bd2a",
  measurementId: "G-Z9RRQSPLYJ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exportar servicios
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Activar Persistencia Offline
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn("La persistencia falló: Múltiples pestañas abiertas.");
    } else if (err.code == 'unimplemented') {
        console.warn("La persistencia no es compatible con este navegador.");
    }
});
