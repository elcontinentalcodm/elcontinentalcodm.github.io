/**
 * ADMIN.JS - 2 Niveles de Acceso
 *
 * VIEWER  → Logo (descargable), nombre, tag, trofeos, pts totales salas
 * MASTER  → Todo completo: pts desglosados, contactos, líderes, teléfonos, estado, exportar CSV
 *
 * Nota: el rol "editor" está reservado para uso futuro (ver renderTabla).
 */

let currentUser  = null;
let allData      = [];
let filteredData = [];
let contactMap   = {}; // { nombreClanNormalizado: {lider, tel, colider1, ...} } solo CEO

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnLogin').addEventListener('click', handleLogin);
    ['username','password'].forEach(id =>
        document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); })
    );
    const saved = sessionStorage.getItem('adminUser');
    if (saved) { currentUser = JSON.parse(saved); showDashboard(); }
});

/* ── LOGIN ── */
function handleLogin() {
    const user  = document.getElementById('username').value.trim();
    const pass  = document.getElementById('password').value;
    const err   = document.getElementById('loginError');
    const found = CONFIG.USERS.find(u => u.usuario === user && u.password === pass);
    if (found) {
        currentUser = { usuario: found.usuario, rol: found.rol, sheetUrl: found.sheetUrl };
        sessionStorage.setItem('adminUser', JSON.stringify(currentUser));
        err.style.display = 'none';
        showDashboard();
    } else {
        err.style.display = 'block';
        document.getElementById('password').value = '';
    }
}

/* ── DASHBOARD ── */
function showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminContainer').style.display = 'block';

    // Badge de rol
    const rolBadge = document.getElementById('rolBadge');
    const icons = { viewer: '👁️ Host de Sala', master: '👑 CEO' };
    rolBadge.textContent = icons[currentUser.rol] || currentUser.rol;
    rolBadge.className   = 'rol-badge rol-' + currentUser.rol;

    // Ocultar secciones según rol
    document.querySelectorAll('.only-master').forEach(el => {
        el.style.display = currentUser.rol === 'master' ? '' : 'none';
    });

    document.getElementById('btnLogout').addEventListener('click', () => {
        sessionStorage.removeItem('adminUser'); location.reload();
    });
    document.getElementById('btnRefresh').addEventListener('click', () => {
        clearCache(); loadAdminData();
    });
    document.getElementById('btnRefreshAsistencia')?.addEventListener('click', () => {
        loadAsistencia(true);
    });
    document.getElementById('searchInput').addEventListener('input', applyFilter);
    document.getElementById('filterEstado')?.addEventListener('change', applyFilter);
    document.getElementById('btnExportContacts')?.addEventListener('click', exportContacts);
    document.getElementById('btnExportPuntos')?.addEventListener('click', exportPuntos);

    // ── PESTAÑAS ──
    let asistenciaCargada = false;
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
            tab.classList.add('active');
            const panel = document.getElementById('panel-' + tab.dataset.tab);
            if (panel) panel.style.display = 'block';
            // Carga lazy de asistencia: solo la primera vez que se abre esa pestaña
            if (tab.dataset.tab === 'asistencia' && !asistenciaCargada) {
                asistenciaCargada = true;
                loadAsistencia();
            }
            if (tab.dataset.tab === 'contactos') renderContactos();
            if (tab.dataset.tab === 'top3') renderTop3();
            if (tab.dataset.tab === 'semanal') initSemanalTabs();
            if (tab.dataset.tab === 'sanciones') loadSanciones();
        });
    });

    document.getElementById('btnShareTop3')?.addEventListener('click', exportTop3AsImage);
    document.getElementById('btnRefreshTop3')?.addEventListener('click', renderTop3);
    document.getElementById('btnRefreshSemanal')?.addEventListener('click', () => {
        const activeSala = document.querySelector('.semanal-subtab.active')?.dataset.sala || 'alcatraz';
        loadSemanal(activeSala, true);
    });
    document.getElementById('btnRefreshSanciones')?.addEventListener('click', () => {
        _sancionesData = null;
        loadSanciones();
    });
    document.getElementById('sancionesFiltroSala')?.addEventListener('change', () => {
        renderSanciones(_sancionesData);
    });

    loadAdminData();
}

/* ── CARGAR DATOS ── */
async function loadAdminData() {
    try {
        // Si es CEO y hay URL de contactos, cargar ambas hojas en paralelo
        const isCEO = currentUser.rol === 'master';
        const promises = [fetchSheetData(currentUser.sheetUrl)];
        if (isCEO && CONFIG.CONTACTO_URL && CONFIG.CONTACTO_URL !== 'PEGA_AQUI_URL_CSV_DEL_FORM_DE_REGISTRO') {
            promises.push(fetchSheetData(CONFIG.CONTACTO_URL));
        }

        const [mainData, contactData] = await Promise.all(promises);
        allData = mainData;

        // Construir mapa de contactos: clave = nombre de clan en minúsculas
        contactMap = {};
        if (contactData) {
            const CC = CONFIG.CONTACTO_COLUMNS;
            contactData.forEach(row => {
                const key = (row[CC.NOMBRE_CLAN] || '').trim().toLowerCase();
                if (!key) return;
                // Guardar solo la fila más reciente (el array viene en orden, la última gana)
                contactMap[key] = {
                    lider:     row[CC.NOMBRE_LIDER]      || '',
                    telLider:  row[CC.TELEFONO_LIDER]    || '',
                    colider1:  row[CC.NOMBRE_COLIDER1]   || '',
                    telCo1:    row[CC.TELEFONO_COLIDER1]  || '',
                    colider2:  row[CC.NOMBRE_COLIDER2]   || '',
                    telCo2:    row[CC.TELEFONO_COLIDER2]  || '',
                    modo:      row[CC.MODO_JUEGO]         || '',
                };
            });
        }

        const active = filterActiveClans(allData);

        let trofeos = 0;
        allData.forEach(r => {
            trofeos += (parseInt(r[CONFIG.COLUMNS.ORO])    || 0)
                     + (parseInt(r[CONFIG.COLUMNS.PLATA])  || 0)
                     + (parseInt(r[CONFIG.COLUMNS.BRONCE]) || 0);
        });

        document.getElementById('totalClanes').textContent    = allData.length;
        document.getElementById('clanesActivos').textContent  = active.length;
        document.getElementById('totalJugadores').textContent = active.length * 4 + '+';
        document.getElementById('totalTrofeos').textContent   = trofeos;

        applyFilter();
        renderTop3(); // Actualizar Top 3 en cuanto llegue la data
        if (currentUser.rol === 'master') loadSancionesStats();
    } catch (err) {
        console.error(err);
        document.getElementById('tablaBody').innerHTML =
            `<tr><td colspan="20" class="loading-cell" style="color:#ff4d4d">❌ Error al cargar datos</td></tr>`;
    }
}

