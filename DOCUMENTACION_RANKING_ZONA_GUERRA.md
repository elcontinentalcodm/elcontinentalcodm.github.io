# Documentación - Integración Ranking ZONA DE GUERRA 8

## Resumen de Cambios

Se integró un nuevo Google Sheet de **ZONA DE GUERRA 8** al sistema de ranking. El proceso implicó actualizar la configuración y el parser para leer correctamente la nueva estructura del CSV.

---

## 1. Cambio en config-global.js

### URL Actualizada
Se reemplazó el URL del `SEMANAL_ZGUERRA_URL` con el nuevo link:

```javascript
// ANTIGUO
SEMANAL_ZGUERRA_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw0yyRYk7ik9KZNiKJpEhSG18CJ4bl2T38CpIJV3ErgYqAV2MZZAoYa6V7GwMBvKP84pGppxCW7wao/pub?gid=1433759351&single=true&output=csv',

// NUEVO
SEMANAL_ZGUERRA_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRnhpfq-UuD76QAXSAStOxKAqlsqZQmz4uRQWbV5l0GiDVGBBlBZbg0GS4_Qe8HLuHqMhja3h7G_emG/pub?gid=1475745879&single=true&output=csv',
```

**Ubicación**: [config-global.js](config-global.js) - línea 17

---

## 2. Estructura del CSV (Google Sheet)

El nuevo Google Sheet tiene esta estructura:

```
Fila 0: ,,Lunes 23,,Martes 24,,Miércoles 25,,Jueves 26,,Viernes 27,,Sanciones,Total
Fila 1: ,,Sala 1,Sala 2,Sala 1,Sala 2,Sala 1,Sala 2,Sala 1,Sala 2,Sala 1,Sala 2,,
Fila 2: Slot,Clan,Posición,Kills,Posición,Kills,Posición,Kills,Posición,Kills,Posición,Kills,,
Fila 3+: DATOS DE CLANES...
```

### Mapeo de Columnas (índices 0-13)

| Índice | Columna | Contenido |
|--------|---------|-----------|
| 0 | A | Slot (número) |
| 1 | B | Clan (nombre) |
| 2 | C | Lunes Posición |
| 3 | D | Lunes Kills |
| 4 | E | Martes Posición |
| 5 | F | Martes Kills |
| 6 | G | Miércoles Posición |
| 7 | H | Miércoles Kills |
| 8 | I | Jueves Posición |
| 9 | J | Jueves Kills |
| 10 | K | Viernes Posición |
| 11 | L | Viernes Kills |
| 12 | M | Sanciones |
| **13** | **N** | **Total Puntos** ⭐ |

---

## 3. Cambios en ranking.js

### Función: buildSalaRankingItems()

**Propósito**: Parsear el CSV y extraer clanes con sus puntos totales

**Cambios realizados**:

```javascript
function buildSalaRankingItems(dataSemanal, isZonaLetal) {
    if (!dataSemanal || !dataSemanal.length) return [];

    // ✅ NUEVO: Saltar primeras 3 filas de headers
    const startIdx = 3;
    const rows = dataSemanal.slice(startIdx).filter(r => {
        const slot = (r[0] || '').toString().trim();
        const clan = (r[1] || '').toString().trim();
        // Filtrar: Slot debe ser número y Clan no vacío
        return slot !== '' && clan !== '' && /^\d+$/.test(slot);
    });

    // ✅ NUEVO: Mapeo correcto de columnas
    const items = rows.map(r => {
        const nombre = (r[1] || '').trim();  // Índice 1 = Clan
        const total = parseFloat(r[13]) || 0;  // Índice 13 = Total
        return {
            nombre,
            puntos: total
        };
    }).filter(item => item.nombre && item.puntos > 0);

    return items.sort((a, b) => b.puntos - a.puntos);
}
```

**Cambios clave**:

1. **`startIdx = 3`**: Omite las 3 primeras filas (headers)
2. **`r[1]` para Clan**: Lee de la columna B
3. **`r[13]` para Total**: Lee de la columna N (donde está el Total)
4. **Filtro `isZonaLetal` eliminado**: Se unificó la lógica para ambas estructuras

**Ubicación**: [ranking.js](ranking.js) - línea ~113

---

## 4. Cómo Funciona el Ranking Ahora

### Flujo de Carga

