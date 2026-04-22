/**
 * VIDEOS TORNEO #6
 * =====================================================
 * Carga y muestra videos desde Google Sheet
 * Estructura esperada:
 *  Col A: Marca temporal (ignorada)
 *  Col B: URLs de videos (Google Drive)
 * =====================================================
 */

const VIDEOS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRokGDiYpw_QV0WtS7dqPXdZFsBRrQWawAH5kzK9Jodgun6Cy2lNalOhRiE6XIZ69pwtJFwHWmZBRTP/pub?gid=90932125&single=true&output=csv';

/**
 * Extrae el ID del archivo de una URL de Google Drive
 */
function extraerGDriveId(url) {
    // Formato: https://drive.google.com/open?id=FILE_ID
    const match = url.match(/[?&]id=([^&]+)/);
    if (match) return match[1];
    
    // Formato: https://drive.google.com/file/d/FILE_ID/...
    const match2 = url.match(/\/file\/d\/([^/]+)/);
    if (match2) return match2[1];
    
    return null;
}

/**
 * Crea un iframe para mostrar el video de Google Drive
 */
function crearIframeVideo(googleDriveId) {
    const previewUrl = `https://drive.google.com/file/d/${googleDriveId}/preview`;
    const iframe = document.createElement('iframe');
    iframe.src = previewUrl;
    iframe.allow = 'autoplay';
    return iframe;
}

async function cargarVideos() {
    const grid = document.getElementById('videosGrid');
    if (!grid) return;

    try {
        console.log('📹 Cargando videos desde:', VIDEOS_SHEET_URL);
        
        const response = await fetch(VIDEOS_SHEET_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const csvText = await response.text();
        console.log('📊 CSV recibido, líneas:', csvText.split('\n').length);

        const lineas = csvText.trim().split('\n');
        if (lineas.length === 0) {
            grid.innerHTML = '<div class="videos-empty">⚠️ No hay videos disponibles</div>';
            return;
        }

        // Saltar header (primera línea)
        const videos = [];

        for (let i = 1; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            if (!linea) continue;

            const [timestamp, url] = parsearLineaCSV(linea);

            if (url) {
                const gdriveId = extraerGDriveId(url.trim());
                if (gdriveId) {
                    videos.push({ 
                        url: url.trim(),
                        gdriveId: gdriveId,
                        numero: videos.length + 1
                    });
                }
            }
        }

        console.log(`✅ ${videos.length} videos cargados`);

        if (videos.length === 0) {
            grid.innerHTML = '<div class="videos-empty">⚠️ No hay videos disponibles en la hoja</div>';
            return;
        }

        // Renderizar videos
        grid.innerHTML = '';
        videos.forEach((video) => {
            const card = document.createElement('div');
            card.className = 'video-card';
            
            // Crear contenedor con iframe
            const iframeContainer = document.createElement('div');
            iframeContainer.className = 'video-iframe-container';
            const iframe = crearIframeVideo(video.gdriveId);
            iframeContainer.appendChild(iframe);
            
            // Crear body
            const body = document.createElement('div');
            body.className = 'video-body';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'video-name';
            nameDiv.textContent = `Video #${video.numero}`;
            body.appendChild(nameDiv);
            
            // Agregar al card
            card.appendChild(iframeContainer);
            card.appendChild(body);
            
            grid.appendChild(card);
        });

    } catch (err) {
        console.error('❌ Error cargando videos:', err);
        grid.innerHTML = '<div class="videos-error">❌ Error al cargar los videos. Intenta más tarde.</div>';
    }
}

/**
 * Parsea una línea CSV considerando comillas
 */
function parsearLineaCSV(linea) {
    const partes = [];
    let actual = '';
    let enComillas = false;

    for (let i = 0; i < linea.length; i++) {
        const char = linea[i];

        if (char === '"') {
            enComillas = !enComillas;
        } else if (char === ',' && !enComillas) {
            partes.push(actual);
            actual = '';
        } else {
            actual += char;
        }
    }
    partes.push(actual);

    return partes.map(p => p.replace(/^"|"$/g, '').trim());
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarVideos);