/* ── SANCIONES STATS ── */
async function loadSancionesStats() {
    const el = document.getElementById('totalSanciones');
    if (!el) return;
    try {
        // Cargar todas las hojas de salas en paralelo
        const urls = [
            CONFIG.SEMANAL_ALCATRAZ_URL,
            CONFIG.SEMANAL_ALCATRAZ2_URL,
            CONFIG.SEMANAL_ALCATRAZ_MASTER_URL,
            CONFIG.SEMANAL_ZGUERRA_URL,
            CONFIG.SEMANAL_ZLETAL_URL,
            CONFIG.SEMANAL_ZXTREME_URL,
        ];
        const results = await Promise.all(urls.map(u => fetchSheetData(u).catch(() => [])));
        // Col 27 = Jugador — contar filas con jugador no vacío
        let total = 0;
        results.forEach(data => {
            data.forEach(row => {
                if ((row[27] || '').toString().trim() !== '') total++;
            });
        });
        el.textContent = total;
        // Colorear el stat-card según cantidad
        const card = document.getElementById('statSanciones');
        if (card) {
            card.style.borderColor = total === 0
                ? 'rgba(0,200,100,0.4)'
                : total < 5 ? 'rgba(255,165,0,0.5)' : 'rgba(255,60,60,0.6)';
        }
    } catch (err) {
        console.error('Sanciones stats error:', err);
        el.textContent = '?';
    }
}

/* ── SANCIONES PANEL ── */
const SALAS_SANCIONES_CFG = {
    alcatraz:       { label: '🏟️ Alcatraz',        url: () => CONFIG.SEMANAL_ALCATRAZ_URL },
    alcatraz2:      { label: '🏟️ Alcatraz 2.0',    url: () => CONFIG.SEMANAL_ALCATRAZ2_URL },
    alcatrazmaster: { label: '⛓️ Alcatraz Master', url: () => CONFIG.SEMANAL_ALCATRAZ_MASTER_URL },
    zguerra:        { label: '⚔️ Zona de Guerra',  url: () => CONFIG.SEMANAL_ZGUERRA_URL },
    zletal:         { label: '💥 Zona Letal',      url: () => CONFIG.SEMANAL_ZLETAL_URL },
    zxtreme:        { label: '⚡ Zona Xtreme',     url: () => CONFIG.SEMANAL_ZXTREME_URL },
};
let _sancionesData = null; // cache: { alcatraz: [...], alcatraz2: [...], ... }

async function loadSanciones() {
    const wrapper = document.getElementById('sancionesWrapper');
    if (!wrapper) return;

    if (_sancionesData) { renderSanciones(_sancionesData); return; }

    wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⏳ Cargando sanciones de todas las salas...</p>';

    try {
        const keys = Object.keys(SALAS_SANCIONES_CFG);
        const results = await Promise.all(
            keys.map(k => fetchSheetData(SALAS_SANCIONES_CFG[k].url()).catch(() => []))
        );
        _sancionesData = {};
        keys.forEach((k, i) => { _sancionesData[k] = results[i]; });
        renderSanciones(_sancionesData);
    } catch (err) {
        console.error('Sanciones panel error:', err);
        wrapper.innerHTML = '<p style="color:#ff4d4d;text-align:center;padding:2rem">❌ No se pudieron cargar las sanciones.</p>';
    }
}

function renderSanciones(dataMap) {
    const wrapper = document.getElementById('sancionesWrapper');
    if (!wrapper || !dataMap) return;

    const filtro = document.getElementById('sancionesFiltroSala')?.value || 'all';
    const keys   = filtro === 'all' ? Object.keys(SALAS_SANCIONES_CFG) : [filtro];

    // Recopilar todas las sanciones con su sala
    const todas = [];
    keys.forEach(k => {
        const rows = dataMap[k] || [];
        rows.forEach(row => {
            if ((row[27] || '').toString().trim() !== '') {
                todas.push({
                    sala:      SALAS_SANCIONES_CFG[k]?.label || k,
                    equipo:    (row[26] || '—').toString().trim(),
                    jugador:   (row[27] || '—').toString().trim(),
                    fecha:     (row[28] || '—').toString().trim(),
                    motivo:    (row[29] || '—').toString().trim(),
                    pts:       parseFloat(row[30]) || 0,
                    diasSusp:  (row[31] || '—').toString().trim(),
                    regreso:   (row[32] || '—').toString().trim(),
                });
            }
        });
    });

    if (!todas.length) {
        wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:3rem">✅ Sin sanciones registradas' + (filtro !== 'all' ? ' en esta sala' : '') + '.</p>';
        return;
    }

    let tbodyHtml = '';
    todas.forEach(s => {
        const pts = s.pts;
        const ptsHtml = pts !== 0
            ? `<span style="color:#ff4d4d;font-weight:bold">${pts > 0 ? '-' + pts : pts}</span>`
            : '<span style="color:rgba(255,255,255,0.25)">—</span>';
        tbodyHtml += `<tr>
            <td><span class="semanal-sala-badge" style="font-size:0.72rem;padding:0.2rem 0.6rem">${s.sala}</span></td>
            <td style="text-align:center;font-weight:bold;color:var(--gold)">${s.equipo}</td>
            <td style="font-weight:600">${s.jugador}</td>
            <td style="text-align:center;color:var(--muted);font-size:0.85rem">${s.fecha}</td>
            <td style="max-width:220px">${s.motivo}</td>
            <td style="text-align:center">${ptsHtml}</td>
            <td style="text-align:center;color:#ffa500">${s.diasSusp}</td>
            <td style="text-align:center;color:#a8ff78">${s.regreso}</td>
        </tr>`;
    });

    wrapper.innerHTML = `
    <div class="semanal-info" style="margin-bottom:0.75rem">
        <span style="color:var(--muted);font-size:0.85rem">${todas.length} sanción${todas.length !== 1 ? 'es' : ''} encontrada${todas.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="semanal-table-wrap">
        <table class="semanal-table">
            <thead><tr>
                <th>Sala</th>
                <th style="text-align:center">Equipo</th>
                <th>Jugador</th>
                <th style="text-align:center">Fecha</th>
                <th>Motivo</th>
                <th style="text-align:center">Pts Restados</th>
                <th style="text-align:center">Días Susp.</th>
                <th style="text-align:center">Día Regreso</th>
            </tr></thead>
            <tbody>${tbodyHtml}</tbody>
        </table>
    </div>`;
}

/* ── ASISTENCIA ── */
async function loadAsistencia(forceRefresh = false) {
    const wrapper = document.getElementById('asistenciaWrapper');
    if (!wrapper) return;
    if (forceRefresh) {
        // Limpiar caché solo para la URL de asistencia
        const keyId = CONFIG.ASISTENCIA_URL.replace(/[^a-zA-Z0-9]/g, '').slice(-24);
        localStorage.removeItem('elcontinental_data_' + keyId);
        localStorage.removeItem('elcontinental_time_' + keyId);
    }
    wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⏳ Cargando asistencia...</p>';
    try {
        const data = await fetchSheetData(CONFIG.ASISTENCIA_URL);
        renderAsistencia(data, wrapper);
    } catch (err) {
        console.error('Asistencia error:', err);
        wrapper.innerHTML = '<p style="color:#ff4d4d;text-align:center;padding:2rem">❌ No se pudo cargar la hoja de asistencia.</p>';
    }
}

