/**
 * CLANES.JS - Sección pública
 * - Sin nombre de líder
 * - Puntos = salas (leídos desde hojas semanales, cruzados por nombre)
 * - Trofeos = decorativos
 */

document.addEventListener('DOMContentLoaded', function () { initClanes(); initHamburger(); });

let _todosLosClanes = [];
let _filtroTrofeo   = 'todos';

async function initClanes() {
    const container = document.getElementById('clanesContainer');
    try {
        // Cargar hoja principal + hojas semanales en paralelo
        const [mainData, semMap] = await Promise.all([fetchSheetData(CONFIG.CLANES_URL), buildSemMap()]);

        const active = filterActiveClans(mainData);
        if (active.length === 0) { container.innerHTML = '<div class="no-clanes">No hay clanes registrados aún</div>'; return; }
        _todosLosClanes = processClansData(active, semMap);
        aplicarFiltros(container);
        const countEl = document.getElementById('clanesCount');
        if (countEl) countEl.textContent = `${_todosLosClanes.length} clanes registrados y compitiendo`;

        // Buscador
        const searchInput = document.getElementById('clanSearch');
        if (searchInput) searchInput.addEventListener('input', () => aplicarFiltros(container));

        // Botones de trofeo
        document.querySelectorAll('.clanes-filtros .filtro-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.clanes-filtros .filtro-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                _filtroTrofeo = btn.getAttribute('data-trofeo');
                aplicarFiltros(container);
            });
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="error-clanes">❌ Error al cargar los datos</div>';
    }
}

function aplicarFiltros(container) {
    const q        = (document.getElementById('clanSearch')?.value || '').trim().toLowerCase();
    const resultado = document.getElementById('clanesResultado');
    const hayBusqueda = q.length > 0;

    let lista = _todosLosClanes.filter(c => {
        // Filtro trofeo
        if (_filtroTrofeo === 'oro')    return c.oro    > 0;
        if (_filtroTrofeo === 'plata')  return c.plata  > 0;
        if (_filtroTrofeo === 'bronce') return c.bronce > 0;
        return true;
    });

    // Ordenar según el filtro activo (por defecto: ID ascendente)
    if (_filtroTrofeo === 'oro')         lista = lista.sort((a, b) => b.oro    - a.oro    || parseInt(a.id) - parseInt(b.id));
    else if (_filtroTrofeo === 'plata')  lista = lista.sort((a, b) => b.plata  - a.plata  || parseInt(a.id) - parseInt(b.id));
    else if (_filtroTrofeo === 'bronce') lista = lista.sort((a, b) => b.bronce - a.bronce || parseInt(a.id) - parseInt(b.id));
    else lista = lista.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    // Filtro búsqueda encima
    if (hayBusqueda) {
        lista = lista.filter(c =>
            c.nombre.toLowerCase().includes(q) ||
            c.tag.toLowerCase().includes(q) ||
            String(c.id).toLowerCase().includes(q)
        );
    }

    const esFiltrado = hayBusqueda || _filtroTrofeo !== 'todos';
    displayClanes(lista, container, esFiltrado);

    if (resultado) {
        if (!esFiltrado) { resultado.textContent = ''; return; }
        resultado.textContent = lista.length
            ? `${lista.length} clan${lista.length !== 1 ? 'es' : ''} encontrado${lista.length !== 1 ? 's' : ''}`
            : 'No se encontró ningún clan';
    }
}

function processClansData(data, semMap) {
    return data.map(row => {
        const oro    = parseInt(row[CONFIG.CLANES_COLUMNS.ORO])    || 0;
        const plata  = parseInt(row[CONFIG.CLANES_COLUMNS.PLATA])  || 0;
        const bronce = parseInt(row[CONFIG.CLANES_COLUMNS.BRONCE]) || 0;

        // Buscar en mapa semanal por nombre del clan
        const k1 = _findSem(row[CONFIG.CLANES_COLUMNS.NOMBRE_DE_CLAN], semMap);
        const sem = semMap[k1] || { alc:0, alc2:0, alcm:0, zg:0, zl:0, zx:0 };

        const alc  = sem.alc;
        const alc2 = sem.alc2;
        const alcm = sem.alcm;
        const zg   = sem.zg;
        const zl   = sem.zl;
        const zx   = sem.zx;
        const total = alc + alc2 + alcm + zg + zl + zx;
        return {
            nombre: row[CONFIG.CLANES_COLUMNS.NOMBRE_DE_CLAN],
            tag:    row[CONFIG.CLANES_COLUMNS.TAG_DEL_CLAN],
            logo:   getLogoUrl(row[CONFIG.CLANES_COLUMNS.ID], row[CONFIG.CLANES_COLUMNS.LOGO]),
            id:     row[CONFIG.CLANES_COLUMNS.ID] || '—',
            // SIN lider (sección pública)
            oro, plata, bronce,
            salas: { alc, alc2, alcm, zg, zl, zx },
            total,
            // Medallas especiales desde la hoja (vacío si no tiene ninguna)
            badges: getBadgesHtml(row)
        };
    }).sort((a, b) => parseInt(a.id) - parseInt(b.id));
}

function displayClanes(clans, container, buscando = false) {
    if (clans.length === 0) {
        container.innerHTML = '<div class="no-clanes">😕 No se encontró ningún clan con ese criterio</div>';
        return;
    }
    let html = '';
    clans.forEach((clan, i) => {
        const rank = buscando ? '—' : i + 1;
        html += `
        <div class="clan-card">
            <div class="clan-header">
                <div class="clan-rank">#${rank}</div>
                <img src="${clan.logo}" alt="${clan.nombre}" class="clan-logo"
                     onerror="this.src='logo/default.jpg'">
                <div class="clan-info">
                    <h3 class="clan-nombre">${clan.nombre}</h3>
                    <p class="clan-tag">${clan.tag}</p>
                    <p class="clan-id">ID: ${clan.id}</p>
                </div>
            </div>

            <!-- Trofeos: Oro, Plata y Bronce -->
            <div class="clan-trofeos-titulo">🏅 Trofeos</div>
            <div class="clan-medals">
                <div class="medal-item oro">
                    <span class="medal-icon">🥇</span>
                    <span class="medal-count">${clan.oro}</span>
                </div>
                <div class="medal-item plata">
                    <span class="medal-icon">🥈</span>
                    <span class="medal-count">${clan.plata}</span>
                </div>
                <div class="medal-item bronce">
                    <span class="medal-icon">🥉</span>
                    <span class="medal-count">${clan.bronce}</span>
                </div>
            </div>

            <!-- Logros especiales: Rubí, Oro+Diamante, Esmeralda -->
            ${clan.badges ? `
            <div class="clan-logros">
                <div class="clan-logros-titulo">🏆 Logros</div>
                <div class="clan-logros-items">${clan.badges}</div>
            </div>` : ''}
        </div>`;
    });
    container.innerHTML = html;
}