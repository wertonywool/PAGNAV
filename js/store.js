// --- MOTOR DE NUBE: STORE 2.0 (FIREBASE EDITION) ---
import { db, storage, auth } from "./firebase-config.js";
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

const Store = {
    // Escuchar cambios en tiempo real (para el Dashboard)
    subscribePages(callback) {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, "users", user.uid, "apps"), orderBy("order", "asc"));
        return onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(apps);
        });
    },

    // Guardar nueva App en la Nube
    async savePage(pageData) {
        const user = auth.currentUser;
        if (!user) return;

        let iconUrl = pageData.icon;

        // Si es una imagen base64 (subida local), subirla a Firebase Storage
        if (iconUrl.startsWith('data:image')) {
            const storageRef = ref(storage, `users/${user.uid}/apps/${Date.now()}.webp`);
            const uploadTask = await uploadString(storageRef, iconUrl, 'data_url');
            iconUrl = await getDownloadURL(uploadTask.ref);
        }

        const appsRef = collection(db, "users", user.uid, "apps");
        await addDoc(appsRef, {
            ...pageData,
            icon: iconUrl,
            order: Date.now(), // Para mantener el orden
            createdAt: new Date()
        });
    },

    // Actualizar App
    async updatePage(appId, updatedData) {
        const user = auth.currentUser;
        if (!user) return;

        let iconUrl = updatedData.icon;
        if (iconUrl.startsWith('data:image')) {
            const storageRef = ref(storage, `users/${user.uid}/apps/${appId}.webp`);
            const uploadTask = await uploadString(storageRef, iconUrl, 'data_url');
            iconUrl = await getDownloadURL(uploadTask.ref);
        }

        const appRef = doc(db, "users", user.uid, "apps", appId);
        await updateDoc(appRef, { ...updatedData, icon: iconUrl });
    },

    // Borrar App
    async deletePage(appId) {
        const user = auth.currentUser;
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "apps", appId));
    },

    // Reordenar Apps
    async reorderPages(newIds) {
        const user = auth.currentUser;
        if (!user) return;

        // Actualizar el campo 'order' de cada app en Firestore
        for (let i = 0; i < newIds.length; i++) {
            const appRef = doc(db, "users", user.uid, "apps", newIds[i]);
            await updateDoc(appRef, { order: i });
        }
    },

    // Gestionar el Tema en la Nube
    async saveTheme(theme) {
        const user = auth.currentUser;
        if (!user) {
            localStorage.setItem('pagnav_theme', JSON.stringify(theme));
            return;
        }
        await setDoc(doc(db, "users", user.uid), { theme }, { merge: true });
    },

    async getTheme() {
        const user = auth.currentUser;
        if (!user) {
            const local = localStorage.getItem('pagnav_theme');
            return local ? JSON.parse(local) : { themeName: 'modern_dark', iconSize: 120 };
        }
        const userDoc = await getDoc(doc(db, "users", user.uid));
        return userDoc.exists() && userDoc.data().theme ? userDoc.data().theme : { themeName: 'modern_dark', iconSize: 120 };
    }
};

export default Store;