function renderAsistencia(data, wrapper) {
    if (!data || data.length === 0) {
        wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⚠️ La hoja de asistencia está vacía.</p>';
        return;
    }

    // parseCSV ya saltó la fila 1 (cabecera), así que TODAS las filas son clanes.
    // Generamos los números de día según la cantidad de columnas que tenga la primera fila.
    const rows = data.filter(r => r[0] && r[0].trim() !== '');
    const maxCols = Math.max(...rows.map(r => r.length)) - 1; // columnas de días
    const diasHeaders = Array.from({ length: maxCols }, (_, i) => i + 1); // [1, 2, ..., N]

    // Calcular resumen por clan
    const hoy = new Date();
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const mesLabel = `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;

    let thead = `<thead><tr>
        <th class="asist-th-clan">Clan</th>`;
    diasHeaders.forEach(d => {
        const n = parseInt(d);
        const esHoy = n === hoy.getDate();
        thead += `<th class="asist-th-dia${esHoy ? ' asist-hoy' : ''}">${isNaN(n) ? d : n}</th>`;
    });
    thead += `<th class="asist-th-total">Total</th></tr></thead>`;

    let tbody = '<tbody>';
    rows.forEach(row => {
        const clan   = row[0] || '—';
        const celdas = row.slice(1);
        let total = 0;
        let tds = '';
        diasHeaders.forEach((d, i) => {
            const val = (celdas[i] || '').trim();
            const presente = val !== '' && val !== '0' && val.toLowerCase() !== 'no' && val.toLowerCase() !== 'false';
            if (presente) total++;
            const hoyIdx = parseInt(d) === new Date().getDate();
            tds += `<td class="asist-celda ${presente ? 'asist-presente' : 'asist-ausente'}${hoyIdx ? ' asist-hoy-col' : ''}" title="${presente ? val : 'Ausente'}">${presente ? '✓' : ''}</td>`;
        });
        const pct = diasHeaders.length > 0 ? Math.round(total / diasHeaders.length * 100) : 0;
        tbody += `<tr>
            <td class="asist-td-clan">${clan}</td>
            ${tds}
            <td class="asist-td-total">${total}<span class="asist-pct">${pct}%</span></td>
        </tr>`;
    });
    tbody += '</tbody>';

    wrapper.innerHTML = `
        <div class="asistencia-mes">📅 ${mesLabel}</div>
        <div class="asistencia-scroll">
            <table class="asistencia-tabla">${thead}${tbody}</table>
        </div>`;
}

/* ── FILTRO ── */
function applyFilter() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const estado = document.getElementById('filterEstado')?.value || 'all';

    filteredData = allData.filter(r => {
        const nombre   = (r[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '').toLowerCase();
        const tag      = (r[CONFIG.COLUMNS.TAG_DEL_CLAN]    || '').toLowerCase();
        const id       = (r[CONFIG.COLUMNS.ID]          || '').toLowerCase();
        const activo   = (r[CONFIG.COLUMNS.ACTIVO]      || '').toLowerCase().trim();
        const isActive = activo === 'activo' || activo === 'si' || activo === 'sí';
        const matchSearch = !search || nombre.includes(search) || tag.includes(search) || id.includes(search);
        const matchEstado = estado === 'all'
            || (estado === 'active'   && isActive)
            || (estado === 'inactive' && !isActive);
        return matchSearch && matchEstado;
    });

    filteredData.sort((a, b) => calcPts(b) - calcPts(a));
    renderTabla(filteredData);
}

/* Alias local para puntos de salas */
const calcPts = calcularPuntos;

/* ── RENDERIZAR TABLA (dinámico según rol) ── */
function renderTabla(rows) {
    const tbody = document.getElementById('tablaBody');
    const rol   = currentUser.rol;

    // Cabeceras según rol
    let headers = `<tr>
        <th>#</th>
        <th>Logo</th>
        <th>Clan</th>
        <th>Tag</th>
        <th>Trofeos</th>
        <th>Pts Salas</th>`;
    if (rol === 'editor' || rol === 'master') {
        headers += `<th>Alcatraz</th><th>Alc 2.0</th><th>Alc Master</th><th>Z. Guerra</th><th>Z. Letal</th><th>Z. Xtreme</th>`;
    }
    if (rol === 'master') {
        headers += `<th>Líder</th><th>📞 Tel. Líder</th><th>Co-Líder 1</th><th>📞 Tel. Co1</th><th>Co-Líder 2</th><th>📞 Tel. Co2</th><th>Modo de Juego</th><th>Estado</th>`;
    }
    headers += `</tr>`;
    document.getElementById('tablaHead').innerHTML = headers;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="20" class="loading-cell">No se encontraron clanes</td></tr>`;
        return;
    }

    let html = '';
    rows.forEach((r, i) => {
        const pts    = calcPts(r);
        const oro    = parseInt(r[CONFIG.COLUMNS.ORO])          || 0;
        const plata  = parseInt(r[CONFIG.COLUMNS.PLATA])        || 0;
        const bronce = parseInt(r[CONFIG.COLUMNS.BRONCE])       || 0;
        const alc    = parseInt(r[CONFIG.COLUMNS.ALCATRAZ])        || 0;
        const alc2   = parseInt(r[CONFIG.COLUMNS.ALCATRAZ_2_0])    || 0;
        const alcm   = parseInt(r[CONFIG.COLUMNS.ALCATRAZ_MASTER]) || 0;
        const zg     = parseInt(r[CONFIG.COLUMNS.ZONA_DE_GUERRA])  || 0;
        const zl     = parseInt(r[CONFIG.COLUMNS.ZONA_LETAL])      || 0;
        const zx     = parseInt(r[CONFIG.COLUMNS.ZONA_XTREME])     || 0;
        const activo   = (r[CONFIG.COLUMNS.ACTIVO] || '').toLowerCase().trim();
        const isActive = activo === 'activo' || activo === 'si' || activo === 'sí';
        const clanId   = r[CONFIG.COLUMNS.ID]          || '';
        const nombre   = r[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '—';
        const tag      = r[CONFIG.COLUMNS.TAG_DEL_CLAN]    || '—';
        const logoUrl  = getLogoUrl(clanId, r[CONFIG.COLUMNS.LOGO]);

        const sc = (v, col) => v > 0
            ? `<td style="color:${col};font-weight:bold;text-align:center">${v}</td>`
            : `<td style="color:rgba(255,255,255,0.25);text-align:center">—</td>`;

        let row = `<tr>
            <td style="color:var(--gold);font-weight:bold;text-align:center">${i + 1}</td>
            <td>
                <div class="logo-cell">
                    <img src="${logoUrl}" alt="${nombre}" class="clan-logo-small"
                         onerror="this.src='logo/default.jpg'">
                    <button class="btn-dl" title="Descargar logo"
                        onclick="descargarLogo('${logoUrl}', '${(clanId || nombre).replace(/'/g, '')}')">⬇</button>
                </div>
            </td>
            <td style="font-weight:bold">${nombre}</td>
            <td style="color:var(--yellow-accent);font-weight:bold">${tag}</td>
            <td>
                <div class="medals-display">
                    <span style="color:#FFD700">🥇${oro}</span>
                    <span style="color:#C0C0C0">🥈${plata}</span>
                    <span style="color:#CD7F32">🥉${bronce}</span>
                    ${getBadgesHtml(r)}
                </div>
            </td>
            <td style="color:var(--gold);font-weight:bold;font-size:1.15rem;text-align:center">${pts}</td>`;

        if (rol === 'editor' || rol === 'master') {
            row += sc(alc,  '#e6f702');
            row += sc(alc2, '#e6f702');
            row += sc(alcm, '#e6f702');
            row += sc(zg,   '#e6f702');
            row += sc(zl,   '#e6f702');
            row += sc(zx,   '#e6f702');
        }

        if (rol === 'master') {
            // Buscar en el mapa de contactos por nombre de clan (insensible a mayúsculas)
            const cKey = nombre.trim().toLowerCase();
            const c    = contactMap[cKey] || {};
            const tel  = (t) => t ? `<a href="tel:${t}" style="color:rgba(255,255,255,0.7);font-size:0.85rem;text-decoration:none">${t}</a>` : '<span style="color:rgba(255,255,255,0.25)">—</span>';
            row += `
            <td>${c.lider    || '<span style="color:rgba(255,255,255,0.25)">—</span>'}</td>
            <td>${tel(c.telLider)}</td>
            <td>${c.colider1 || '<span style="color:rgba(255,255,255,0.25)">—</span>'}</td>
            <td>${tel(c.telCo1)}</td>
            <td>${c.colider2 || '<span style="color:rgba(255,255,255,0.25)">—</span>'}</td>
            <td>${tel(c.telCo2)}</td>
            <td style="color:var(--accent);font-weight:600">${c.modo || '<span style="color:rgba(255,255,255,0.25)">—</span>'}</td>
            <td>
                <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                    ${isActive ? '✅ Activo' : '⏳ Pendiente'}
                </span>
            </td>`;
        }

        row += `</tr>`;
        html += row;
    });
    tbody.innerHTML = html;
    // Renderizar la sección de gestión de medallas cada vez que se actualiza la tabla
    renderMedallasSection(rows);
}

