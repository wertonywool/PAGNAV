import Store from "./store.js";
import Auth from "./auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const appGrid = document.getElementById('app-grid');
    const toggleCustomizer = document.getElementById('toggle-customizer');
    const closeCustomizer = document.getElementById('close-customizer');
    const customizerPanel = document.getElementById('customizer-panel');
    const themeLink = document.getElementById('theme-link');

    // Theme Elements
    const configIconSize = document.getElementById('config-icon-size');
    const resetThemeBtn = document.getElementById('reset-theme');
    const factoryResetBtn = document.getElementById('factory-reset');
    const presetBtns = document.querySelectorAll('.preset-btn');

    let currentTheme = { themeName: 'modern_dark', iconSize: 120 };

    // ... (Sortable init remains same)

    if (factoryResetBtn) {
        factoryResetBtn.onclick = async () => {
            if(confirm("⚠ ¿ESTÁS SEGURO?\nEsto eliminará TODAS tus aplicaciones y reseteará tu configuración a los valores de fábrica.")) {
                if(confirm("Confirmación final: Esta acción no se puede deshacer.")) {
                    const ids = Array.from(appGrid.children).map(card => card.dataset.id);
                    for(const id of ids) {
                        await Store.deletePage(id);
                    }
                    localStorage.clear();
                    window.location.reload();
                }
            }
        };
    }

    // Inicializar Sortable (Optimizado para móvil)
    new Sortable(appGrid, {
        animation: 250,
        ghostClass: 'sortable-ghost',
        delay: 150, // Pequeño retraso para evitar drag accidental al hacer scroll
        delayOnTouchOnly: true,
        touchStartThreshold: 5,
        forceFallback: true, // Mejor compatibilidad en navegadores móviles
        fallbackOnBody: true,
        swapThreshold: 0.65,
        onEnd: () => {
            const ids = Array.from(appGrid.children).map(card => card.dataset.id);
            Store.reorderPages(ids);
        }
    });

    const logoutBtn = document.getElementById('logout-btn');
    const offlineIndicator = document.getElementById('offline-indicator');

    // Manejo de Estado Online/Offline Visual
    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineIndicator.style.color = '#10b981'; // Verde
            offlineIndicator.title = 'Conectado a la Nube';
            offlineIndicator.innerHTML = '<i class="fas fa-cloud"></i>';
        } else {
            offlineIndicator.style.color = '#f59e0b'; // Naranja
            offlineIndicator.title = 'Modo Offline (Datos locales)';
            offlineIndicator.innerHTML = '<i class="fas fa-cloud-slash"></i>';
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // --- RESPALDO: EXPORTAR E IMPORTAR ---
    const exportBtn = document.getElementById('export-data');
    const importBtnTrigger = document.getElementById('import-data-trigger');
    const importFile = document.getElementById('import-data-file');

    if (exportBtn) {
        exportBtn.onclick = async () => {
            const user = Auth.getCurrentUser();
            if (!user) return alert("Debes estar logueado para exportar.");

            // Obtener apps directamente del grid para asegurar que exportamos lo que se ve
            const apps = Array.from(appGrid.children).map(card => {
                // Esta es una forma simplificada; lo ideal es obtenerlo del Store si es posible
                // Pero como Store.subscribePages ya las tiene, usaremos una variable global o pediremos al Store
                return null; 
            });

            // Mejor: Pedir al Store los datos cacheados
            const cachedKey = `pagnav_apps_${user.uid}`;
            const appsData = JSON.parse(localStorage.getItem(cachedKey) || '[]');
            const themeData = JSON.parse(localStorage.getItem(`pagnav_theme_${user.uid}`) || '{}');

            const backup = {
                version: "2.0",
                date: new Date().toISOString(),
                apps: appsData,
                theme: themeData
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pagnav_backup_${new Date().getTime()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
    }

    if (importBtnTrigger) {
        importBtnTrigger.onclick = () => importFile.click();
    }

    if (importFile) {
        importFile.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!data.apps) throw new Error("Formato inválido");

                    if (confirm(`Se importarán ${data.apps.length} aplicaciones. Esto sobreescribirá tus datos actuales en la nube. ¿Continuar?`)) {
                        // 1. Limpiar actual (opcional, aquí mejor agregar)
                        for (const app of data.apps) {
                            const { id, ...cleanData } = app;
                            await Store.savePage(cleanData);
                        }
                        if (data.theme) {
                            await Store.saveTheme(data.theme);
                        }
                        alert("Importación completada con éxito. La página se recargará.");
                        window.location.reload();
                    }
                } catch (err) {
                    alert("Error al importar el archivo: " + err.message);
                }
            };
            reader.readAsText(file);
        };
    }

    // --- PROTECCIÓN Y CARGA ---
    Auth.checkSession(async (user) => {
        if (user) {
            // 1. Suscribirse a las páginas
            Store.subscribePages((pages) => {
                renderPages(pages);
            });

            // 2. Cargar Tema desde la nube (una sola vez al inicio)
            currentTheme = await Store.getTheme();
            applyTheme(currentTheme);
            configIconSize.value = currentTheme.iconSize;
        }
    });

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if(confirm("¿Cerrar sesión?")) Auth.logout();
        };
    }

    toggleCustomizer.onclick = () => customizerPanel.classList.add('open');
    closeCustomizer.onclick = () => customizerPanel.classList.remove('open');

    // Ajuste de tamaño
    configIconSize.oninput = () => {
        currentTheme.iconSize = configIconSize.value;
        applyTheme(currentTheme);
        Store.saveTheme(currentTheme);
    };

    // Cambio de temas (Instantáneo)
    presetBtns.forEach(btn => {
        btn.onclick = () => {
            currentTheme.themeName = btn.dataset.theme;
            applyTheme(currentTheme);
            Store.saveTheme(currentTheme);
        };
    });

    resetThemeBtn.onclick = () => {
        currentTheme = { themeName: 'modern_dark', iconSize: 120 };
        applyTheme(currentTheme);
        Store.saveTheme(currentTheme);
        configIconSize.value = 120;
    };

    const infoModal = document.getElementById('info-modal');
    const closeInfo = document.getElementById('close-info');
    closeInfo.onclick = () => infoModal.classList.remove('open');

    function renderPages(pages) {
        appGrid.innerHTML = '';
        if (pages.length === 0) {
            appGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding-top: 100px; color: var(--text-muted);">
                <h2>Tu Dashboard en la Nube está vacío</h2>
                <p>Haz clic en "Nueva App" para empezar</p>
            </div>`;
            return;
        }

        pages.forEach(page => {
            const icon = page.icon || '🌐';
            const isImage = icon.startsWith('http') || icon.startsWith('data:image');
            const card = document.createElement('div');
            card.className = `nav-card size-${page.size || '1-1'}`;
            card.dataset.id = String(page.id);
            
            card.innerHTML = `
                <button class="card-btn delete-btn" title="Eliminar"><i class="fas fa-times"></i></button>
                <button class="card-btn edit-btn" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="card-btn info-badge" title="Info"><i class="fas fa-info"></i></button>
                <div class="card-icon-wrapper">
                    <div class="card-icon-container" style="--this-card-bg: ${page.color || '#18181b'}">
                        ${isImage 
                            ? `<img src="${icon}" class="card-icon-img">` 
                            : `<span class="emoji-icon">${icon}</span>`}
                    </div>
                </div>
                <div class="card-title">${page.title || 'App'}</div>
            `;

            card.onclick = (e) => {
                if(!e.target.closest('button')) {
                    if (page.url) window.open(page.url, '_blank');
                    else showInfo(page);
                }
            };

            card.querySelector('.edit-btn').onclick = (e) => {
                e.stopPropagation();
                window.location.href = `config.html?edit=${page.id}`;
            };

            card.querySelector('.info-badge').onclick = (e) => {
                e.stopPropagation();
                showInfo(page);
            };

            card.querySelector('.delete-btn').onclick = (e) => {
                e.stopPropagation();
                if(confirm(`¿Eliminar ${page.title}?`)) Store.deletePage(page.id);
            };

            appGrid.appendChild(card);
        });
    }

    function showInfo(page) {
        document.getElementById('info-title').innerText = page.title || 'Información';
        document.getElementById('info-desc').innerText = page.desc || 'Sin descripción.';
        infoModal.classList.add('open');
    }

    function applyTheme(theme) {
        if (!theme || !theme.themeName) return;
        
        // Soporte para estructura modular
        const modularThemes = [
            'lava', 'glitch_void', 'neon_jungle', 'ice_kingdom', 'jojos', 
            'cyberpunk_red', 'abyssal_deep', 'galactic_horizon', 'arcane_academy', 'dragon_lair',
            'synthwave', 'samurai', 'rapture', 'gothic', 'emerald_forest', 
            'cybercore', 'desert_mirage', 'fallout', 'celestial', 'shadow_realm',
            'mars_colony', 'liminal_space', 'candy_land', 'pirate_cove', 'ancient_egypt',
            'cyber_city', 'viking_runes', 'doodle_sketch', 'toxic_slime', 'luxury_onyx'
        ];

        const isModular = modularThemes.includes(theme.themeName);
        const themePath = isModular 
            ? `css/themes/${theme.themeName}/main.css` 
            : `css/themes/${theme.themeName}.css`;

        themeLink.href = themePath;
        document.documentElement.style.setProperty('--user-icon-size', `${theme.iconSize}px`);
        
        // Añadir clase del tema al body para CSS específico
        document.body.className = '';
        document.body.classList.add(`theme-${theme.themeName}`);
        
        presetBtns.forEach(btn => {
            const btnTheme = btn.closest('.theme-option').querySelector('.preset-btn').dataset.theme;
            btn.classList.toggle('active', btnTheme === theme.themeName);
        });
    }
});
