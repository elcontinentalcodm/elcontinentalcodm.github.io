/**
 * RANKING.JS
 * General → hoja de registro (formulario).
 * Cada sala → su hoja semanal propia.
 */

const SALAS_RANKING_CFG = {
    'ZONA DE GUERRA 8': { url: () => CONFIG.SEMANAL_ZGUERRA_URL,        icon: '⚔️', diarios: () => CONFIG.DIARIOS_ZGUERRA_URL, sanciones: () => CONFIG.SANCIONES_ZGUERRA_URL },
    'ZONA LETAL 9':     { url: () => CONFIG.SEMANAL_ZLETAL_URL,         icon: '💥', diarios: () => CONFIG.DIARIOS_ZLETAL_URL, sanciones: () => CONFIG.SANCIONES_ZLETAL_URL },
    'ZONA XTREME 9':    { url: () => CONFIG.SEMANAL_ZXTREME_URL,        icon: '⚡', diarios: () => CONFIG.DIARIOS_ZXTREME_URL, sanciones: () => CONFIG.SANCIONES_ZXTREME_URL },
    'Isla Exterminio':  { url: () => CONFIG.SEMANAL_ISLA_EXTERMINIO_URL,  icon: '🔫', diarios: () => CONFIG.DIARIOS_ISLA_EXTERMINIO_URL, sanciones: () => CONFIG.SANCIONES_ISLA_EXTERMINIO_URL },
    'Isla Aniquilacion': { url: () => CONFIG.SEMANAL_ISLA_ANIQUILACION_URL, icon: '⚡', diarios: () => CONFIG.DIARIOS_ISLA_ANIQUILACION_URL, sanciones: () => CONFIG.SANCIONES_ISLA_ANIQUILACION_URL },
    'Zona Devastacion': { url: () => CONFIG.SEMANAL_ISLA_DEVASTACION_URL,  icon: '💥', diarios: () => CONFIG.DIARIOS_ISLA_DEVASTACION_URL, sanciones: () => CONFIG.SANCIONES_ISLA_DEVASTACION_URL },
    'Isla Apocalipsis':  { url: () => CONFIG.SEMANAL_ISLA_APOCALIPSIS_URL, icon: '☠️', diarios: () => CONFIG.DIARIOS_ISLA_APOCALIPSIS_URL, sanciones: () => CONFIG.SANCIONES_ISLA_APOCALIPSIS_URL },
    'Isla Extincion':   { url: () => CONFIG.SEMANAL_ISLA_EXTINCION_URL,   icon: '🔥', diarios: () => CONFIG.DIARIOS_ISLA_EXTINCION_URL, sanciones: () => CONFIG.SANCIONES_ISLA_EXTINCION_URL },
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
        
        // Mostrar la primera sala disponible en los botones
        const firstSala = filterBtns.length > 0 ? filterBtns[0].getAttribute('data-sala') : 'general';
        if (firstSala === 'general') {
            displayRanking(rankings, 'general', container);
        } else {
            displaySalaRanking(firstSala, container);
        }
        
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
        // ZONA XTREME 9: Lógica separada con TOP 3 MENSUAL
        if (sala === 'ZONA XTREME 9') {
            const dataSemanal = await fetchSheetData(cfg.url());
            const items = buildZonaXtremeRankingItems(dataSemanal);
            
            if (!items.length) {
                container.innerHTML = `<div class="error-message">Sin datos para ${sala} esta semana</div>`;
                return;
            }
            
            renderSalaRankingItems(container, sala, cfg.icon, items);
            return;
        }

        // Las salas especiales se muestran como ranking simple en público.
        if (cfg.diarios && cfg.sanciones) {
            // Zona Devastacion usa puntos diarios, otras usan resumen semanal
            const dataUrl = sala === 'Zona Devastacion' ? cfg.diarios() : cfg.url();
            const dataSemanal = await fetchSheetData(dataUrl);
            const items = buildSalaRankingItems(dataSemanal, sala);

            if (!items.length) {
                container.innerHTML = `<div class="error-message">Sin datos para ${sala} esta semana</div>`;
                return;
            }

            renderSalaRankingItems(container, sala, cfg.icon, items);
        } else {
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
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="error-message">❌ Error al cargar ${sala}</div>`;
    }
}

function buildZonaXtremeRankingItems(dataSemanal) {
    if (!dataSemanal || !dataSemanal.length) return [];

    console.log('🔍 Zona Xtreme - Total filas:', dataSemanal.length);

    // Filtrar filas vacías
    const filasConDatos = dataSemanal.filter(row => {
        return row && row.some(cell => cell && cell.toString().trim() !== '');
    });

    console.log('📊 Zona Xtreme - Filas con datos:', filasConDatos.length);

    // Buscar la PRIMERA fila con "Lugar" para encontrar dónde comienzan los datos
    let lugarIdx = -1, equipoIdx = -1, puntosIdx = -1;
    let headerRowIdx = -1;

    for (let i = 0; i < filasConDatos.length; i++) {
        const row = filasConDatos[i];
        const lugarPos = row.findIndex(cell => (cell || '').toString().trim() === 'Lugar');
        
        if (lugarPos !== -1) {
            lugarIdx = lugarPos;
            equipoIdx = lugarPos + 1;
            puntosIdx = lugarPos + 2;
            headerRowIdx = i;
            console.log(`✅ Encontrado PRIMER header en fila ${i}: Lugar[${lugarIdx}], Equipo[${equipoIdx}], Puntos[${puntosIdx}]`);
            break;  // ← Usar el PRIMER header encontrado, no el último
        }
    }

    if (lugarIdx === -1) {
        console.error('❌ No se encontró la fila de encabezados');
        return [];
    }

    // Procesar las filas después del header
    const items = filasConDatos
        .slice(headerRowIdx + 1)
        .filter(r => {
            const lugar = (r[lugarIdx] || '').toString().trim();
            const equipo = (r[equipoIdx] || '').toString().trim();
            
            console.log(`   Lugar: "${lugar}", Equipo: "${equipo}", Puntos: "${r[puntosIdx]}"`);
            
            // Filtrar filas que empiezan con número seguido de °
            return lugar && equipo && /^\d+°/.test(lugar);
        })
        .map(r => {
            const nombre = (r[equipoIdx] || '').trim();
            const puntos = parseFloat((r[puntosIdx] || '').toString().replace(/[^\d.]/g, '')) || 0;
            console.log(`   ✅ Agregado: ${nombre} - ${puntos} puntos`);
            return { nombre, puntos };
        })
        .filter(item => item.nombre && item.puntos > 0)
        .sort((a, b) => b.puntos - a.puntos);
    
    console.log('✅ Items finales:', items);
    return items;
}

function buildSalaRankingItems(dataSemanal, sala) {
    if (!dataSemanal || !dataSemanal.length) return [];

    // Detectar estructura del CSV automaticamente
    // ZONA DE GUERRA 8: Slot es numero, Total en indice 13
    // ZONA LETAL: estructura antigua con kills en indices especificos
    // ZONA DEVASTACION: agrupar por slot+nombre y sumar totales
    
    const hasNewStructure = dataSemanal.length > 3 && 
        dataSemanal.slice(3).some(r => r[13] !== undefined && parseFloat(r[13]) > 0);
    
    if (hasNewStructure) {
        // NUEVA ESTRUCTURA (ZONA DE GUERRA 8)
        const startIdx = 3;
        const rows = dataSemanal.slice(startIdx).filter(r => {
            const slot = (r[0] || '').toString().trim();
            const clan = (r[1] || '').toString().trim();
            // Permitir filas con clan válido, independientemente del slot
            // (slot puede estar vacío o ser un número válido)
            return clan !== '' && (slot === '' || /^\d+$/.test(slot));
        });

        const items = rows.map(r => {
            const nombre = (r[1] || '').trim();
            const total = parseFloat(r[13]) || 0;
            return { nombre, puntos: total };
        }).filter(item => item.nombre && item.puntos > 0);

        return items.sort((a, b) => b.puntos - a.puntos);
    } else if (sala === 'ZONA LETAL 9') {
        // ESTRUCTURA ANTIGUA - ZONA LETAL
        // Mantener el código original de Zona Letal
        const rows = dataSemanal.filter(r => {
            const slot = (r[0] || '').toString().trim();
            return slot !== '' && /^\d+$/.test(slot);
        });

        const items = rows.map(r => {
            const nombre = (r[1] || '').trim();
            const lunes = parseFloat(r[3]) || 0;
            const martes = parseFloat(r[5]) || 0;
            const mier = parseFloat(r[7]) || 0;
            const jueves = parseFloat(r[9]) || 0;
            const viernes = parseFloat(r[11]) || 0;
            const total = lunes + martes + mier + jueves + viernes;
            return { nombre, puntos: total };
        }).filter(item => item.nombre && item.puntos > 0);

        return items.sort((a, b) => b.puntos - a.puntos);
    } else if (sala === 'Zona Devastacion') {
        // PUNTOS DIARIOS - ZONA DEVASTACION
        // Agrupar por SLOT + NOMBRE y sumar todos los puntos (hay múltiples filas por día)
        const equipos = {};
        
        dataSemanal.forEach(r => {
            const slot = (r[0] || '').toString().trim();
            const nombre = (r[1] || '').toString().trim();
            
            // Agrupar por SLOT + NOMBRE
            if (slot && nombre && /^\d+$/.test(slot)) {
                const key = `${slot}|${nombre}`;
                
                if (!equipos[key]) {
                    equipos[key] = { nombre, puntos: 0 };
                }
                
                // Sumar el valor total de la columna M (TOTAL)
                const total = parseFloat(r[12]) || 0;
                equipos[key].puntos += total;
            }
        });

        const items = Object.values(equipos)
            .filter(item => item.puntos > 0)
            .sort((a, b) => b.puntos - a.puntos);

        return items;
    } else {
        // Estructura genérica para otras salas
        const rows = dataSemanal.filter(r => {
            const slot = (r[0] || '').toString().trim();
            return slot !== '' && /^\d+$/.test(slot);
        });

        const items = rows.map(r => {
            const nombre = (r[1] || '').trim();
            const total = parseFloat(r[7]) || 0;
            return { nombre, puntos: total };
        }).filter(item => item.nombre && item.puntos > 0);

        return items.sort((a, b) => b.puntos - a.puntos);
    }
}

function renderSalaRankingItems(container, sala, icon, items) {
    const medals = ['🥇', '🥈', '🥉'];
    let html = '';

    items.forEach((clan, i) => {
        const pos = i + 1;
        const topCl = pos <= 3 ? `top-${pos}` : '';
        const posLabel = medals[i] || pos;
        html += `
        <div class="ranking-item no-logo ${topCl}">
            <div class="ranking-posicion">${posLabel}</div>
            <div class="ranking-info">
                <div class="ranking-nombre">${clan.nombre}</div>
                <div class="ranking-sala">${icon} ${sala} · Semana actual</div>
            </div>
            <div class="ranking-puntos">
                <div class="ranking-score">${clan.puntos}</div>
                <div class="ranking-label">puntos</div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

function displayZonaLetal(dataDiarios, dataSemanal, dataSanciones, container, sala) {
    if (!dataDiarios || !dataDiarios.length) {
        container.innerHTML = `<div class="error-message">Sin datos para ${sala}</div>`;
        return;
    }

    // Detectar estructura
    const firstData = dataDiarios[1];
    const isZonaLetal = firstData && /^[LMXJV]$/.test((firstData[1] || '').trim().toUpperCase());

    const rows = dataDiarios.slice(1).filter(r => (r[1] || '').toString().trim() !== '');
    if (!rows.length) {
        container.innerHTML = `<div class="error-message">Sin datos para ${sala}</div>`;
        return;
    }

    // Tabs principales
    let tabsHtml = '<div style="display:flex;gap:0.5rem;margin-bottom:1rem;border-bottom:2px solid var(--border-color);">';
    tabsHtml += '<button class="ranking-tab active" data-tab="resumen" style="padding:0.5rem 1rem;background:none;border:none;cursor:pointer;border-bottom:3px solid transparent;font-weight:600;color:var(--text-color);">📋 Resultados</button>';
    tabsHtml += '<button class="ranking-tab" data-tab="semanal" style="padding:0.5rem 1rem;background:none;border:none;cursor:pointer;border-bottom:3px solid transparent;font-weight:600;color:var(--text-color);">📊 Resumen Semanal</button>';
    tabsHtml += '<button class="ranking-tab" data-tab="sanciones" style="padding:0.5rem 1rem;background:none;border:none;cursor:pointer;border-bottom:3px solid transparent;font-weight:600;color:var(--text-color);">🚫 Sanciones</button>';
    tabsHtml += '</div>';

    // Panel 1: Resumen Semanal
    let resumenHtml = '<div class="ranking-tab-content" data-tab="resumen">';
    if (dataSemanal && dataSemanal.length > 1) {
        let semRows, lunesIdx, martesIdx, mierIdx, juevesIdx, viernesIdx, totalIdx, clanNameIdx;
        
        if (isZonaLetal) {
            semRows = dataSemanal.slice(4).filter(r => 
                (r[0] || '').toString().trim() !== '' && 
                !/^[-–—=SLOT]/.test((r[0] || '').toString().trim())
            );
            lunesIdx = 3; martesIdx = 5; mierIdx = 7; juevesIdx = 9; viernesIdx = 11; totalIdx = 11; clanNameIdx = 1;
        } else {
            semRows = dataSemanal.slice(1).filter(r => 
                (r[0] || '').toString().trim() !== '' && 
                !/^[-–—=]/.test((r[0] || '').toString().trim())
            );
            lunesIdx = 1; martesIdx = 2; mierIdx = 3; juevesIdx = 4; viernesIdx = 5; totalIdx = 6; clanNameIdx = 0;
        }
        
        if (semRows.length) {
            const sorted = [...semRows].map(r => {
                const lunes = parseFloat(r[lunesIdx]) || 0;
                const martes = parseFloat(r[martesIdx]) || 0;
                const mier = parseFloat(r[mierIdx]) || 0;
                const jueves = parseFloat(r[juevesIdx]) || 0;
                const viernes = parseFloat(r[viernesIdx]) || 0;
                return {
                    nombre: r[clanNameIdx] || '—',
                    puntos: isZonaLetal ? (lunes + martes + mier + jueves + viernes) : (parseFloat(r[totalIdx]) || 0)
                };
            }).sort((a, b) => b.puntos - a.puntos);

            const medals = ['🥇', '🥈', '🥉'];
            sorted.forEach((clan, i) => {
                const topCl    = i <= 2 ? `top-${i + 1}` : '';
                const posLabel = medals[i] || (i + 1);
                resumenHtml += `
            <div class="ranking-item no-logo ${topCl}">
                <div class="ranking-posicion">${posLabel}</div>
                <div class="ranking-info">
                    <div class="ranking-nombre">${clan.nombre}</div>
                    <div class="ranking-sala">📊 ${sala} · Puntos Semanales</div>
                </div>
                <div class="ranking-puntos">
                    <div class="ranking-score">${clan.puntos}</div>
                    <div class="ranking-label">puntos</div>
                </div>
            </div>`;
            });
        } else {
            resumenHtml += '<p style="text-align:center;color:var(--muted);padding:1rem">Sin datos semanales aún</p>';
        }
    } else {
        resumenHtml += '<p style="text-align:center;color:var(--muted);padding:1rem">Sin datos semanales aún</p>';
    }
    resumenHtml += '</div>';

    // Panel 2: Semanal (duplicado de resumen para consistencia)
    let semanalHtml = '<div class="ranking-tab-content" data-tab="semanal" style="display:none;">';
    if (dataSemanal && dataSemanal.length > 1) {
        let semRows, lunesIdx, martesIdx, mierIdx, juevesIdx, viernesIdx, totalIdx, clanNameIdx;
        
        if (isZonaLetal) {
            semRows = dataSemanal.slice(4).filter(r => 
                (r[0] || '').toString().trim() !== '' && 
                !/^[-–—=SLOT]/.test((r[0] || '').toString().trim())
            );
            lunesIdx = 3; martesIdx = 5; mierIdx = 7; juevesIdx = 9; viernesIdx = 11; totalIdx = 11; clanNameIdx = 1;
        } else {
            semRows = dataSemanal.slice(1).filter(r => 
                (r[0] || '').toString().trim() !== '' && 
                !/^[-–—=]/.test((r[0] || '').toString().trim())
            );
            lunesIdx = 1; martesIdx = 2; mierIdx = 3; juevesIdx = 4; viernesIdx = 5; totalIdx = 6; clanNameIdx = 0;
        }
        
        if (semRows.length) {
            const sorted = [...semRows].map(r => {
                const lunes = parseFloat(r[lunesIdx]) || 0;
                const martes = parseFloat(r[martesIdx]) || 0;
                const mier = parseFloat(r[mierIdx]) || 0;
                const jueves = parseFloat(r[juevesIdx]) || 0;
                const viernes = parseFloat(r[viernesIdx]) || 0;
                return {
                    nombre: r[clanNameIdx] || '—',
                    puntos: isZonaLetal ? (lunes + martes + mier + jueves + viernes) : (parseFloat(r[totalIdx]) || 0)
                };
            }).sort((a, b) => b.puntos - a.puntos);

            const medals = ['🥇', '🥈', '🥉'];
            sorted.forEach((clan, i) => {
                const topCl    = i <= 2 ? `top-${i + 1}` : '';
                const posLabel = medals[i] || (i + 1);
                semanalHtml += `
            <div class="ranking-item no-logo ${topCl}">
                <div class="ranking-posicion">${posLabel}</div>
                <div class="ranking-info">
                    <div class="ranking-nombre">${clan.nombre}</div>
                    <div class="ranking-sala">📊 ${sala} · Resumen Semanal</div>
                </div>
                <div class="ranking-puntos">
                    <div class="ranking-score">${clan.puntos}</div>
                    <div class="ranking-label">puntos</div>
                </div>
            </div>`;
            });
        } else {
            semanalHtml += '<p style="text-align:center;color:var(--muted);padding:1rem">Sin datos semanales aún</p>';
        }
    } else {
        semanalHtml += '<p style="text-align:center;color:var(--muted);padding:1rem">Sin datos semanales aún</p>';
    }
    semanalHtml += '</div>';

    // Panel 3: Sanciones
    let sancionesHtml = '<div class="ranking-tab-content" data-tab="sanciones" style="display:none;">';
    if (dataSanciones && dataSanciones.length) {
        let sanRows;
        if (isZonaLetal) {
            sanRows = dataSanciones.slice(1).filter(r => (r[1] || '').toString().trim() !== '');
        } else {
            // Nueva estructura: A=EQUIPO, B=FECHA, C=MOTIVO, D=PUNTOS RESTADOS, E=DÍAS SUSPENDIDO
            sanRows = dataSanciones.slice(1).filter(r => (r[0] || '').toString().trim() !== '');
        }
        
        if (sanRows.length) {
            sanRows.forEach(r => {
                const equipo = isZonaLetal ? (r[0] || '—') : (r[0] || '—');
                const jugador = isZonaLetal ? (r[1] || '—') : '';
                const fecha = isZonaLetal ? (r[2] || '—') : (r[1] || '—');
                const motivo = isZonaLetal ? (r[3] || '—') : (r[2] || '—');
                const pts = isZonaLetal ? (parseFloat(r[4]) || 0) : (parseFloat(r[3]) || 0);
                
                sancionesHtml += `
            <div style="padding:0.75rem;border-bottom:1px solid var(--border-color);display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0.5rem;align-items:center;">
                <div style="font-weight:bold;color:var(--gold)">${equipo}</div>
                <div>${jugador}</div>
                <div style="text-align:center;color:var(--muted);font-size:0.9rem">${fecha}</div>
                <div style="text-align:center;color:#ff4d4d;font-weight:bold">${pts !== 0 ? (pts > 0 ? '-' + pts : pts) : '—'}</div>
            </div>`;
            });
        } else {
            sancionesHtml += '<p style="text-align:center;color:var(--muted);padding:1rem">✅ Sin sanciones registradas</p>';
        }
    } else {
        sancionesHtml += '<p style="text-align:center;color:var(--muted);padding:1rem">✅ Sin sanciones registradas</p>';
    }
    sancionesHtml += '</div>';

    container.innerHTML = tabsHtml + resumenHtml + semanalHtml + sancionesHtml;

    // Event listeners para tabs
    container.querySelectorAll('.ranking-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.ranking-tab').forEach(b => {
                b.style.borderBottom = '3px solid transparent';
                b.style.color = 'var(--text-color)';
            });
            container.querySelectorAll('.ranking-tab-content').forEach(p => p.style.display = 'none');
            
            btn.style.borderBottom = '3px solid var(--accent-color)';
            btn.style.color = 'var(--accent-color)';
            const tab = btn.dataset.tab;
            const panel = container.querySelector(`.ranking-tab-content[data-tab="${tab}"]`);
            if (panel) panel.style.display = '';
        });
    });

    // Inicializar primer tab activo
    const firstBtn = container.querySelector('.ranking-tab.active');
    if (firstBtn) {
        firstBtn.style.borderBottom = '3px solid var(--accent-color)';
        firstBtn.style.color = 'var(--accent-color)';
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