/* ── CONTACTOS (solo CEO) ── */
function renderContactos(filtro) {
    const grid = document.getElementById('contactosGrid');
    if (!grid) return;

    // Si no hay URL configurada
    if (!CONFIG.CONTACTO_URL || CONFIG.CONTACTO_URL === 'PEGA_AQUI_URL_CSV_DEL_FORM_DE_REGISTRO') {
        grid.innerHTML = `<div class="contactos-aviso">⚙️ Configura <code>CONTACTO_URL</code> en <code>config-global.js</code> para ver los contactos.</div>`;
        return;
    }

    // Buscar sobre allData cruzado con contactMap
    const q = (filtro || document.getElementById('contactosSearch')?.value || '').toLowerCase();

    const clanes = allData
        .map(r => {
            const nombre = (r[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '').trim();
            const cKey   = nombre.toLowerCase();
            const c      = contactMap[cKey] || {};
            return { nombre, tag: r[CONFIG.COLUMNS.TAG_DEL_CLAN] || '', logo: getLogoUrl(r[CONFIG.COLUMNS.ID], r[CONFIG.COLUMNS.LOGO]), ...c };
        })
        .filter(c => !q
            || c.nombre.toLowerCase().includes(q)
            || (c.lider    || '').toLowerCase().includes(q)
            || (c.colider1 || '').toLowerCase().includes(q)
            || (c.colider2 || '').toLowerCase().includes(q)
            || (c.modo     || '').toLowerCase().includes(q)
        );

    if (!clanes.length) {
        grid.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">No se encontraron coincidencias.</p>';
        return;
    }

    // Bind del buscador (primera vez)
    const input = document.getElementById('contactosSearch');
    if (input && !input._bound) {
        input._bound = true;
        input.addEventListener('input', () => renderContactos(input.value));
    }

    const tel = (t, label) => t
        ? `<div class="cto-field"><span class="cto-lbl">${label}</span><a href="tel:${t}" class="cto-tel">📞 ${t}</a></div>`
        : `<div class="cto-field"><span class="cto-lbl">${label}</span><span class="cto-empty">—</span></div>`;
    const txt = (v, label) => `<div class="cto-field"><span class="cto-lbl">${label}</span><span class="cto-val">${v || '<span class="cto-empty">—</span>'}</span></div>`;

    grid.innerHTML = clanes.map(c => `
        <div class="cto-card">
            <div class="cto-card-top">
                <img src="${c.logo}" alt="${c.nombre}" class="cto-logo" onerror="this.src='logo/default.jpg'">
                <div class="cto-clan-info">
                    <span class="cto-nombre">${c.nombre}</span>
                    <span class="cto-tag">${c.tag}</span>
                    ${c.modo ? `<span class="cto-modo">${c.modo}</span>` : ''}
                </div>
            </div>
            <div class="cto-divider"></div>
            <div class="cto-contactos">
                <div class="cto-persona">
                    <span class="cto-rol">👑 Líder</span>
                    ${txt(c.lider, 'Nombre')}
                    ${tel(c.telLider, 'Teléfono')}
                </div>
                ${(c.colider1 || c.telCo1) ? `
                <div class="cto-persona">
                    <span class="cto-rol">⭐ Co-Líder 1</span>
                    ${txt(c.colider1, 'Nombre')}
                    ${tel(c.telCo1, 'Teléfono')}
                </div>` : ''}
                ${(c.colider2 || c.telCo2) ? `
                <div class="cto-persona">
                    <span class="cto-rol">⭐ Co-Líder 2</span>
                    ${txt(c.colider2, 'Nombre')}
                    ${tel(c.telCo2, 'Teléfono')}
                </div>` : ''}
            </div>
        </div>`).join('');
}
function exportContacts() {
    let csv = 'Pos,Clan,Tag,ID,Líder,Tel Líder,Co-Líder 1,Tel Co1,Co-Líder 2,Tel Co2,Modo de Juego,Estado,Pts Salas\n';
    filteredData.forEach((r, i) => {
        const actv = (r[CONFIG.COLUMNS.ACTIVO] || '').toLowerCase().trim();
        const a    = (actv === 'activo' || actv === 'si' || actv === 'sí' || actv === 'yes') ? 'Activo' : 'Pendiente';
        const cKey = (r[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '').trim().toLowerCase();
        const c    = contactMap[cKey] || {};
        csv += [i+1,
            `"${r[CONFIG.COLUMNS.NOMBRE_DE_CLAN]||''}"`,
            `"${r[CONFIG.COLUMNS.TAG_DEL_CLAN]||''}"`,
            r[CONFIG.COLUMNS.ID]||'',
            `"${c.lider    ||''}"`, `"${c.telLider||''}"`,
            `"${c.colider1 ||''}"`, `"${c.telCo1  ||''}"`,
            `"${c.colider2 ||''}"`, `"${c.telCo2  ||''}"`,
            `"${c.modo     ||''}"`,
            a, calcPts(r)].join(',') + '\n';
    });
    downloadCSV(csv, 'contactos_clanes.csv');
}

function exportPuntos() {
    let csv = 'Pos,Clan,Tag,Trofeos Oro,Trofeos Plata,Trofeos Bronce,Alcatraz,Alc2.0,Alc Master,Z.Guerra,Z.Letal,Z.Xtreme,Pts Total Salas\n';
    filteredData.forEach((r, i) => {
        csv += [i+1, `"${r[CONFIG.COLUMNS.NOMBRE_DE_CLAN]||''}"`, `"${r[CONFIG.COLUMNS.TAG_DEL_CLAN]||''}"`,
            parseInt(r[CONFIG.COLUMNS.ORO])||0, parseInt(r[CONFIG.COLUMNS.PLATA])||0, parseInt(r[CONFIG.COLUMNS.BRONCE])||0,
            parseInt(r[CONFIG.COLUMNS.ALCATRAZ])||0, parseInt(r[CONFIG.COLUMNS.ALCATRAZ_2_0])||0,
            parseInt(r[CONFIG.COLUMNS.ALCATRAZ_MASTER])||0,
            parseInt(r[CONFIG.COLUMNS.ZONA_DE_GUERRA])||0, parseInt(r[CONFIG.COLUMNS.ZONA_LETAL])||0,
            parseInt(r[CONFIG.COLUMNS.ZONA_XTREME])||0, calcPts(r)].join(',') + '\n';
    });
    downloadCSV(csv, 'puntos_clanes.csv');
}

function downloadCSV(content, filename) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
}

// ══════════════════════════════════════════════════════════════════════
// MEDALLAS ESPECIALES — leídas desde Google Sheets
// TIPOS_MEDALLA, tieneMedalla y getBadgesHtml viven en config-global.js
// y están disponibles en todas las páginas.
// ══════════════════════════════════════════════════════════════════════

/**
 * Renderiza la sección de medallas especiales (lectura desde hoja).
 * Solo muestra los clanes que tienen al menos una medalla activa.
 * Es solo de lectura — para cambiar medallas, edita Google Sheets.
 */
function renderMedallasSection(rows) {
    const grid = document.getElementById('medallasGrid');
    if (!grid) return;

    if (!rows || !rows.length) {
        grid.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">Carga los datos primero.</p>';
        return;
    }

    // Filtrar solo clanes con al menos una medalla activa en la hoja
    const conMedallas = rows.filter(r =>
        TIPOS_MEDALLA.some(m => tieneMedalla(r[CONFIG.COLUMNS[m.col]]))
    );

    if (!conMedallas.length) {
        grid.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⚠️ Ningún clan tiene medallas especiales aún. Agrega valores en las columnas P, Q o R de Google Sheets.</p>';
        return;
    }

    let html = '';
    conMedallas.forEach(r => {
        const id     = (r[CONFIG.COLUMNS.ID]             || '').trim();
        const nombre = (r[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '—').trim();
        const tag    = (r[CONFIG.COLUMNS.TAG_DEL_CLAN]   || '').trim();
        const logo   = getLogoUrl(id, r[CONFIG.COLUMNS.LOGO]);

        // Badges activos de este clan
        const badgesHtml = TIPOS_MEDALLA
            .filter(m => tieneMedalla(r[CONFIG.COLUMNS[m.col]]))
            .map(m => `<span class="badge-medalla ${m.clase}">${m.label}<br><small style="font-size:0.6rem;opacity:0.8">${m.desc}</small></span>`)
            .join('');

        html += `
        <div class="medalla-clan-card tiene-medallas">
            <img src="${logo}" alt="${nombre}" class="medalla-logo"
                 onerror="this.src='logo/default.jpg'">
            <div class="medalla-clan-info">
                <span class="medalla-clan-nombre">${nombre}</span>
                <span class="medalla-clan-tag">${tag}</span>
            </div>
            <div class="medalla-botones">${badgesHtml}</div>
        </div>`;
    });

    grid.innerHTML = html;
}

/* Descarga de logo compatible con CORS (fetch → blob) */
async function descargarLogo(logoUrl, nombreArchivo) {
    try {
        const resp = await fetch(logoUrl);
        if (!resp.ok) throw new Error('fetch failed');
        const blob = await resp.blob();
        const ext  = blob.type.includes('png') ? 'png' : 'jpg';
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${nombreArchivo}.${ext}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
    } catch {
        // Si falla CORS, abrir en nueva pestaña para que el usuario guarde manualmente
        window.open(logoUrl, '_blank');
    }
}

/* ══ TOP 3 MEDALLEROS ══ */
function calcMedallas(clan) {
    return (parseInt(clan[CONFIG.COLUMNS.ORO])    || 0)
         + (parseInt(clan[CONFIG.COLUMNS.PLATA])  || 0)
         + (parseInt(clan[CONFIG.COLUMNS.BRONCE]) || 0);
}

function renderTop3() {
    const cards = document.getElementById('top3Cards');
    if (!cards || !allData.length) {
        if (cards) cards.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⚠️ Primero carga los datos de clanes.</p>';
        return;
    }

    // Usar solo clanes activos (igual que index.html) y ordenar por medallas, desempate por puntos de salas
    const active = filterActiveClans(allData);
    const sorted = [...active].sort((a, b) =>
        calcMedallas(b) - calcMedallas(a) || calcPts(b) - calcPts(a)
    ).slice(0, 3);

    const medals = ['🥇', '🥈', '🥉'];
    const podioOrder = [1, 0, 2]; // plata, oro, bronce (orden visual: 2° izquierda, 1° centro, 3° derecha)
    const heights   = ['top3-plata', 'top3-oro', 'top3-bronce'];

    let html = '';
    podioOrder.forEach(idx => {
        const clan = sorted[idx];
        if (!clan) return;
        const nombre   = clan[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '—';
        const tag      = clan[CONFIG.COLUMNS.TAG_DEL_CLAN]   || '';
        const oro      = parseInt(clan[CONFIG.COLUMNS.ORO])    || 0;
        const plata    = parseInt(clan[CONFIG.COLUMNS.PLATA])  || 0;
        const bronce   = parseInt(clan[CONFIG.COLUMNS.BRONCE]) || 0;
        const total    = oro + plata + bronce;
        const logo     = getLogoUrl(clan[CONFIG.COLUMNS.ID], clan[CONFIG.COLUMNS.LOGO]);
        const pos      = idx + 1;

        html += `
        <div class="top3-card top3-pos${pos} ${heights[idx]}">
            <div class="top3-medal">${medals[idx]}</div>
            <div class="top3-clan-logo">
                <img src="${logo}" alt="${nombre}" onerror="this.src='${CONFIG.LOGO_DEFAULT}'">
            </div>
            <div class="top3-clan-nombre">${nombre}</div>
            <div class="top3-clan-tag">[${tag}]</div>
            <div class="top3-clan-pts">${total} <span class="top3-pts-label">medallas</span></div>
            <div class="top3-medallas-detalle">
                🥇 ${oro} &nbsp; 🥈 ${plata} &nbsp; 🥉 ${bronce}
            </div>
        </div>`;
    });

    cards.innerHTML = html;
}

async function exportTop3AsImage() {
    const podio = document.getElementById('top3Podio');
    if (!podio) return;

    const btn = document.getElementById('btnShareTop3');
    if (btn) { btn.textContent = '⏳ Generando...'; btn.disabled = true; }

    try {
        const canvas = await html2canvas(podio, {
            backgroundColor: '#1a1a1a',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
        });

        const link = document.createElement('a');
        link.download = 'top3-el-continental.png';
        link.href     = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('html2canvas error:', err);
        alert('❌ No se pudo generar la imagen. Verifica que los logos no bloqueen CORS.');
    } finally {
        if (btn) { btn.textContent = '📸 Compartir como imagen'; btn.disabled = false; }
    }
}

/* ══ PUNTOS SEMANALES (multi-sala) ══ */
const SALAS_SEMANAL = {
    alcatraz:       { label: '🏟️ Alcatraz',        url: () => CONFIG.SEMANAL_ALCATRAZ_URL },
    alcatraz2:      { label: '🏟️ Alcatraz 2.0',    url: () => CONFIG.SEMANAL_ALCATRAZ2_URL },
    alcatrazmaster: { label: '⛓️ Alcatraz Master', url: () => CONFIG.SEMANAL_ALCATRAZ_MASTER_URL },
    zguerra:        { label: '⚔️ Zona de Guerra',  url: () => CONFIG.SEMANAL_ZGUERRA_URL },
    zletal:         { label: '💥 Zona Letal',      url: () => CONFIG.SEMANAL_ZLETAL_URL },
    zxtreme:        { label: '⚡ Zona Xtreme',     url: () => CONFIG.SEMANAL_ZXTREME_URL },
};
const semanalCargado = {}; // { alcatraz: bool, alcatraz2: bool }

function initSemanalTabs() {
    document.querySelectorAll('.semanal-subtab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.semanal-subtab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.semanal-wrapper').forEach(w => w.style.display = 'none');
            btn.classList.add('active');
            const sala = btn.dataset.sala;
            const wrapper = document.getElementById('semanalWrapper-' + sala);
            if (wrapper) wrapper.style.display = '';
            loadSemanal(sala);
        });
    });
    // Cargar la primera sala al abrir la pestaña
    loadSemanal('alcatraz');

    // Botón compartir imagen
    document.getElementById('btnShareSemanal')?.addEventListener('click', compartirSemanalImagen);
}

