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
    const presetBtns = document.querySelectorAll('.preset-btn');

    let currentTheme = { themeName: 'modern_dark', iconSize: 120 };

    // Inicializar Sortable
    new Sortable(appGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: () => {
            const ids = Array.from(appGrid.children).map(card => card.dataset.id);
            Store.reorderPages(ids);
        }
    });

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
                <div class="card-icon-wrapper">
                    <button class="card-btn delete-btn" title="Eliminar"><i class="fas fa-times"></i></button>
                    <button class="card-btn edit-btn" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="card-btn info-badge" title="Info"><i class="fas fa-info"></i></button>
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
        themeLink.href = `css/themes/${theme.themeName}.css`;
        document.documentElement.style.setProperty('--card-min-w', `${theme.iconSize}px`);
        presetBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme.themeName);
        });
    }
});
