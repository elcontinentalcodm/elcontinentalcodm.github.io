/**
 * CONFIGURACIÓN GLOBAL - EL CONTINENTAL
 * =====================================================
 * LOGOS: Crea carpeta "logos/" junto a los HTML
 * Nombre de cada logo = ID del clan + .jpg
 * Ej: logos/2026001.jpg, logos/2026002.jpg
 * Si no hay logo → logos/default.jpg
 * =====================================================
 * PUNTOS: Solo salas (Zona Guerra, Zona Letal, Zona Xtreme, etc.)
 * TROFEOS: Oro/Plata/Bronce = decorativos, NO suman puntos
 */

const CONFIG = {
    SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRa9VQLs3q_CXPQ_14S9SZ0snUA3AGmpYijAaUzbqut5LkSFepscbaLWvGb_AFt-24utnbdA4K02XEg/pub?gid=1070970565&single=true&output=csv',

    // ══════════════════════════════════════════════
    // HOJA DEL TORNEO (bracket dinámico)
    // 1. Abre tu nuevo Google Sheet del torneo
    // 2. Ve a Archivo → Publicar en la web
    // 3. Elige la pestaña del torneo → formato CSV → Publicar
    // 4. Copia el enlace y pégalo aquí
    // Formato de la hoja:  Ronda | Equipo1 | Puntos1 | Equipo2 | Puntos2
    // ══════════════════════════════════════════════
    TORNEO_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRokGDiYpw_QV0WtS7dqPXdZFsBRrQWawAH5kzK9Jodgun6Cy2lNalOhRiE6XIZ69pwtJFwHWmZBRTP/pub?gid=218312983&single=true&output=csv',

    // Hoja de asistencia: columna A = Clanes, columnas B-AF = días 1-31
    ASISTENCIA_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRa9VQLs3q_CXPQ_14S9SZ0snUA3AGmpYijAaUzbqut5LkSFepscbaLWvGb_AFt-24utnbdA4K02XEg/pub?gid=1400235060&single=true&output=csv',

    // Hojas de puntos semanales: una por sala
    DIARIOS_ZGUERRA_URL:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw0yyRYk7ik9KZNiKJpEhSG18CJ4bl2T38CpIJV3ErgYqAV2MZZAoYa6V7GwMBvKP84pGppxCW7wao/pub?gid=0&single=true&output=csv',
    SEMANAL_ZGUERRA_URL:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vRnhpfq-UuD76QAXSAStOxKAqlsqZQmz4uRQWbV5l0GiDVGBBlBZbg0GS4_Qe8HLuHqMhja3h7G_emG/pub?gid=1475745879&single=true&output=csv',
    SANCIONES_ZGUERRA_URL:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw0yyRYk7ik9KZNiKJpEhSG18CJ4bl2T38CpIJV3ErgYqAV2MZZAoYa6V7GwMBvKP84pGppxCW7wao/pub?gid=711294694&single=true&output=csv',
    DIARIOS_ZLETAL_URL:      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRshryBvdv7_fnllfpEd5TFO5-VJBOG3_q1YzTvGwdh-F8tGaPUXrJu0Fxb5LDUfbVbGvcxRw58Y3is/pub?gid=1468647519&single=true&output=csv',
    SEMANAL_ZLETAL_URL:      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRshryBvdv7_fnllfpEd5TFO5-VJBOG3_q1YzTvGwdh-F8tGaPUXrJu0Fxb5LDUfbVbGvcxRw58Y3is/pub?gid=515735007&single=true&output=csv',
    SANCIONES_ZLETAL_URL:    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRshryBvdv7_fnllfpEd5TFO5-VJBOG3_q1YzTvGwdh-F8tGaPUXrJu0Fxb5LDUfbVbGvcxRw58Y3is/pub?gid=1459408902&single=true&output=csv',
    TOPKILLER_ZLETAL_URL:    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRshryBvdv7_fnllfpEd5TFO5-VJBOG3_q1YzTvGwdh-F8tGaPUXrJu0Fxb5LDUfbVbGvcxRw58Y3is/pub?gid=424324350&single=true&output=csv',
    DIARIOS_ZXTREME_URL:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkx8mzwSI1FzjT992BhPLxwCQ2ae4557vtvpO4B95rdF1ulYLihXu1NhT977QTftq-1k0T8AvAsce6/pub?gid=1235108440&single=true&output=csv',
    SEMANAL_ZXTREME_URL:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkx8mzwSI1FzjT992BhPLxwCQ2ae4557vtvpO4B95rdF1ulYLihXu1NhT977QTftq-1k0T8AvAsce6/pub?gid=1235108440&single=true&output=csv',
    SANCIONES_ZXTREME_URL:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vTT0Vk1AL1zvuMHa3sHbfe3cSLXJH4-gZSQL6M0POexEAAy0iRPuPcN0hcBv__DMMeiGEPP6caZrKqR/pub?gid=711294694&single=true&output=csv',

    // ══════════════════════════════════════════════
    // SALAS REBIRTH ISLAND
    // TODO: Reemplaza estas URLs con las de tus hojas de Google Sheets
    // ══════════════════════════════════════════════
    DIARIOS_ISLA_EXTERMINIO_URL:     'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=0&single=true&output=csv',
    SEMANAL_ISLA_EXTERMINIO_URL:     'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=1433759351&single=true&output=csv',
    SANCIONES_ISLA_EXTERMINIO_URL:   'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=711294694&single=true&output=csv',

    DIARIOS_ISLA_ANIQUILACION_URL:     'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=0&single=true&output=csv',
    SEMANAL_ISLA_ANIQUILACION_URL:     'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=1433759351&single=true&output=csv',
    SANCIONES_ISLA_ANIQUILACION_URL:   'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=711294694&single=true&output=csv',

    DIARIOS_ISLA_DEVASTACION_URL:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6TIejNV5GW01FIxx4RCzZjiLd8lPxOppNdqveXlQmU-zsdBMUnm9rMrvOvaQwW7Gtwlv4AWajlpaW/pub?gid=515735007&single=true&output=csv',
    SEMANAL_ISLA_DEVASTACION_URL:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6TIejNV5GW01FIxx4RCzZjiLd8lPxOppNdqveXlQmU-zsdBMUnm9rMrvOvaQwW7Gtwlv4AWajlpaW/pub?gid=1468647519&single=true&output=csv',
    SANCIONES_ISLA_DEVASTACION_URL:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTfBwcHIT0bPWd9mP__N338NdZ2AwKT7S-pXT36TYeeWjqatuR-QhGR4Ln8znfDTW9_SaEMeUbOSlB/pub?gid=1459408902&single=true&output=csv',
    TOPKILLER_ISLA_DEVASTACION_URL:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTfBwcHIT0bPWd9mP__N338NdZ2AwKT7S-pXT36TYeeWjqatuR-QhGR4Ln8znfDTW9_SaEMeUbOSlB/pub?gid=424324350&single=true&output=csv',

    DIARIOS_ISLA_APOCALIPSIS_URL:     'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=0&single=true&output=csv',
    SEMANAL_ISLA_APOCALIPSIS_URL:     'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=1433759351&single=true&output=csv',
    SANCIONES_ISLA_APOCALIPSIS_URL:   'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=711294694&single=true&output=csv',

    DIARIOS_ISLA_EXTINCION_URL:     'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=0&single=true&output=csv',
    SEMANAL_ISLA_EXTINCION_URL:     'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=1433759351&single=true&output=csv',
    SANCIONES_ISLA_EXTINCION_URL:   'https://docs.google.com/spreadsheets/d/PLACEHOLDER_ID/pub?gid=711294694&single=true&output=csv',

    // ══════════════════════════════════════════════
    // HOJA DE CONTACTOS (solo visible para el CEO)
    // 1. Ve a tu Google Sheet del formulario de registro
    // 2. Archivo → Publicar en la web → la pestaña del form → CSV → Publicar
    // 3. Pega el enlace aquí
    //
    // Formato esperado (respuestas del Google Form):
    //   Col A (0) → Timestamp
    //   Col B (1) → Nombre del clan
    //   Col C (2) → Tag del clan
    //   Col D (3) → Logo del clan
    //   Col E (4) → Nombre del líder
    //   Col F (5) → Número de teléfono (líder)
    //   Col G (6) → Nombre del co-líder 1
    //   Col H (7) → Número de teléfono co-líder 1
    //   Col I (8) → Nombre del co-líder 2
    //   Col J (9) → Número de teléfono co-líder 2
    //   Col K (10) → Modo de juego
    // ══════════════════════════════════════════════
    CONTACTO_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRokGDiYpw_QV0WtS7dqPXdZFsBRrQWawAH5kzK9Jodgun6Cy2lNalOhRiE6XIZ69pwtJFwHWmZBRTP/pub?gid=2010911080&single=true&output=csv',

    CONTACTO_COLUMNS: {
        NOMBRE_CLAN:      1,
        TAG_CLAN:         2,
        LOGO:             3,
        NOMBRE_LIDER:     4,
        TELEFONO_LIDER:   5,
        NOMBRE_COLIDER1:  6,
        TELEFONO_COLIDER1:7,
        NOMBRE_COLIDER2:  8,
        TELEFONO_COLIDER2:9,
        MODO_JUEGO:       10,
    },

    LOGO_FOLDER:   'logo',
    LOGO_EXTENSION: 'jpg',
    LOGO_DEFAULT:   'logo/default.jpg',

    CACHE_DURATION: 5 * 60 * 1000,

    COLUMNS: {
        TIMESTAMP:        0,
        NOMBRE_DE_CLAN:   1,
        TAG_DEL_CLAN:     2,
        LOGO:             3,
        ID:               4,
        ORO:              5,
        PLATA:            6,
        BRONCE:           7,
        // ─────────────────────────────────────────────────────────────
        // MEDALLAS ESPECIALES — Columnas I, J, K de tu Google Sheet
        // Para ACTIVAR: escribe cualquier valor (1, SI, ✓, GANADOR...)
        // Para DESACTIVAR: deja la celda vacía o pon 0
        //   Columna I (índice 8)  → RUBI         → Torneo
        //   Columna J (índice 9)  → ORO_DIAMANTE → Torneo entre comunidades
        //   Columna K (índice 10) → ESMERALDA    → Torneo de MJ
        // ─────────────────────────────────────────────────────────────
        RUBI:             8,
        ORO_DIAMANTE:     9,
        ESMERALDA:        10,
        // Col 11 = "Nombre del Equipo" (usado por clanes.js para cruzar con hojas semanales)
        // Los datos de contacto (líder, teléfonos, co-líderes, modo de juego)
        // se leen desde CONFIG.CONTACTO_URL (hoja separada del form de registro).
        // Ver CONTACTO_COLUMNS más abajo.
    },

    SALAS: {
        ZONA_DE_GUERRA:   'Zona de Guerra',
        ZONA_LETAL:       'Zona Letal',
        ZONA_XTREME:      'Zona Xtreme'
    },

    // ══════════════════════════════════════════════
    // STREAMERS DE TIKTOK
    // Para marcar que está EN VIVO: pon vivo: true
    // Para offline:                   pon vivo: false
    // ══════════════════════════════════════════════
    STREAMERS: [
        {
            nombre: 'Toxii',
            handle: '@toxii',
            url:    'https://www.tiktok.com/@toxii',
            vivo:   true   // ← cambia a true cuando esté en directo
        }
    ],

    // ══════════════════════════════════════════════
    // 2 NIVELES DE ACCESO
    // ══════════════════════════════════════════════
    USERS: [
        {
            usuario:  'HOST',
            password: 'HOST2025',
            rol:      'viewer',
            sheetUrl: '' // vacío → usa SHEET_URL principal
        },
        {
            usuario:  'CEO',
            password: 'ceo2026',
            rol:      'master',
            sheetUrl: '' // vacío → usa SHEET_URL principal
        }
    ]
};

