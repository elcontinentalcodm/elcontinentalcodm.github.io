/**
 * RANKING.JS
 * General → hoja de registro (formulario).
 * Cada sala → su hoja semanal propia.
 */

const SALAS_RANKING_CFG = {
    'Alcatraz':        { url: () => CONFIG.SEMANAL_ALCATRAZ_URL,        icon: '🏙️' },
    'Alcatraz 2.0':    { url: () => CONFIG.SEMANAL_ALCATRAZ2_URL,       icon: '🏙️' },
    'Alcatraz Master': { url: () => CONFIG.SEMANAL_ALCATRAZ_MASTER_URL, icon: '⛓️' },
    'ZONA DE GUERRA 8': { url: () => CONFIG.SEMANAL_ZGUERRA_URL,        icon: '⚔️' },
    'ZONA LETAL 9':     { url: () => CONFIG.SEMANAL_ZLETAL_URL,         icon: '💥' },
    'ZONA XTREME 9':    { url: () => CONFIG.SEMANAL_ZXTREME_URL,        icon: '⚡' },
    'ISOLATED 7':      { url: () => CONFIG.SEMANAL_ISOLATED7_URL,       icon: '🔒' },
    'ISOLATED 8':      { url: () => CONFIG.SEMANAL_ISOLATED8_URL,       icon: '🔒' },
    'ISOLATED 9':      { url: () => CONFIG.SEMANAL_ISOLATED9_URL,       icon: '🔒' },
    'ISOLATED 10':     { url: () => CONFIG.SEMANAL_ISOLATED10_URL,      icon: '🔒' },
};

document.addEventListener('DOMContentLoaded', function () { initRanking(); initHamburger(); });

async function initRanking() {
    const container  = document.getElementById('rankingContainer');
    const filterBtns = document.querySelectorAll('.filtro-btn');
    try {
        const [data, semMap] = await Promise.all([fetchSheetData(), buildSemMap()]);
        const active  = filterActiveClans(data);
        if (active.length === 0) { container.innerHTML = '<div class="error-message">No hay clanes registrados aún</div>'; return; }
        const rankings = prepareRankings(active, semMap);
        displayRanking(rankings, 'general', container);
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const sala = btn.getAttribute('data-sala');
                if (sala === 'general') {
                    displayRanking(rankings, 'general', container);
                } else {
                    displaySalaRanking(sala, container);
                }
            });
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="error-message">❌ Error al cargar los datos</div>`;
    }
}

async function displaySalaRanking(sala, container) {
    const cfg = SALAS_RANKING_CFG[sala];
    if (!cfg) return;
    container.innerHTML = `<div class="loading-message">⏳ Cargando ${sala}...</div>`;
    try {
        const data = await fetchSheetData(cfg.url());
        const rows = data.filter(r => (r[17] || '').toString().trim() !== '');
        if (!rows.length) {
            container.innerHTML = `<div class="error-message">Sin datos para ${sala} esta semana</div>`;
            return;
        }
        // Cada fila es un equipo independiente (no se fusionan aunque compartan nombre)
        const sorted = rows
            .map(r => ({ nombre: (r[17] || '').trim(), puntos: parseFloat(r[23]) || 0 }))
            .filter(e => e.nombre)
            .sort((a, b) => b.puntos - a.puntos);
        const medals = ['🥇', '🥈', '🥉'];
        let html = '';
        sorted.forEach((clan, i) => {
            const pos      = i + 1;
            const topCl    = pos <= 3 ? `top-${pos}` : '';
            const posLabel = medals[i] || pos;
            html += `
            <div class="ranking-item no-logo ${topCl}">
                <div class="ranking-posicion">${posLabel}</div>
                <div class="ranking-info">
                    <div class="ranking-nombre">${clan.nombre}</div>
                    <div class="ranking-sala">${cfg.icon} ${sala} · Semana actual</div>
                </div>
                <div class="ranking-puntos">
                    <div class="ranking-score">${clan.puntos}</div>
                    <div class="ranking-label">puntos</div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="error-message">❌ Error al cargar ${sala}</div>`;
    }
}

function prepareRankings(clans, semMap) {
    semMap = semMap || {};
    const R = { 'general': [] };
    clans.forEach(row => {
        const base = {
            nombre: row[CONFIG.COLUMNS.NOMBRE_DE_CLAN],
            tag:    row[CONFIG.COLUMNS.TAG_DEL_CLAN],
            logo:   getLogoUrl(row[CONFIG.COLUMNS.ID], row[CONFIG.COLUMNS.LOGO])
        };
        const oro    = parseInt(row[CONFIG.COLUMNS.ORO])    || 0;
        const plata  = parseInt(row[CONFIG.COLUMNS.PLATA])  || 0;
        const bronce = parseInt(row[CONFIG.COLUMNS.BRONCE]) || 0;

        // Buscar puntos en el semMap por nombre del clan o nombre del equipo (col 11)
        const k1  = _findSem(row[CONFIG.COLUMNS.NOMBRE_DE_CLAN], semMap);
        const k2  = _findSem(row[11], semMap);
        const sem = semMap[k1] || semMap[k2] || { alc:0, alc2:0, alcm:0, zg:0, zl:0, zx:0 };
        const total = sem.alc + sem.alc2 + sem.alcm + sem.zg + sem.zl + sem.zx;

        const logrosInline = getBadgesInline(row) || null;

        R['general'].push({
            ...base, puntos: total, sala: 'General',
            extra:  (oro || plata || bronce) ? `🥇${oro} 🥈${plata} 🥉${bronce}` : null,
            logros: logrosInline
        });
    });
    Object.keys(R).forEach(k => R[k].sort((a, b) => b.puntos - a.puntos));
    return R;
}

function displayRanking(rankings, sala, container) {
    const items = rankings[sala];
    if (!items || items.length === 0) {
        container.innerHTML = `<div class="error-message">No hay clanes con puntos en ${sala}</div>`; return;
    }
    let html = '';
    items.forEach((clan, i) => {
        const pos = i + 1;
        const topCl   = pos <= 3 ? `top-${pos}` : '';
        const posLabel = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;
        html += `
        <div class="ranking-item ${topCl}">
            <div class="ranking-posicion">${posLabel}</div>
            <img src="${clan.logo}" alt="${clan.nombre}" class="ranking-logo"
                 onerror="this.src='logo/default.jpg'">
            <div class="ranking-info">
                <div class="ranking-nombre">${clan.nombre}</div>
                <div class="ranking-tag">${clan.tag}</div>
                <div class="ranking-sala">${clan.sala}${clan.extra ? ' · ' + clan.extra : ''}</div>
                ${clan.logros ? `<div class="ranking-logros"><span class="ranking-logros-label">🏆 Logros:</span> ${clan.logros}</div>` : ''}
            </div>
            <div class="ranking-puntos">
                <div class="ranking-score">${clan.puntos}</div>
                <div class="ranking-label">puntos</div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}