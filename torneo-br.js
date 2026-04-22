/**
 * TORNEO BR - CARGA DINÁMICA
 * =====================================================
 * Lee los torneos desde Google Sheet (TORNEO_URL)
 * Estructura esperada:
 *  Col 0: Marca temporal
 *  Col 1: Imagen Del Torneo (URL o ruta)
 *  Col 2: Tag 1 (equipo/clan)
 *  Col 3: Tag 2
 *  Col 4: Tag 3
 *  Col 5: Tag 4
 *  Col 6: Tag 5
 *  Col 7: Fecha (YYYY-MM-DD)
 *  Col 8: Hora Mexico PM
 * =====================================================
 */

async function initTorneosBR() {
    const grid = document.getElementById('tbrGrid');
    if (!grid) return;

    try {
        const data = await fetchTorneoData();
        if (!data || data.length === 0) {
            grid.innerHTML = '<div class="error-message">⚠️ No hay torneos disponibles</div>';
            return;
        }

        renderTorneosFromData(data, grid);
    } catch (err) {
        console.error('Error cargando torneos:', err);
        grid.innerHTML = '<div class="error-message">❌ Error al cargar los torneos</div>';
    }
}

async function fetchTorneoData() {
    try {
        const response = await fetch(CONFIG.TORNEO_URL);
        const csv = await response.text();
        const lines = csv.trim().split('\n');
        
        console.log('📊 CSV Lines:', lines.length);
        console.log('Primera línea (headers):', lines[0]);
        
        if (lines.length <= 1) {
            console.warn('⚠️ No hay datos en el CSV');
            return [];
        }

        const data = [];
        // Comenzar desde línea 1 para saltar encabezados
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            console.log(`Row ${i}:`, row);
            
            // Verificar que tenga datos
            if (!row || row.length < 8) {
                console.warn(`⚠️ Row ${i} tiene menos de 8 columnas`);
                continue;
            }
            
            if (!row[1] || !row[7]) {
                console.warn(`⚠️ Row ${i} sin imagen (${row[1]}) o fecha (${row[7]})`);
                continue;
            }

            const imagen = limpiarYConvertirURL(row[1].trim());
            const fechaStr = row[7].trim();
            const fechaConvertida = convertirFecha(fechaStr);
            const horaOriginal = row[8] ? row[8].trim() : '';

            console.log(`✅ Torneo ${i}:`, { imagen, fechaOriginal: fechaStr, fechaConvertida, hora: horaOriginal });

            data.push({
                timestamp: row[0] || '',
                imagen: imagen,
                tag1: row[2] ? row[2].trim() : '',
                tag2: row[3] ? row[3].trim() : '',
                tag3: row[4] ? row[4].trim() : '',
                tag4: row[5] ? row[5].trim() : '',
                tag5: row[6] ? row[6].trim() : '',
                fecha: fechaConvertida,
                hora: horaOriginal
            });
        }

        // ORDENAR: NUEVOS PRIMERO (fecha más reciente primero)
        data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        console.log('✅ Total torneos cargados:', data.length, data);
        return data;
    } catch (err) {
        console.error('❌ Error fetching torneo data:', err);
        return [];
    }
}

/**
 * Limpia URLs de Google Drive y las convierte a formato thumbnail
 * (igual que en clanes.js - getLogoUrl)
 * Soporta:
 * - https://drive.google.com/file/d/ID/view
 * - https://drive.google.com/open?id=ID
 * Convierte a: https://drive.google.com/thumbnail?id=ID&sz=w400
 */
