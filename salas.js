/**
 * SALAS.JS - Contador dinámico de salas
 * Zona horaria: América/México_City (CST/CDT)
 * Estados:
 *  - Normal (verde): > 15 minutos antes
 *  - Warning (amarillo): ≤ 15 minutos antes
 *  - Active (rojo): hora exacta
 * Reset: 12:00 AM (medianoche)
 */

document.addEventListener('DOMContentLoaded', () => {
    initSalasCounter();
    initHamburger();
});

function getCurrentMexicoTime() {
    // Obtener hora actual en zona horaria de México Centro
    const now = new Date();
    const mexicoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    return mexicoTime;
}

function getMinutesUntilMidnight() {
    const now = getCurrentMexicoTime();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    return Math.floor(diff / 1000 / 60);
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function parseHora(horaStr) {
    // Convierte "20:00" a minutos desde medianoche
    const [h, m] = horaStr.split(':').map(Number);
    return h * 60 + m;
}

function getCurrentMinutes() {
    const now = getCurrentMexicoTime();
    return now.getHours() * 60 + now.getMinutes();
}

function isWeekday() {
    // Retorna true si es lunes (1) a viernes (5)
    const now = getCurrentMexicoTime();
    const dayOfWeek = now.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function getMinutesUntilNextSala(salaHoraStr) {
    const salaMinutos = parseHora(salaHoraStr);
    const ahora = getCurrentMinutes();

    // Si la sala ya pasó hoy, calcular para mañana
    if (ahora >= salaMinutos) {
        // Minutos hasta medianoche + minutos desde medianoche hasta la sala
        return (1440 - ahora) + salaMinutos;
    }
    return salaMinutos - ahora;
}

function updateSalaTimer(card) {
    const horaStr = card.getAttribute('data-hora');
    if (!horaStr) return;

    const timerEl = card.querySelector('.room-time');
    const countdownEl = card.querySelector('.room-countdown');
    
    if (!timerEl || !countdownEl) return;

    // Verificar si es día de semana
    if (!isWeekday()) {
        timerEl.className = 'room-time status-normal';
        countdownEl.textContent = '⏱️ Sin salas en fin de semana';
        return;
    }

    const minutosRestantes = getMinutesUntilNextSala(horaStr);
    
    // Determinar estado
    let statusClass = 'status-normal';
    let countdownText = '';

    if (minutosRestantes === 0) {
        // Hora exacta: rojo
        statusClass = 'status-active';
        countdownText = '🔴 ¡SALA EN VIVO AHORA!';
    } else if (minutosRestantes <= 15) {
        // 15 minutos o menos: amarillo
        statusClass = 'status-warning';
        const hrs = Math.floor(minutosRestantes / 60);
        const mins = minutosRestantes % 60;
        if (hrs > 0) {
            countdownText = `⏰ Faltan ${hrs}h ${mins}m`;
        } else {
            countdownText = `⏰ Faltan ${mins}m`;
        }
    } else {
        // Normal: verde
        statusClass = 'status-normal';
        const hrs = Math.floor(minutosRestantes / 60);
        const mins = minutosRestantes % 60;
        countdownText = `Próxima sala en ${hrs}h ${mins}m`;
    }

    // Actualizar clases
    timerEl.className = `room-time ${statusClass}`;
    countdownEl.textContent = countdownText;
}

function initSalasCounter() {
    const cards = document.querySelectorAll('.room-card[data-hora]');
    
    // Actualizar inmediatamente
    cards.forEach(updateSalaTimer);
    
    // Actualizar cada segundo
    setInterval(() => {
        cards.forEach(updateSalaTimer);
    }, 1000);
}
