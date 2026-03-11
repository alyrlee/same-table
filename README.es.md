# Health + Heritage — Come Esto, No Aquello

Descubre versiones mas saludables de los platillos caribenos, centroamericanos y soul food que tu familia ama — sin perder el sabor.

Una aplicacion full-stack en React (PWA) que funciona en movil, escritorio y **sin conexion a internet**.

---

## Para Usuarios

### Que Hace Esta App

Health + Heritage te ayuda a encontrar versiones mas saludables de los platillos culturales con los que creciste. Busca un platillo, ve su informacion nutricional comparada con una alternativa mas saludable, y obtiene instrucciones de cocina paso a paso — todo preservando los sabores que tu familia ama.

### Funcionalidades

- **Buscar y Explorar** — Encuentra platillos por nombre o filtra por cultura (Jamaicana, Puertorriquena, Dominicana, Centroamericana, Soul Food, Africana Occidental, Haitiana)
- **Comparacion Lado a Lado** — Ve la receta original vs. la version mas saludable con barras de nutricion, ahorro de calorias e ingredientes sustituidos resaltados
- **Mi Despensa** — Agrega ingredientes que ya tienes en casa y recibe sugerencias de comidas que puedes preparar esta noche, clasificadas por puntuacion de salud
- **Chatbot Heritage Helper** — Haz preguntas como "hacer mi arroz mas sano" o "comidas para diabeticos" y recibe sugerencias instantaneas culturalmente relevantes
- **4 Idiomas** — Cambia entre Ingles, Espanol, Portugues y Frances en cualquier momento
- **Funciona Sin Internet** — Despues de tu primera visita, la app guarda todo localmente. Sin Wi-Fi? No hay problema. Tus ingredientes de despensa y recetas guardadas persisten en la base de datos local de tu navegador
- **Disenada para Movil** — Navegacion por pestanas inferiores, tarjetas tactiles y soporte de areas seguras para telefonos modernos

### Como Usar

1. **Explora** la pagina principal para ver platillos populares de diferentes culturas
2. **Toca un platillo** para ver el original vs. la version mas saludable con nutricion completa y pasos de cocina
3. **Usa la barra de busqueda** o las etiquetas rapidas para ir directamente a un platillo especifico
4. **Abre Mi Despensa** (pestana inferior o navegacion superior) para agregar lo que tienes en tu cocina y obtener ideas de comidas personalizadas
5. **Toca la burbuja de chat** en la esquina inferior derecha para preguntarle a Heritage Helper cualquier cosa sobre nutricion o cocina
6. **Cambia el idioma** usando la barra en la parte superior de la pantalla

---

## Para Desarrolladores

### Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 19, React Router 7, Vite 7 |
| Estilos | CSS vanilla con propiedades personalizadas CSS |
| Estado | React Context + IndexedDB (persistencia offline) |
| Offline/PWA | vite-plugin-pwa (Workbox), service worker con cache NetworkFirst para API |
| Backend | Express 5, Node.js |
| i18n | Solucion ligera personalizada (sin dependencia de libreria) |

### Arquitectura del Proyecto

