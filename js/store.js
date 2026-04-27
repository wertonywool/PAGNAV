// --- MOTOR DE NUBE: STORE 2.0 (MODO SIN PAGO / SOLO FIRESTORE) ---
import { db, auth } from "./firebase-config.js";
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

const Store = {
    // Escuchar cambios en tiempo real y cachear localmente
    subscribePages(callback) {
        try {
            const user = auth.currentUser;
            if (!user) {
                // Si no hay usuario, intentar cargar de cache por si acaso
                const cached = localStorage.getItem('pagnav_apps_cache');
                if (cached) callback(JSON.parse(cached));
                return;
            }

            // Cargar inmediatamente desde cache para velocidad
            const cached = localStorage.getItem(`pagnav_apps_${user.uid}`);
            if (cached) callback(JSON.parse(cached));

            const q = query(collection(db, "users", user.uid, "apps"), orderBy("order", "asc"));
            return onSnapshot(q, (snapshot) => {
                const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Actualizar cache
                localStorage.setItem(`pagnav_apps_${user.uid}`, JSON.stringify(apps));
                callback(apps);
            }, (error) => {
                console.error("Error en suscripción:", error);
            });
        } catch (e) {
            console.error("Error crítico en subscribePages:", e);
        }
    },

    // Guardar nueva App
    async savePage(pageData) {
        const user = auth.currentUser;
        if (!user) throw new Error("No hay usuario");

        const appsRef = collection(db, "users", user.uid, "apps");
        await addDoc(appsRef, {
            ...pageData,
            order: Date.now(),
            createdAt: new Date()
        });
    },

    async updatePage(appId, updatedData) {
        const user = auth.currentUser;
        if (!user) throw new Error("No hay usuario");

        const appRef = doc(db, "users", user.uid, "apps", appId);
        await updateDoc(appRef, updatedData);
    },

    async deletePage(appId) {
        const user = auth.currentUser;
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "apps", appId));
    },

    async reorderPages(newIds) {
        const user = auth.currentUser;
        if (!user) return;
        for (let i = 0; i < newIds.length; i++) {
            const appRef = doc(db, "users", user.uid, "apps", newIds[i]);
            await updateDoc(appRef, { order: i });
        }
    },

    async saveTheme(theme) {
        const user = auth.currentUser;
        if (!user) return;
        try {
            localStorage.setItem(`pagnav_theme_${user.uid}`, JSON.stringify(theme));
            await setDoc(doc(db, "users", user.uid), { theme }, { merge: true });
        } catch (e) {
            console.error("Error guardando tema:", e);
        }
    },

    async getTheme() {
        try {
            const user = auth.currentUser;
            const defaultTheme = { themeName: 'modern_dark', iconSize: 120 };
            
            if (!user) return defaultTheme;

            // Intentar cache primero
            const cached = localStorage.getItem(`pagnav_theme_${user.uid}`);
            if (cached) return JSON.parse(cached);
            
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().theme) {
                const theme = userDoc.data().theme;
                localStorage.setItem(`pagnav_theme_${user.uid}`, JSON.stringify(theme));
                return theme;
            }
        } catch (e) {
            console.warn("Fallo al leer tema:", e);
        }
        return { themeName: 'modern_dark', iconSize: 120 };
    }
};

export default Store;
