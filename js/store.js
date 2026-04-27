// --- MOTOR DE NUBE: STORE 2.0 (MODO SIN PAGO / SOLO FIRESTORE) ---
import { db, auth } from "./firebase-config.js";
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

const Store = {
    // Escuchar cambios en tiempo real
    subscribePages(callback) {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const q = query(collection(db, "users", user.uid, "apps"), orderBy("order", "asc"));
            return onSnapshot(q, (snapshot) => {
                const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(apps);
            }, (error) => {
                console.error("Error en suscripción:", error);
                callback([]);
            });
        } catch (e) {
            console.error("Error crítico en subscribePages:", e);
        }
    },

    // Guardar nueva App (Imagen guardada directamente en Firestore como Base64 optimizado)
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
            await setDoc(doc(db, "users", user.uid), { theme }, { merge: true });
        } catch (e) {
            console.error("Error guardando tema:", e);
        }
    },

    async getTheme() {
        try {
            const user = auth.currentUser;
            if (!user) return { themeName: 'modern_dark', iconSize: 120 };
            
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().theme) {
                return userDoc.data().theme;
            }
        } catch (e) {
            console.warn("Fallo al leer tema:", e);
        }
        return { themeName: 'modern_dark', iconSize: 120 };
    }
};

export default Store;
