# 📊 Guía de Configuración - Panel Admin

## ✅ Lo que se ha implementado

### 1. **Integración con Google Sheets**
El panel admin ahora carga datos automáticamente desde Google Sheets en:

- **CLANES** - Directorio de todos los clanes con logo, tag, líder, puntos y estado
- **RANKINGS** - Rankings semanales por sala (puedes cambiar de sala con el selector)
- **TOP 3** - Los 3 clanes con más puntos (con medallas 🥇 🥈 🥉)
- **ASISTENCIA** - Tabla de asistencia con 31 días (A=Presente, P=Presentación, -=Ausente)
- **CONTACTOS** - Directorio con líder, teléfono y datos de contacto
- **SANCIONES** - Control de sanciones por sala (solo para CEO)

---

## 🔐 Credenciales de Acceso

### 👑 Acceso Total (CEO)
```
Usuario: admin       | Contraseña: Admin123
Usuario: eva         | Contraseña: Eva123
Usuario: cruz        | Contraseña: Cruz123
```

### 📊 Acceso Limitado (Hosts)
```
Usuario: toxica      | Contraseña: Toxica123   → Zona Xtreme
Usuario: michi       | Contraseña: Michi123    → Isla Extinción
Usuario: luz         | Contraseña: Luz123      → Zona Guerra
```

---

## 🚀 Cómo Usar

### Paso 1: Abrir Admin Panel
```
1. Abre admin.html en el navegador
2. Inicia sesión con tus credenciales
```

### Paso 2: Navegar por Tabs
Los tabs disponibles dependen de tu rol:
- **CEO**: Acceso a todos los tabs + funciones de administración
- **Host**: Acceso limitado a Contactos y Rankings de su sala

### Paso 3: Cargar Datos
```
- Los datos se cargan automáticamente al abrir cada tab
- Usa el botón "🔄 Actualizar" para recargar datos manuales
- Cambia de sala en el selector para ver diferentes rankings
```

---

## 📝 Estructura de Datos

### Google Sheet Principal
Columnas esperadas:
```
A: Nombre del Clan
B: Tag (ej: TOP, YOSHI)
C: Logo URL
D: Nombre del Líder
E: Puntos Totales
F: Estado (Activo/Inactivo)
```

### Google Sheet Asistencia
```
A: Nombre del Clan
B-AF: Días 1-31 (A=Presente, P=Presentación, -=Ausente)
```

### Google Sheet Rankings (por sala)
```
A: Nombre del Clan
B: Puntos Semanales
```

---

## 🔧 Troubleshooting

### El panel no carga datos
✅ Solución: Abre F12 y revisa la consola para mensajes de error

### Obtengo error "Error al cargar datos"
✅ Solución: Verifica que:
1. Las URLs de Google Sheets estén correctas en config-global.js
2. Los Google Sheets sean públicos (compartidos con "Todos")
3. Tu conexión a internet esté activa

### No veo algunos tabs
✅ Solución: Algunos tabs son solo para CEO. Inicia como `admin/Admin123` para ver todos

---

## 📋 Funciones Disponibles

| Función | Descripción |
|---------|-----------|
| `loadClanesTab()` | Carga directorio de clanes |
| `loadRankingsTab()` | Carga rankings según sala |
| `loadTop3Tab()` | Muestra top 3 clanes |
| `loadAsistenciaTab()` | Carga tabla de asistencia |
| `loadContactosTab()` | Carga contactos y teléfonos |
| `loadSancionesTab()` | Carga sanciones (CEO only) |

---

## 🎯 Próximos Pasos

- [ ] Agregar funciones de exportar a CSV
- [ ] Implementar edición en vivo de datos
- [ ] Agregar búsqueda y filtrado avanzado
- [ ] Crear gráficos de estadísticas
- [ ] Implementar sistema de notificaciones

---

**Última actualización**: 18 May 2026
**Estado**: ✅ Operativo - Panel Admin con datos de Google Sheets