/* Logo: usa URL de la hoja si existe, si no usa carpeta local por ID */
function getLogoUrl(clanId, logoUrl) {
    // Si viene una URL directa de la hoja de cálculo, usarla
    if (logoUrl && String(logoUrl).trim() !== '' && String(logoUrl).trim() !== '—') {
        const url = String(logoUrl).trim();
        // Convertir links de Google Drive al formato de descarga directa
        if (url.includes('drive.google.com')) {
            // Formatos posibles:
            // https://drive.google.com/file/d/FILE_ID/view
            // https://drive.google.com/open?id=FILE_ID
            const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_\-]+)/);
            const matchOpen = url.match(/[?&]id=([a-zA-Z0-9_\-]+)/);
            const fileId = (matchFile && matchFile[1]) || (matchOpen && matchOpen[1]);
            if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
        }
        // Si es otra URL directa (http/https), usarla tal cual
        if (url.startsWith('http')) return url;
    }
    // Fallback: carpeta local por ID
    if (!clanId || String(clanId).trim() === '' || String(clanId).trim() === '—') return CONFIG.LOGO_DEFAULT;
    const cleanId = String(clanId).trim().replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!cleanId) return CONFIG.LOGO_DEFAULT;
    return `${CONFIG.LOGO_FOLDER}/${cleanId}.${CONFIG.LOGO_EXTENSION}`;
}