async function compartirSemanalImagen() {
    // Verificar que html2canvas esté disponible
    if (typeof html2canvas === 'undefined') {
        alert('❌ El generador de imágenes no está disponible.\nVerifica tu conexión a internet y recarga la página.');
        return;
    }

    const activeSala = document.querySelector('.semanal-subtab.active')?.dataset.sala || 'alcatraz';
    const wrapper = document.getElementById('semanalWrapper-' + activeSala);
    if (!wrapper || !wrapper.children.length) {
        alert('⚠️ No hay datos cargados. Espera a que cargue la tabla primero.');
        return;
    }

    const btn = document.getElementById('btnShareSemanal');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Generando...';
    btn.disabled = true;

    try {
        // Clonar el wrapper en un contenedor aislado con fondo oscuro para la captura
        const clone = wrapper.cloneNode(true);
        clone.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:' + wrapper.offsetWidth + 'px;background:#0d0d0d;padding:16px;border-radius:12px;z-index:-1';
        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
            backgroundColor: '#0d0d0d',
            scale: 2,
            useCORS: false,
            allowTaint: true,
            logging: false,
            width: clone.offsetWidth,
            height: clone.scrollHeight,
            scrollX: 0,
            scrollY: 0,
        });

        document.body.removeChild(clone);

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error('El canvas generado está vacío (0x0)');
        }

        // Marca de agua
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 26px sans-serif';
        ctx.fillStyle = 'rgba(255,215,0,0.65)';
        ctx.textAlign = 'right';
        ctx.fillText('El Continental · CODM', canvas.width - 24, canvas.height - 16);

        const salaLabel = (document.querySelector('.semanal-subtab.active')?.textContent || activeSala)
            .trim().replace(/[^\w\s]/gu, '').trim().replace(/\s+/g, '-') || activeSala;
        const filename = 'resumen-semanal-' + salaLabel + '-' + new Date().toISOString().slice(0, 10) + '.png';

        // Obtener dataURL
        const dataUrl = canvas.toDataURL('image/png');
        if (!dataUrl || dataUrl === 'data:,') {
            throw new Error('No se pudo generar el dataURL (posible error de seguridad CORS)');
        }

        // Web Share API con archivo (móviles modernos)
        let compartido = false;
        if (typeof navigator.share === 'function') {
            try {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], filename, { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Resumen Semanal · El Continental' });
                    compartido = true;
                }
            } catch (e) {
                if (e.name === 'AbortError') compartido = true;
                // si falla el share, caer en descarga
            }
        }

        if (!compartido) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    } catch (err) {
        console.error('Error al generar imagen semanal:', err);
        alert('❌ Error al generar la imagen:\n' + err.message);
    }

    btn.innerHTML = originalText;
    btn.disabled = false;
}