```
eat-this-not-that/
│
├── index.html                 # Shell HTML con precarga de fuentes y meta tags PWA
├── vite.config.js             # Configuracion de Vite + service worker PWA
├── package.json               # Scripts: dev, build, start, server
│
├── public/
│   └── favicon.svg            # Logo SVG usado como favicon
│
├── server/
│   └── index.js               # API Express 5 + servidor de archivos estaticos en produccion
│
└── src/
    ├── main.jsx               # Punto de entrada React DOM
    ├── App.jsx                # BrowserRouter + AppProvider + definiciones de rutas
    │
    ├── views/                 # Componentes a nivel de pagina (uno por ruta)
    │   ├── Home.jsx           # Hero, busqueda, filtros de cultura, grilla de tarjetas
    │   ├── Compare.jsx        # Receta original vs. mas saludable lado a lado
    │   └── Pantry.jsx         # Entrada de ingredientes + sugerencias de comidas
    │
    ├── components/            # Componentes de UI reutilizables
    │   ├── Navbar.jsx         # Navegacion superior fija con logo + acciones
    │   ├── BottomNav.jsx      # Barra de pestanas inferior para movil (5 pestanas)
    │   ├── FoodCard.jsx       # Tarjeta de platillo con etiquetas, cultura, CTA
    │   ├── ChatBot.jsx        # Widget de chat flotante con respuestas rapidas
    │   ├── LangBar.jsx        # Barra de cambio de idioma (EN/ES/PT/FR)
    │   └── Logo.jsx           # Componente de logo SVG inline
    │
    ├── data/                  # Datos estaticos (actua como base de datos local)
    │   ├── recipes.js         # Todas las recetas, nutricion, ingredientes, pasos
    │   └── i18n.js            # Cadenas de traduccion para 4 idiomas
    │
    ├── hooks/
    │   └── useAppContext.jsx  # Estado global: idioma, estado de conexion,
    │                          # despensa (IndexedDB), recetas guardadas
    │
    └── styles/
        └── global.css         # Todos los estilos — responsivos, mobile-first,
                               # variables CSS para tematizacion
```

### Flujo de Datos

```
Accion del Usuario
    │
    ▼
Vista React (Home / Compare / Pantry)
    │
    ├─► hook useApp() ──► React Context (idioma, conexion, estado de despensa)
    │                          │
    │                          ├─► localStorage (preferencia de idioma)
    │                          └─► IndexedDB (ingredientes de despensa, recetas guardadas)
    │
    ├─► recipes.js (datos estaticos, disponibles offline)
    │
    └─► /api/* (backend Express, cacheado por service worker cuando esta offline)
```

### Estrategia Offline

1. **Service Worker** (generado por vite-plugin-pwa / Workbox) precachea todos los recursos construidos (JS, CSS, HTML, fuentes)
2. **Google Fonts** se cachean con estrategia `CacheFirst` (las fuentes rara vez cambian)
3. **Respuestas de API** se cachean con estrategia `NetworkFirst` — intenta la red, usa el cache si no hay respuesta en 3 segundos
4. **Despensa y Recetas Guardadas** se almacenan en **IndexedDB**, no dependen de la red
5. **Preferencia de idioma** se almacena en **localStorage**
6. **Banner online/offline** aparece automaticamente via listeners de eventos `navigator.onLine`

### Endpoints de API

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/health` | Verificacion de estado del servidor |
| GET | `/api/recipes` | Listar todas las recetas (query: `?culture=`, `?search=`) |
| GET | `/api/recipes/:id` | Obtener receta individual por ID |
| GET | `/api/search?q=` | Buscar recetas por nombre, cultura o etiqueta |
| POST | `/api/pantry/suggest` | Obtener sugerencias de comidas a partir de lista de ingredientes |

### Ejecutar Localmente

```bash
# Instalar dependencias
npm install

# Desarrollo (recarga en caliente en :5173, proxy de API a :3001)
npm run dev

# Construccion para produccion
npm run build

# Servidor de produccion (sirve la app construida + API en :3001)
npm start

# Ejecutar solo el servidor API
npm run server
```

### Tokens de Diseno (Variables CSS)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--forest` | `#2D6B1A` | Verde primario, indicadores saludables |
| `--clay` | `#C8553D` | Rojo de acento, etiquetas de advertencia, CTAs |
| `--gold` | `#E8A838` | Acentos del hero, banner offline |
| `--cream` | `#FAF6EE` | Fondo de pagina |
| `--sand` | `#EDE3D4` | Bordes de tarjetas, fondos sutiles |
| `--charcoal` | `#1C1C1E` | Texto primario |

### Fuentes

- **Fraunces** (serif) — Titulos, nombre de marca, puntuaciones
- **DM Sans** (sans-serif) — Texto de cuerpo, elementos de UI

---

## Licencia

ISC