/* Puntos de salas — se leen desde las hojas semanales, no del formulario */
function calcularPuntos(row) {
    return 0;
}

/* Normaliza un nombre: minúsculas + solo alfanumérico */
function _normName(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/* Busca la clave más cercana en un semMap */
function _findSem(nombre, semMap) {
    const n = _normName(nombre);
    if (!n) return null;
    if (semMap[n]) return n;
    for (const k of Object.keys(semMap)) {
        if (k.length >= 5 && n.length >= 5 && (n.includes(k) || k.includes(n))) return k;
    }
    return null;
}

/* Construye un semMap (actualmente vacío, compatibilidad) */
async function buildSemMap() {
    return {};
}

/* CSV Parser */
function parseCSV(text) {
    const lines = text.split('\n'), result = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = [];
        let current = '', inQuotes = false;
        for (let c = 0; c < line.length; c++) {
            if (line[c] === '"') { inQuotes = !inQuotes; }
            else if (line[c] === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
            else { current += line[c]; }
        }
        values.push(current.trim());
        if (values.length > 1) result.push(values);
    }
    return result;
}

/* Fetch con caché — acepta URL opcional por usuario */
function getSheetCacheKeyId(url) {
    const s = String(url || '');
    let hash = 2166136261;
    for (let i = 0; i < s.length; i++) {
        hash ^= s.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function getSheetCacheKeys(url) {
    const id = getSheetCacheKeyId(url);
    return {
        id,
        data: 'elcontinental_data_' + id,
        time: 'elcontinental_time_' + id,
    };
}

async function fetchSheetData(url) {
    url = url || CONFIG.SHEET_URL;
    const keys = getSheetCacheKeys(url);
    const KEY   = keys.data;
    const TS    = keys.time;
    const cached = localStorage.getItem(KEY), ts = localStorage.getItem(TS);
    if (cached && ts && (Date.now() - parseInt(ts)) < CONFIG.CACHE_DURATION) return JSON.parse(cached);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = parseCSV(await res.text());
        localStorage.setItem(KEY, JSON.stringify(data));
        localStorage.setItem(TS, Date.now().toString());
        return data;
    } catch (err) {
        if (cached) return JSON.parse(cached);
        throw err;
    }
}

function filterActiveClans(data) {
    return data;
}

function clearCache() {
    Object.keys(localStorage)
        .filter(k => k.startsWith('elcontinental_'))
        .forEach(k => localStorage.removeItem(k));
}

/* Hamburger compartido */
function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');
    if (!hamburger || !navLinks) return;
    hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinks.classList.toggle('active'); });
    document.querySelectorAll('.nav-links a').forEach(l => l.addEventListener('click', () => { hamburger.classList.remove('active'); navLinks.classList.remove('active'); }));
    document.addEventListener('click', e => { if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) { hamburger.classList.remove('active'); navLinks.classList.remove('active'); } });
}