async function loadSemanal(sala, forceRefresh = false) {
    const cfg     = SALAS_SEMANAL[sala];
    if (!cfg) return;
    const wrapper = document.getElementById('semanalWrapper-' + sala);
    if (!wrapper) return;

    if (forceRefresh) {
        const url   = cfg.url();
        const keyId = url.replace(/[^a-zA-Z0-9]/g, '').slice(-24);
        localStorage.removeItem('elcontinental_data_' + keyId);
        localStorage.removeItem('elcontinental_time_' + keyId);
        semanalCargado[sala] = false;
    }
    if (semanalCargado[sala] && !forceRefresh) return;

    wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⏳ Cargando ' + cfg.label + '...</p>';
    try {
        const data = await fetchSheetData(cfg.url());
        renderSemanalCompleto(data, wrapper, cfg.label);
        semanalCargado[sala] = true;
    } catch (err) {
        console.error('Semanal error (' + sala + '):', err);
        wrapper.innerHTML = '<p style="color:#ff4d4d;text-align:center;padding:2rem">❌ No se pudo cargar la hoja de ' + cfg.label + '.</p>';
    }
}

function renderSemanal(data, wrapper, salaLabel) {
    if (!data || !data.length) {
        wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⚠️ La hoja de puntos semanales está vacía.</p>';
        return;
    }

    // Fila de sala: col 1 es una fecha DD/MM
    const salaRow = data.find(r => /^\d{2}\/\d{2}$/.test((r[1] || '').trim()));
    // Fila de cabecera de columnas: contiene "Total"
    const headRow = data.find(r => r.some(c => (c || '').trim().toLowerCase() === 'total'));

    if (!salaRow) {
        // Fallback: la hoja tiene un formato diferente — renderizar tabla genérica
        renderSemanalGenerico(data, wrapper, salaLabel);
        return;
    }

    const salaName = (salaRow[0] || '').trim();
    const totalIdx = headRow ? headRow.findIndex(c => (c || '').trim().toLowerCase() === 'total') : -1;
    // Número de columnas de sesión (entre la col del clan y la col Total)
    const numSessions = totalIdx > 1 ? totalIdx - 1 : salaRow.filter((c, i) => i > 0 && (c || '').trim()).length;

    // Filas de clanes: col 0 no vacía, no es la fila de sala, no de cabecera, no "lista de espera"
    const skipSet = new Set([
        (salaRow[0] || '').toLowerCase(),
        headRow ? (headRow[0] || '').toLowerCase() : '',
    ]);
    const clanRows = data.filter(r => {
        const name = (r[0] || '').trim();
        if (!name) return false;
        if (skipSet.has(name.toLowerCase())) return false;
        if (/lista de espera/i.test(name)) return false;
        if (/^[-–—]$/.test(name)) return false;
        return true;
    });

    if (!clanRows.length) {
        wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⚠️ No hay clanes en la hoja esta semana.</p>';
        return;
    }

    // Parsear cada clan
    const clanes = clanRows.map(r => {
        const nombre = (r[0] || '').trim();
        const sessions = [];
        for (let i = 1; i <= numSessions; i++) {
            sessions.push(parseFloat(r[i]) || 0);
        }
        const total = totalIdx > 0
            ? (parseFloat(r[totalIdx]) || 0)
            : sessions.reduce((s, v) => s + v, 0);
        return { nombre, sessions, total };
    }).sort((a, b) => b.total - a.total);

    // Etiqueta de semana (rango de fechas únicas)
    const dates = [];
    for (let i = 1; i <= numSessions; i++) {
        const d = (salaRow[i] || '').trim();
        if (d && !dates.includes(d)) dates.push(d);
    }
    const weekLabel = dates.length
        ? `Semana del ${dates[0]} al ${dates[dates.length - 1]}`
        : '';

    // Cabeceras de sesión: fecha (salaRow) + día (headRow)
    let thSessions = '';
    for (let i = 1; i <= numSessions; i++) {
        const date = (salaRow[i] || '').trim();
        const day  = headRow ? (headRow[i] || '').trim() : '';
        thSessions += `<th class="semanal-th-sesion" title="${date} ${day}">${day}<br><small>${date}</small></th>`;
    }

    // Filas de clanes
    let tbodyHtml = '';
    clanes.forEach((c, idx) => {
        const rank    = idx + 1;
        const rankCls = rank === 1 ? 'semanal-rank-1' : rank === 2 ? 'semanal-rank-2' : rank === 3 ? 'semanal-rank-3' : '';
        const medal   = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        let tdSessions = '';
        c.sessions.forEach(pts => {
            const cls = pts > 0 ? 'semanal-pts-activo' : 'semanal-pts-vacio';
            tdSessions += `<td class="semanal-td-sesion ${cls}">${pts > 0 ? pts : '—'}</td>`;
        });
        tbodyHtml += `
        <tr class="${rankCls}">
            <td class="semanal-td-rank">${medal || '#' + rank}</td>
            <td class="semanal-td-nombre">${c.nombre}</td>
            ${tdSessions}
            <td class="semanal-td-total">${c.total}</td>
        </tr>`;
    });

    wrapper.innerHTML = `
    <div class="semanal-info">
        <span class="semanal-sala-badge">🏟️ ${salaName}</span>
        <span class="semanal-week-label">📅 ${weekLabel}</span>
        <span class="semanal-clanes-count">${clanes.length} clanes</span>
    </div>
    <div class="semanal-table-wrap">
        <table class="semanal-table">
            <thead>
                <tr>
                    <th class="semanal-th-rank">#</th>
                    <th class="semanal-th-nombre">Clan</th>
                    ${thSessions}
                    <th class="semanal-th-total">Total</th>
                </tr>
            </thead>
            <tbody>${tbodyHtml}</tbody>
        </table>
    </div>`;
}