function limpiarYConvertirURL(url) {
    if (!url) return '';
    
    // Remover comillas si existen
    url = url.replace(/^"|"$/g, '').trim();
    
    if (!url) return '';
    
    // Si es URL de Google Drive, convertir a thumbnail
    if (url.includes('drive.google.com')) {
        // Formato 1: /file/d/ID/view
        let match = url.match(/\/file\/d\/([a-zA-Z0-9_\-]+)/);
        if (match && match[1]) {
            const convertedURL = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
            console.log(`✅ Convertida URL de Google Drive (formato /file/d/):`, match[1]);
            return convertedURL;
        }
        
        // Formato 2: /open?id=ID
        match = url.match(/[?&]id=([a-zA-Z0-9_\-]+)/);
        if (match && match[1]) {
            const convertedURL = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
            console.log(`✅ Convertida URL de Google Drive (formato /open?id=):`, match[1]);
            return convertedURL;
        }
    }
    
    // Si es ruta local (sin protocolo), mantener tal cual
    if (!url.startsWith('http')) {
        console.log(`✅ URL local:`, url);
        return url;
    }
    
    console.log(`✅ URL directa:`, url);
    return url;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

/**
 * Convierte fecha de formato dd/mm/aaaa O dd-mm-aaaa a YYYY-MM-DD
 * Ej: "23/11/2025" → "2025-11-23"
 * Ej: "22-04-2026" → "2026-04-22"
 */
function convertirFecha(fechaStr) {
    if (!fechaStr) {
        console.warn('⚠️ Fecha vacía');
        return '';
    }
    
    console.log(`🔄 Convirtiendo fecha: "${fechaStr}"`);
    
    // Remover espacios
    fechaStr = fechaStr.trim();
    
    // Intentar dividir por "/" primero (formato dd/mm/aaaa)
    let partes = fechaStr.split('/');
    let es_formato_slash = false;
    
    if (partes.length !== 3) {
        // Intentar dividir por "-" (formato dd-mm-aaaa)
        partes = fechaStr.split('-');
        es_formato_slash = false;
    } else {
        es_formato_slash = true;
    }
    
    if (partes.length !== 3) {
        console.warn(`⚠️ Formato de fecha inválido (esperaba dd/mm/aaaa o dd-mm-aaaa): "${fechaStr}"`);
        return '';
    }
    
    const [dia, mes, anio] = partes;
    const fechaConvertida = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    console.log(`✅ Fecha convertida: "${fechaStr}" → "${fechaConvertida}"`);
    return fechaConvertida;
}

/**
 * Devuelve la hora tal como está en el Google Sheet
 * Sin convertir AM a PM
 */
function convertirHoraPM(horaStr) {
    return horaStr ? horaStr.trim() : '';
}

function renderTorneosFromData(data, grid) {
    const hoy = new Date();
    grid.innerHTML = '';

    data.forEach((t, i) => {
        try {
            let fechaTorneo;
            let fechaFormato;
            
            // Validar que la fecha sea válida
            if (t.fecha) {
                console.log(`🗓️ Torneo ${i} - Procesando fecha: "${t.fecha}"`);
                fechaTorneo = new Date(t.fecha + 'T23:59:59');
                console.log(`   Fecha parseada:`, fechaTorneo);
                
                if (isNaN(fechaTorneo.getTime())) {
                    console.error(`❌ Fecha inválida para torneo ${i}:`, t.fecha);
                    fechaFormato = '⚠️ Fecha inválida';
                } else {
                    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
                    fechaFormato = fechaTorneo.toLocaleDateString('es-ES', opciones);
                    console.log(`✅ Fecha formateada: "${fechaFormato}"`);
                }
            } else {
                console.warn(`⚠️ Torneo ${i} sin fecha`);
                fechaFormato = '⚠️ Sin fecha';
            }
            
            const pasado = fechaTorneo && !isNaN(fechaTorneo.getTime()) ? fechaTorneo < hoy : false;
            const estado = pasado ? 'finalizado' : 'proximo';
            const estadoTxt = pasado ? 'FINALIZADO' : 'PRÓXIMO';

            // Construcción de tags participantes
            const tags = [t.tag1, t.tag2, t.tag3, t.tag4, t.tag5].filter(tag => tag);
            const tagsHTML = tags.map(tag => `<span class="torneo-tag">${tag}</span>`).join('');

            const card = document.createElement('div');
            card.className = `tbr-card ${pasado ? '' : 'es-proximo'}`;
            const numTorneo = data.length - i;
            card.innerHTML = `
                <img class="tbr-img"
                     src="${t.imagen}"
                     alt="Torneo BR ${numTorneo}"
                     onerror="console.error('❌ Error cargando imagen:', '${t.imagen.substring(0, 50)}...');">
                <div class="tbr-body">
                    <div class="tbr-num">TORNEO BR · #${numTorneo}</div>
                    <div class="tbr-fecha">
                        <span>📅</span>
                        <span>${fechaFormato}${t.hora ? ' · 🕗 ' + t.hora : ''}</span>
                    </div>
                    ${tagsHTML ? `<div class="tbr-tags">${tagsHTML}</div>` : ''}
                    ${numTorneo === 6 ? `<a href="videos-torneo6.html" class="tbr-videos-btn">🎬 Ver videos</a>` : ''}
                    <div class="tbr-badge ${estado}">
                        <span class="tbr-dot"></span>
                        <span>${estadoTxt}</span>
                    </div>
                </div>`;
            grid.appendChild(card);
        } catch (err) {
            console.error(`❌ Error renderizando torneo ${i}:`, err, t);
        }
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initTorneosBR();
});

/**
 * Obtiene los 3 torneos más nuevos para mostrar en index
 * (Para usar en la página de inicio)
 */
async function obtenerTorneosRecientes(cantidad = 3) {
    try {
        const data = await fetchTorneoData();
        return data.slice(0, cantidad); // Ya están ordenados por fecha (nuevos primero)
    } catch (err) {
        console.error('❌ Error obteniendo torneos recientes:', err);
        return [];
    }
}