window.CONFIG            = CONFIG;
window.fetchSheetData    = fetchSheetData;
window.getLogoUrl        = getLogoUrl;
window.filterActiveClans = filterActiveClans;
window.calcularPuntos    = calcularPuntos;
window.getSheetCacheKeys = getSheetCacheKeys;

/* ══ RANKING SEMANAL PÚBLICO ══
 * Carga el resumen semanal de una hoja y lo renderiza.
 * url         → URL CSV semanal de la sala
 * containerId → id del div donde volcar el ranking
 */
async function loadRankingSemanalPublic(url, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
        const data = await fetchSheetData(url);
        const rows = data.filter(r => (r[17] || '').toString().trim() !== '');
        if (!rows.length) { el.innerHTML = '<p class="sp-empty">⚠️ Sin datos esta semana</p>'; return; }
        // Cada fila es un equipo independiente (no se fusionan aunque compartan nombre)
        const sorted = rows
            .map(r => ({ n: (r[17] || '').trim(), p: parseFloat(r[23]) || 0 }))
            .filter(e => e.n)
            .sort((a, b) => b.p - a.p);
        const medals = ['🥇', '🥈', '🥉'];
        let html = '<div class="sp-list">';
        sorted.forEach((c, i) => {
            const medal = medals[i] || '#' + (i + 1);
            const cls   = i < 3 ? ' sp-top' + (i + 1) : '';
            html += `<div class="sp-row${cls}"><span class="sp-pos">${medal}</span><span class="sp-name">${c.n}</span><span class="sp-pts">${c.p} <em>pts</em></span></div>`;
        });
        html += '</div>';
        el.innerHTML = html;
    } catch (e) {
        el.innerHTML = '<p class="sp-empty">⚠️ No se pudo cargar el ranking</p>';
    }
}
window.loadRankingSemanalPublic = loadRankingSemanalPublic;

