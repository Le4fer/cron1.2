# CronosMind - Sistema de Disciplina Personal

Una aplicación web completa para gestión de metas, journaling diario y seguimiento de cronogramas personales.

## Características

- **Dashboard Interactivo**: Vista general con estadísticas, calendario mensual y metas del día
- **Cronograma Maestro**: Visualización anual, trimestral y mensual de actividades
- **Seguimiento de Objetivos**: Gestión completa de metas con KPIs y gráficos
- **Journaling**: Registro diario de reflexiones con timeline y mapa de calor
- **Asistente IA**: Ayuda contextual integrada
- **PWA**: Funciona offline con service worker
- **Persistencia**: LocalStorage + backend PHP para sincronización

## Instalación y Uso

### Requisitos

- Servidor web con PHP 7.4+ (Apache/Nginx)
- Navegador moderno con soporte ES6

### Instalación

1. Clona o descarga el proyecto
2. Coloca los archivos en el directorio raíz del servidor web
3. Asegúrate de que PHP tenga permisos de escritura en `data/`
4. Abre `index.html` en el navegador

### Servidor de Desarrollo

```bash
cd /path/to/cronosmind
php -S localhost:8000
```

Luego abre http://localhost:8000

## Estructura del Proyecto

- `index.html` - Página de carga
- `dashboard.html` - Dashboard principal
- `cronograma.html` - Cronograma maestro
- `goals.html` - Gestión de metas
- `journal.html` - Journaling diario
- `css/` - Estilos CSS
- `js/` - Scripts JavaScript
- `php/` - Backend PHP
- `data/` - Almacenamiento de datos
- `assets/` - Recursos estáticos

## Funcionalidades Principales

### Dashboard

- Estadísticas en tiempo real
- Calendario interactivo
- Metas diarias
- Journaling rápido
- Exportación de datos

### Cronograma

- Vista anual con previews mensuales
- Vista trimestral con estadísticas
- Vista mensual detallada
- Navegación intuitiva

### Metas

- Creación y edición de objetivos
- Clasificación por tipo y prioridad
- Seguimiento de progreso
- Gráficos y KPIs

### Journaling

- Editor con selector de estado de ánimo
- Timeline cronológico
- Filtros por período
- Mapa de calor de actividad

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript ES6
- **Backend**: PHP puro (sin frameworks)
- **Persistencia**: JSON + LocalStorage
- **PWA**: Service Worker + Manifest
- **UI**: Diseño responsive, componentes modulares

## Contribución

El proyecto está bien estructurado con clases modulares. Para contribuir:

1. Mantén la estructura de clases
2. Usa addEventListener en lugar de onclick
3. Valida inputs del usuario
4. Añade tests para nuevas funcionalidades

## Licencia

Proyecto personal - uso libre para aprendizaje y desarrollo personal.