/* ── FALLBACK: estructura diferente ── */
function renderSemanalGenerico(data, wrapper, salaLabel) {
    if (!data || !data.length) {
        wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⚠️ La hoja de ' + salaLabel + ' está vacía.</p>';
        return;
    }

    // Intentar detectar la fila de cabecera (la que tiene más celdas no vacías)
    const headerRow = data[0] || [];
    const thCells = headerRow.map((h, i) => `<th class="${i === 0 ? 'semanal-th-nombre' : 'semanal-th-sesion'}">${h || ('Col ' + (i + 1))}</th>`).join('');

    // Filas de datos (omitir cabecera)
    const bodyRows = data.slice(1).filter(r => r.some(c => (c || '').trim()));
    if (!bodyRows.length) {
        wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⚠️ No hay datos en la hoja de ' + salaLabel + '.</p>';
        return;
    }

    let tbodyHtml = '';
    bodyRows.forEach((r, idx) => {
        const tds = headerRow.map((_, i) => {
            const val = (r[i] || '').trim();
            const isNum = val !== '' && !isNaN(parseFloat(val));
            const cls = i === 0 ? 'semanal-td-nombre' : (isNum && parseFloat(val) > 0 ? 'semanal-td-total' : 'semanal-pts-vacio');
            return `<td class="${cls}">${val || (i > 0 ? '—' : '')}</td>`;
        }).join('');
        const rankCls = idx === 0 ? 'semanal-rank-1' : idx === 1 ? 'semanal-rank-2' : idx === 2 ? 'semanal-rank-3' : '';
        tbodyHtml += `<tr class="${rankCls}">${tds}</tr>`;
    });

    wrapper.innerHTML = `
    <div class="semanal-info">
        <span class="semanal-sala-badge">⛓️ ${salaLabel}</span>
        <span class="semanal-clanes-count">${bodyRows.length} filas</span>
        <span style="color:var(--muted);font-size:0.8rem">⚠️ Formato de hoja diferente — vista genérica</span>
    </div>
    <div class="semanal-table-wrap">
        <table class="semanal-table">
            <thead><tr>${thCells}</tr></thead>
            <tbody>${tbodyHtml}</tbody>
        </table>
    </div>`;
}