```
1. Usuario hace clic en "ZONA DE GUERRA 8"
   ↓
2. Se ejecuta displaySalaRanking("ZONA DE GUERRA 8", container)
   ↓
3. Se obtiene cfg.url() → SEMANAL_ZGUERRA_URL
   ↓
4. Se descarga el CSV desde Google Sheets
   ↓
5. buildSalaRankingItems() parsea el CSV:
   - Salta filas 0-2 (headers)
   - Lee Clan (índice 1) y Total (índice 13)
   - Ordena por puntos descendente
   ↓
6. renderSalaRankingItems() renderiza:
   🥇 Clan 1 - XXX puntos
   🥈 Clan 2 - XXX puntos
   🥉 Clan 3 - XXX puntos
   ... más clanes
```

### Ejemplo Real

Para la fila con índices 0-13:
```
[4, "Monster Gam Mg", 4, 54, 4, 25, 10, 50, 7, 36, 7, 21, "", 218]
 ↑                                                               ↑
 Slot                                                        Total = 218
      ↑
      Clan
```

**Resultado en UI**: 
```
🏆 Monster Gam Mg
⚔️ ZONA DE GUERRA 8 · Semana actual
218 puntos
```

---

## 5. Validación del Cambio

### ✅ Verificado
- El CSV se descarga correctamente desde Google Sheets
- Las primeras 3 filas se saltan apropiadamente
- El índice 13 (Total) se lee sin problemas
- Los clanes se ordenan correctamente por puntos

### Pruebas Realizadas
1. **Descargar CSV**: ✅ Conecta sin errores
2. **Parse de filas**: ✅ Salta headers correctamente
3. **Lectura de Total**: ✅ Obtiene valores como 74, 218, 141, etc.
4. **Ordenamiento**: ✅ Ordena descendente (mayor a menor puntos)

---

## 6. Mantenimiento Futuro

Si necesitas actualizar otro Google Sheet (otra sala), sigue estos pasos:

### Pasos para Agregar Otra Sala

1. **En Google Sheets**:
   - Crea la hoja con la misma estructura (Slot, Clan, Posición/Kills x 5 días, Sanciones, Total)
   - Publica como CSV

2. **En config-global.js**:
   ```javascript
   SEMANAL_NUEVA_SALA_URL: 'https://docs.google.com/spreadsheets/.../pub?gid=XXXX&single=true&output=csv',
   ```

3. **En ranking.js**:
   - Agrega entrada en `SALAS_RANKING_CFG`:
   ```javascript
   'Nueva Sala': { 
       url: () => CONFIG.SEMANAL_NUEVA_SALA_URL, 
       icon: '🔥', 
       diarios: () => CONFIG.DIARIOS_NUEVA_SALA_URL, 
       sanciones: () => CONFIG.SANCIONES_NUEVA_SALA_URL 
   },
   ```

4. **En ranking.html**:
   - Agrega botón filtro:
   ```html
   <button class="filtro-btn" data-sala="Nueva Sala">Nueva Sala</button>
   ```

---

## 7. Resolución de Problemas

### Problema: Ranking muestra "Sin datos para ZONA DE GUERRA 8"

**Causa**: El CSV tiene filas vacías o mal formateadas

**Solución**:
1. Verifica que cada fila tenga un número en la columna A (Slot)
2. Verifica que el Total en columna N sea un número válido
3. Ejecuta en consola del navegador:
```javascript
// Descarga y loguea el CSV para debug
const data = await fetchSheetData(CONFIG.SEMANAL_ZGUERRA_URL);
console.log('Primera fila de datos:', data[3]);
console.log('Total del primer clan:', data[3][13]);
```

### Problema: Totales incorrectos o muy bajos

**Causa**: Se está leyendo de la columna incorrecta

**Solución**:
1. Verifica el índice en la línea: `const total = parseFloat(r[13]) || 0;`
2. Abre el Google Sheet y cuenta columnas desde A=0
3. Actualiza el índice si es necesario

---

## 8. Archivos Modificados

| Archivo | Línea | Cambio |
|---------|-------|--------|
| [config-global.js](config-global.js) | 17 | URL actualizada |
| [ranking.js](ranking.js) | ~113-135 | Función buildSalaRankingItems |

---

## 📋 Resumen Técnico

- **Patrón**: Parser CSV genérico que salta headers y mapea columnas por índice
- **Ventaja**: Escalable para múltiples salas
- **Próxima mejora**: Detectar headers automáticamente en lugar de hardcodear `startIdx = 3`

---

*Documentación generada: 4 de Mayo de 2026*
