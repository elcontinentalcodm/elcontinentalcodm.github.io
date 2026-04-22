/**
 * SETTINGS.JS - Configuración y Preferencias del Usuario
 * Maneja: Tema, Idioma, Notificaciones, Sonido, Datos
 */

// ══════════════════════════════════════════════════════════════
// OBJETO GLOBAL DE CONFIGURACIÓN
// ══════════════════════════════════════════════════════════════

class UserSettings {
    constructor() {
        this.STORAGE_KEY = 'continental_user_settings';
        this.defaults = {
            theme: 'dark',
            darkMode: true,
            language: 'es',
            notifications: {
                torneos: true,
                clanes: true,
                marketing: false
            },
            sound: {
                enabled: true,
                volume: 50
            },
            privacy: {
                analytics: true
            }
        };
        this.settings = this.loadSettings();
        this.initSettingsPage();
        this.initHamburger();
        this.applyStoredTheme();
    }

    // Cargar configuración desde localStorage
    loadSettings() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : { ...this.defaults };
    }

    // Guardar configuración a localStorage
    saveSettings() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
        this.applyStoredTheme();
    }

    // ══════════════════════════════════════════════════════════════
    // TEMA (Dark/Light/Neon)
    // ══════════════════════════════════════════════════════════════

    applyStoredTheme() {
        const theme = this.settings.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        
        // Actualizar toggle de modo oscuro
        if (document.getElementById('themeToggle')) {
            document.getElementById('themeToggle').checked = this.settings.darkMode !== false;
        }
    }

    setTheme(theme) {
        this.settings.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Actualizar cards de tema
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-theme') === theme);
        });
        
        this.saveSettings();
    }

    toggleDarkMode(enabled) {
        this.settings.darkMode = enabled;
        this.setTheme(enabled ? 'dark' : 'light');
    }

    // ══════════════════════════════════════════════════════════════
    // IDIOMA
    // ══════════════════════════════════════════════════════════════

    setLanguage(lang) {
        this.settings.language = lang;
        this.saveSettings();
        // Nota: Para una implementación completa, aquí iría la lógica i18n
        console.log(`Idioma cambiado a: ${lang}`);
    }

    // ══════════════════════════════════════════════════════════════
    // NOTIFICACIONES
    // ══════════════════════════════════════════════════════════════

    toggleNotification(type, enabled) {
        this.settings.notifications[type] = enabled;
        this.saveSettings();
    }

    // ══════════════════════════════════════════════════════════════
    // SONIDO
    // ══════════════════════════════════════════════════════════════

    toggleSound(enabled) {
        this.settings.sound.enabled = enabled;
        if (enabled) this.playTestSound();
        this.saveSettings();
    }

    setVolume(value) {
        const vol = Math.max(0, Math.min(100, parseInt(value)));
        this.settings.sound.volume = vol;
        
        // Actualizar display
        if (document.getElementById('volumeValue')) {
            document.getElementById('volumeValue').textContent = vol;
        }
        
        this.saveSettings();
    }

    playTestSound() {
        // Crear un sonido simple (beep)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        // Volumen desde preferencias
        const volume = this.settings.sound.volume / 100;
        gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    // ══════════════════════════════════════════════════════════════
    // DATOS & PRIVACIDAD
    // ══════════════════════════════════════════════════════════════

    toggleAnalytics(enabled) {
        this.settings.privacy.analytics = enabled;
        this.saveSettings();
    }

    exportUserData() {
        const data = {
            exported: new Date().toISOString(),
            settings: this.settings,
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language
            }
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        this.downloadFile(dataStr, 'continental-settings.json', 'application/json');
    }

    clearSettings() {
        if (confirm('⚠️ ¿Estás seguro? Esto eliminará todas tus preferencias guardadas.\n\nEstas configuraciones se resetearán a los valores por defecto.')) {
            this.settings = { ...this.defaults };
            localStorage.removeItem(this.STORAGE_KEY);
            this.applyStoredTheme();
            alert('✅ Preferencias limpiadas. Las configuraciones han sido restauradas.');
            location.reload();
        }
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ══════════════════════════════════════════════════════════════
    // INICIALIZACIÓN DE LA PÁGINA DE SETTINGS
    // ══════════════════════════════════════════════════════════════

    initSettingsPage() {
        // Solo ejecutar en settings.html
        if (!document.getElementById('themeToggle')) return;

        // TEMA - Toggle modo oscuro
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });

        // TEMA - Cards de tema
        document.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                const theme = card.getAttribute('data-theme');
                this.setTheme(theme);
            });
        });

        // IDIOMA
        const languageSelect = document.getElementById('languageSelect');
        languageSelect.value = this.settings.language;
        languageSelect.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });

        // NOTIFICACIONES
        document.getElementById('notifTorneos').checked = this.settings.notifications.torneos;
        document.getElementById('notifTorneos').addEventListener('change', (e) => {
            this.toggleNotification('torneos', e.target.checked);
        });

        document.getElementById('notifClanes').checked = this.settings.notifications.clanes;
        document.getElementById('notifClanes').addEventListener('change', (e) => {
            this.toggleNotification('clanes', e.target.checked);
        });

        document.getElementById('notifMarketing').checked = this.settings.notifications.marketing;
        document.getElementById('notifMarketing').addEventListener('change', (e) => {
            this.toggleNotification('marketing', e.target.checked);
        });

        // SONIDO
        document.getElementById('soundToggle').checked = this.settings.sound.enabled;
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.toggleSound(e.target.checked);
        });

        const volumeControl = document.getElementById('volumeControl');
        volumeControl.value = this.settings.sound.volume;
        volumeControl.addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });

        // DATOS & PRIVACIDAD
        document.getElementById('dataTracking').checked = this.settings.privacy.analytics;
        document.getElementById('dataTracking').addEventListener('change', (e) => {
            this.toggleAnalytics(e.target.checked);
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportUserData();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearSettings();
        });

        // Navegación del menú
        this.initSettingsMenu();
    }

    // ══════════════════════════════════════════════════════════════
    // MENÚ DE NAVEGACIÓN EN SETTINGS
    // ══════════════════════════════════════════════════════════════

    initSettingsMenu() {
        const menuItems = document.querySelectorAll('.settings-menu-list a');
        const panels = document.querySelectorAll('.settings-panel');

        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remover active de todos
                menuItems.forEach(m => m.classList.remove('active'));
                panels.forEach(p => p.style.display = 'none');
                
                // Agregar active al actual
                item.classList.add('active');
                const target = item.getAttribute('href').substring(1);
                const panel = document.getElementById(target);
                if (panel) panel.style.display = 'block';
            });
        });

        // Mostrar primer panel por defecto
        if (panels.length > 0) {
            panels[0].style.display = 'block';
        }
    }

    // ══════════════════════════════════════════════════════════════
    // HAMBURGER MENU (RESPONSIVE)
    // ══════════════════════════════════════════════════════════════

    initHamburger() {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');

        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('open');
                navLinks.classList.toggle('open');
            });

            // Cerrar menu al hacer click en un link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('open');
                    navLinks.classList.remove('open');
                });
            });
        }
    }
}

// ══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
    window.userSettings = new UserSettings();
});