/* ══ ALCATRAZ MASTER — 3 tablas ══
   TABLA 1 (resultados por día): 0=Equipo 1=Día 2=Posición 3=PtsPosición 4=Kills 5=PtsKills 6=Bonus 7=Sanción 8=TotalDía
   TABLA 2 (resumen semanal):   17=Equipo 18=Lunes 19=Martes 20=Miércoles 21=Jueves 22=Viernes 23=TotalSemanal
   TABLA 3 (sanciones):         26=Equipo 27=Jugador 28=Fecha 29=Motivo 30=PtsRestados 31=DíasSuspendido 32=DíaRegreso
*/
function renderSemanalCompleto(data, wrapper, salaLabel) {
    if (!data || !data.length) {
        wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⚠️ La hoja de ' + salaLabel + ' está vacía.</p>';
        return;
    }

    // ── TABLA 1: resultados diarios ──────────────────────────────
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const porDia = {};
    dias.forEach(d => porDia[d] = []);

    data.forEach(row => {
        const dia = (row[1] || '').trim();
        // normalizar encoding
        const diaKey = dias.find(d => d.toLowerCase() === dia.toLowerCase()
            || dia.replace(/[^a-zA-Z]/g,'').toLowerCase() === d.replace(/[^a-zA-Z]/g,'').toLowerCase());
        if (diaKey) porDia[diaKey].push(row);
    });

    let diaTabsHtml = dias.map((d, i) =>
        `<button class="alc-master-day-tab${i === 0 ? ' active' : ''}" data-dia="${d}">${d}</button>`
    ).join('');

    let tabla1Panels = '';
    dias.forEach((dia, idx) => {
        const filas = porDia[dia];
        let tbodyT1 = '';
        if (filas.length) {
            const sorted = [...filas].sort((a, b) => (parseFloat(b[8]) || 0) - (parseFloat(a[8]) || 0));
            sorted.forEach((r, i) => {
                const total   = parseFloat(r[8]) || 0;
                const sancion = parseFloat(r[7]) || 0;
                const rankCls = i === 0 ? 'semanal-rank-1' : i === 1 ? 'semanal-rank-2' : i === 2 ? 'semanal-rank-3' : '';
                const medal   = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
                const sanHtml = sancion !== 0
                    ? `<span style="color:#ff4d4d;font-weight:bold">${sancion < 0 ? sancion : '-' + sancion}</span>`
                    : '<span style="color:rgba(255,255,255,0.25)">—</span>';
                tbodyT1 += `<tr class="${rankCls}">
                    <td class="semanal-td-rank">${medal}</td>
                    <td style="text-align:center;font-weight:bold">${r[0] || '—'}</td>
                    <td style="text-align:center">${r[2] || '—'}</td>
                    <td style="text-align:center;color:var(--gold)">${r[3] || '0'}</td>
                    <td style="text-align:center">${r[4] || '—'}</td>
                    <td style="text-align:center;color:#4ecdc4">${r[5] || '0'}</td>
                    <td style="text-align:center;color:#a8ff78">${(r[6] || '').trim() || '—'}</td>
                    <td style="text-align:center">${sanHtml}</td>
                    <td class="semanal-td-total">${total}</td>
                </tr>`;
            });
        } else {
            tbodyT1 = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:1rem">Sin datos para este día</td></tr>';
        }

        tabla1Panels += `
        <div class="alc-master-day-panel${idx === 0 ? '' : ' alc-hidden'}" data-dia="${dia}">
            <div class="semanal-table-wrap" style="margin-top:0">
                <table class="semanal-table">
                    <thead><tr>
                        <th class="semanal-th-rank">#</th>
                        <th style="text-align:center">Equipo</th>
                        <th style="text-align:center">Posición</th>
                        <th style="text-align:center">Pts Pos.</th>
                        <th style="text-align:center">Kills</th>
                        <th style="text-align:center">Pts Kills</th>
                        <th style="text-align:center">Bonus</th>
                        <th style="text-align:center">Sanción</th>
                        <th class="semanal-th-total">Total</th>
                    </tr></thead>
                    <tbody>${tbodyT1}</tbody>
                </table>
            </div>
        </div>`;
    });

    // ── TABLA 2: resumen semanal ─────────────────────────────────
    const semRows = data.filter(r => (r[17] || '').toString().trim() !== '' && !isNaN(parseInt(r[17])));
    let tbodyT2 = '';
    if (semRows.length) {
        const sorted2 = [...semRows].sort((a, b) => (parseFloat(b[23]) || 0) - (parseFloat(a[23]) || 0));
        sorted2.forEach((r, i) => {
            const rankCls = i === 0 ? 'semanal-rank-1' : i === 1 ? 'semanal-rank-2' : i === 2 ? 'semanal-rank-3' : '';
            const medal   = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
            const cell = v => {
                const n = parseFloat(v) || 0;
                return n > 0
                    ? `<td class="semanal-td-sesion semanal-pts-activo" style="text-align:center">${n}</td>`
                    : `<td class="semanal-pts-vacio" style="text-align:center">—</td>`;
            };
            tbodyT2 += `<tr class="${rankCls}">
                <td class="semanal-td-rank">${medal}</td>
                <td style="text-align:center;font-weight:bold">${r[17]}</td>
                ${cell(r[18])}${cell(r[19])}${cell(r[20])}${cell(r[21])}${cell(r[22])}
                <td class="semanal-td-total">${parseFloat(r[23]) || 0}</td>
            </tr>`;
        });
    } else {
        tbodyT2 = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:1rem">Sin datos semanales aún</td></tr>';
    }

    // ── TABLA 3: sanciones ───────────────────────────────────────
    const sanRows = data.filter(r => (r[27] || '').toString().trim() !== '');
    let tbodyT3 = '';
    if (sanRows.length) {
        sanRows.forEach(r => {
            const pts = parseFloat(r[30]) || 0;
            tbodyT3 += `<tr>
                <td style="text-align:center;font-weight:bold;color:var(--gold)">${r[26] || '—'}</td>
                <td style="font-weight:600">${r[27] || '—'}</td>
                <td style="text-align:center;color:var(--muted)">${r[28] || '—'}</td>
                <td>${r[29] || '—'}</td>
                <td style="text-align:center;color:#ff4d4d;font-weight:bold">${pts !== 0 ? (pts > 0 ? '-' + pts : pts) : '—'}</td>
                <td style="text-align:center;color:#ffa500">${r[31] || '—'}</td>
                <td style="text-align:center;color:#a8ff78">${r[32] || '—'}</td>
            </tr>`;
        });
    } else {
        tbodyT3 = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:1rem">✅ Sin sanciones registradas</td></tr>';
    }

    // ── RENDER FINAL ─────────────────────────────────────────────
    wrapper.innerHTML = `
    <div class="semanal-info">
        <span class="semanal-sala-badge">${salaLabel}</span>
        <span class="semanal-clanes-count">${semRows.length} equipos</span>
    </div>

    <!-- 3 pestañas principales -->
    <div class="alc-master-main-tabs">
        <button class="alc-master-main-tab active" data-panel="resultados">📋 Resultados</button>
        <button class="alc-master-main-tab" data-panel="semanal">📊 Resumen Semanal</button>
        <button class="alc-master-main-tab" data-panel="sanciones">🚫 Sanciones</button>
    </div>

    <!-- Panel: Resultados por día -->
    <div class="alc-master-main-panel" data-panel="resultados">
        <div class="alc-master-day-tabs">${diaTabsHtml}</div>
        ${tabla1Panels}
    </div>

    <!-- Panel: Resumen semanal -->
    <div class="alc-master-main-panel alc-hidden" data-panel="semanal">
        <div class="semanal-table-wrap" style="margin-top:0">
            <table class="semanal-table">
                <thead><tr>
                    <th class="semanal-th-rank">#</th>
                    <th style="text-align:center">Equipo</th>
                    <th class="semanal-th-sesion">Lunes</th>
                    <th class="semanal-th-sesion">Martes</th>
                    <th class="semanal-th-sesion">Miércoles</th>
                    <th class="semanal-th-sesion">Jueves</th>
                    <th class="semanal-th-sesion">Viernes</th>
                    <th class="semanal-th-total">Total Semanal</th>
                </tr></thead>
                <tbody>${tbodyT2}</tbody>
            </table>
        </div>
    </div>

    <!-- Panel: Sanciones -->
    <div class="alc-master-main-panel alc-hidden" data-panel="sanciones">
        <div class="semanal-table-wrap" style="margin-top:0">
            <table class="semanal-table">
                <thead><tr>
                    <th style="text-align:center">Equipo</th>
                    <th>Jugador</th>
                    <th style="text-align:center">Fecha</th>
                    <th>Motivo</th>
                    <th style="text-align:center">Pts Restados</th>
                    <th style="text-align:center">Días Susp.</th>
                    <th style="text-align:center">Día Regreso</th>
                </tr></thead>
                <tbody>${tbodyT3}</tbody>
            </table>
        </div>
    </div>`;

    // Pestañas principales (Resultados / Semanal / Sanciones)
    wrapper.querySelectorAll('.alc-master-main-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            wrapper.querySelectorAll('.alc-master-main-tab').forEach(b => b.classList.remove('active'));
            wrapper.querySelectorAll('.alc-master-main-panel').forEach(p => p.classList.add('alc-hidden'));
            btn.classList.add('active');
            const panel = wrapper.querySelector(`.alc-master-main-panel[data-panel="${btn.dataset.panel}"]`);
            if (panel) panel.classList.remove('alc-hidden');
        });
    });

    // Sub-tabs de día dentro de Resultados
    wrapper.querySelectorAll('.alc-master-day-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            wrapper.querySelectorAll('.alc-master-day-tab').forEach(b => b.classList.remove('active'));
            wrapper.querySelectorAll('.alc-master-day-panel').forEach(p => p.classList.add('alc-hidden'));
            btn.classList.add('active');
            const panel = wrapper.querySelector(`.alc-master-day-panel[data-dia="${btn.dataset.dia}"]`);
            if (panel) panel.classList.remove('alc-hidden');
        });
    });
}