// --- LÓGICA DE AUTENTICACIÓN GOOGLE ---
import { auth, googleProvider } from "./firebase-config.js";
import { signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const Auth = {
    // Iniciar sesión con Google
    async login() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log("Usuario logueado:", result.user.displayName);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            alert("No se pudo iniciar sesión con Google.");
        }
    },

    // Cerrar sesión
    async logout() {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    },

    // Vigilar el estado de la sesión
    checkSession(callback) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                callback(user);
            } else {
                // Si no hay sesión y no estamos en login.html, redirigir
                if (!window.location.pathname.includes("login.html")) {
                    window.location.href = "login.html";
                }
            }
        });
    }
};

export default Auth;