/* ══ LÍDERES SEMANALES POR SALA ══
 * Carga el #1 de cada sala y lo vuelca en containerId
 * salasCfg = [{ label, url }]
 */
async function loadLideresSemanales(salasCfg, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
        const results = await Promise.all(salasCfg.map(s => fetchSheetData(s.url).catch(() => [])));
        let html = '';
        salasCfg.forEach((s, i) => {
            const rows = (results[i] || []).filter(r => (r[17] || '').toString().trim() !== '');
            if (!rows.length) {
                html += `<div class="lider-card lider-empty"><span class="lider-sala">${s.label}</span><span class="lider-nombre">Sin datos</span><span class="lider-pts">—</span></div>`;
                return;
            }
            const map = {};
            rows.forEach(r => {
                const n = (r[17] || '').trim(); if (!n) return;
                if (!map[n]) map[n] = 0;
                map[n] += parseFloat(r[23]) || 0;
            });
            const top = Object.entries(map).map(([n, p]) => ({ n, p })).sort((a, b) => b.p - a.p)[0];
            html += `<div class="lider-card"><span class="lider-sala">${s.label}</span><span class="lider-nombre">🥇 ${top.n}</span><span class="lider-pts">${top.p} pts</span></div>`;
        });
        el.innerHTML = html;
    } catch (e) {
        el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:1rem">⚠️ Sin datos disponibles</p>';
    }
}
window.loadLideresSemanales = loadLideresSemanales;
window.clearCache        = clearCache;
window.initHamburger     = initHamburger;

// ══════════════════════════════════════════════════════════════════════
// MEDALLAS ESPECIALES — funciones compartidas en TODAS las páginas
// ══════════════════════════════════════════════════════════════════════
/**
 * Definición visual de los 3 tipos de medalla.
 * Usada en index.html, clanes.html, ranking.html y admin.html.
 */
const TIPOS_MEDALLA = [
    { col: 'RUBI',         label: 'Rubí',        desc: 'Torneo',                   clase: 'rubi',         icono: '💎' },
    { col: 'ORO_DIAMANTE', label: 'Oro+Diamante', desc: 'Torneo entre comunidades', clase: 'oro-diamante', icono: '🔷' },
    { col: 'ESMERALDA',    label: 'Esmeralda',    desc: 'Torneo de MJ',             clase: 'esmeralda',   icono: '💚' },
];

/**
 * Devuelve true si la celda de la hoja tiene un valor que activa la medalla.
 * Activa: cualquier texto o número distinto de vacío / 0 / no / false.
 */
function tieneMedalla(valor) {
    if (valor === undefined || valor === null) return false;
    const v = String(valor).trim().toLowerCase();
    return v !== '' && v !== '0' && v !== 'no' && v !== 'false' && v !== '—';
}

/**
 * Devuelve divs estilo medal-item (igual que 🥇🥈🥉) para inyectar
 * DENTRO de .clan-medals / .medals-display.
 * El número viene de la celda: 3 → muestra 3; texto activo → muestra 1.
 */
function getBadgesHtml(row) {
    return TIPOS_MEDALLA
        .filter(m => tieneMedalla(row[CONFIG.COLUMNS[m.col]]))
        .map(m => {
            const raw      = row[CONFIG.COLUMNS[m.col]];
            const num      = parseInt(raw);
            const cantidad = (!isNaN(num) && num > 0) ? num : 1;
            return `<div class="medal-item ${m.clase}" title="${m.desc}"><span class="medal-icon">${m.icono}</span><span class="medal-count">${cantidad}</span></div>`;
        })
        .join('');
}

/**
 * Versión inline para ranking (ej: "💎2 🔷1 💚3").
 */
function getBadgesInline(row) {
    return TIPOS_MEDALLA
        .filter(m => tieneMedalla(row[CONFIG.COLUMNS[m.col]]))
        .map(m => {
            const raw      = row[CONFIG.COLUMNS[m.col]];
            const num      = parseInt(raw);
            const cantidad = (!isNaN(num) && num > 0) ? num : 1;
            return `${m.icono}${cantidad}`;
        })
        .join(' ');
}

window.TIPOS_MEDALLA   = TIPOS_MEDALLA;
window.tieneMedalla    = tieneMedalla;
window.getBadgesHtml   = getBadgesHtml;
window.getBadgesInline = getBadgesInline;