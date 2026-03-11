# La Misma Mesa — por Health + Heritage

La comida de tu cultura. La mesa de tu familia. Solo que mejor para ti.

Una aplicacion full-stack en React (PWA) que funciona en movil, escritorio y **sin conexion a internet**.

---

## Para Usuarios

### Que Hace Esta App

La Misma Mesa te ayuda a encontrar versiones mas saludables de los platillos culturales con los que creciste. Busca un platillo, ve su informacion nutricional comparada con una alternativa mas saludable, y obtiene instrucciones de cocina paso a paso — todo preservando los sabores que tu familia ama.

### Funcionalidades

- **Buscar y Explorar** — Encuentra platillos por nombre o filtra por cultura (Jamaicana, Puertorriquena, Dominicana, Centroamericana, Soul Food, Africana Occidental, Haitiana)
- **Comparacion Lado a Lado** — Ve la receta original vs. la version mas saludable con barras de nutricion, ahorro de calorias e ingredientes sustituidos resaltados
- **Mi Despensa** — Agrega ingredientes que ya tienes en casa y recibe sugerencias de comidas que puedes preparar esta noche, clasificadas por puntuacion de salud
- **Chatbot La Misma Mesa** — Haz preguntas como "hacer mi arroz mas sano" o "comidas para diabeticos" y recibe sugerencias instantaneas culturalmente relevantes
- **4 Idiomas** — Cambia entre Ingles, Espanol, Portugues y Frances en cualquier momento
- **Funciona Sin Internet** — Despues de tu primera visita, la app guarda todo localmente. Sin Wi-Fi? No hay problema. Tus ingredientes de despensa y recetas guardadas persisten en la base de datos local de tu navegador
- **Disenada para Movil** — Navegacion por pestanas inferiores, tarjetas tactiles y soporte de areas seguras para telefonos modernos

### Como Usar

1. **Explora** la pagina principal para ver platillos populares de diferentes culturas
2. **Toca un platillo** para ver el original vs. la version mas saludable con nutricion completa y pasos de cocina
3. **Usa la barra de busqueda** o las etiquetas rapidas para ir directamente a un platillo especifico
4. **Abre Mi Despensa** (pestana inferior o navegacion superior) para agregar lo que tienes en tu cocina y obtener ideas de comidas personalizadas
5. **Toca la burbuja de chat** en la esquina inferior derecha para preguntarle al asistente cualquier cosa sobre nutricion o cocina
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
| Base de datos | SQLite (better-sqlite3) |
| Auth | JWT + bcrypt, email/password + SSO + modo invitado |
| i18n | Solucion ligera personalizada (sin dependencia de libreria) |

### Arquitectura del Proyecto

```
same-table/
│
├── index.html                 # Shell HTML con precarga de fuentes y meta tags PWA
├── vite.config.js             # Configuracion de Vite + service worker PWA
├── package.json               # Scripts: dev, build, start, server
│
├── public/
│   └── favicon.svg            # Logo SVG usado como favicon
│
├── server/
│   ├── index.js               # API Express 5 + servidor de archivos estaticos en produccion
│   ├── db.js                  # Configuracion de base de datos SQLite
│   └── routes/                # Manejadores de rutas API
│       ├── auth.js            # Autenticacion (registro, login, invitado, SSO)
│       ├── recipes.js         # CRUD de recetas + busqueda
│       └── nutrition.js       # Consulta de nutricion USDA y Nutritionix
│
└── src/
    ├── main.jsx               # Punto de entrada React DOM
    ├── App.jsx                # BrowserRouter + AppProvider + definiciones de rutas
    │
    ├── views/                 # Componentes a nivel de pagina (uno por ruta)
    │   ├── Home.jsx           # Hero, busqueda, filtros de cultura, grilla de tarjetas
    │   ├── Compare.jsx        # Receta original vs. mas saludable lado a lado
    │   ├── Pantry.jsx         # Entrada de ingredientes + sugerencias de comidas
    │   ├── Terms.jsx          # Terminos de Servicio
    │   └── Privacy.jsx        # Politica de Privacidad
    │
    ├── components/            # Componentes de UI reutilizables
    │   ├── Navbar.jsx         # Navegacion superior fija con logo + acciones
    │   ├── BottomNav.jsx      # Barra de pestanas inferior para movil (5 pestanas)
    │   ├── FoodCard.jsx       # Tarjeta de platillo con etiquetas, cultura, CTA
    │   ├── ChatBot.jsx        # Widget de chat flotante con respuestas rapidas
    │   ├── FoodCamera.jsx     # Reconocimiento de fotos de comida con IA (HuggingFace CLIP)
    │   ├── LangBar.jsx        # Barra de cambio de idioma (EN/ES/PT/FR)
    │   ├── AuthModal.jsx      # Modal de registro / inicio de sesion
    │   └── Logo.jsx           # Componente de logo SVG inline
    │
    ├── data/                  # Datos estaticos (actua como base de datos local)
    │   ├── recipes.js         # Todas las recetas, nutricion, ingredientes, pasos
    │   └── i18n.js            # Cadenas de traduccion para 4 idiomas
    │
    ├── utils/
    │   └── api.js             # Wrapper de fetch para todos los endpoints
    │
    ├── hooks/
    │   └── useAppContext.jsx  # Estado global: idioma, estado de conexion, auth,
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
    ├─► hook useApp() ──► React Context (idioma, conexion, auth, estado de despensa)
    │                          │
    │                          ├─► localStorage (preferencia de idioma, token JWT)
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
| POST | `/api/pantry/suggest` | Sugerencias de comidas a partir de lista de ingredientes |
| POST | `/api/auth/register` | Crear cuenta (email, password, nombre) |
| POST | `/api/auth/login` | Iniciar sesion (email, password) |
| POST | `/api/auth/guest` | Crear sesion de invitado |
| GET | `/api/auth/me` | Obtener usuario actual (requiere JWT) |
| GET | `/api/nutrition/usda/:query` | Consulta de nutricion USDA |
| GET | `/api/nutrition/search/:query` | Busqueda instantanea Nutritionix |
| POST | `/api/nutrition/natural` | Nutricion por lenguaje natural Nutritionix |

### Ejecutar Localmente

```bash
# Instalar dependencias
npm install

# Desarrollo (recarga en caliente en :5173, proxy de API a :3001)
# Terminal 1: Iniciar el backend
npm run server

# Terminal 2: Iniciar el frontend
npm run dev

# Construccion para produccion
npm run build

# Servidor de produccion (sirve la app construida + API en :3001)
npm start
```

### Tokens de Diseno (Variables CSS)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--forest` | `#2D6B1A` | Verde primario, indicadores saludables |
| `--forest-deep` | `#1A3D0E` | Fondos de hero, acentos oscuros |
| `--terra` | `#C05C2A` | Acento calido, CTAs |
| `--saffron` | `#E8A838` | Acentos dorados, banner offline |
| `--table-brown` | `#5C3D2E` | Marron calido, calidez cultural |
| `--obsidian` | `#1A1A1A` | Texto primario |
| `--linen` | `#F8F4EE` | Fondo de pagina |
| `--cream` | `#FDF9F4` | Fondo de tarjetas |

### Fuentes

- **Playfair Display** (serif) — Titulos, nombre de marca, texto de exhibicion
- **Cormorant Garamond** (serif) — Acentos elegantes, citas
- **Lato** (sans-serif) — Texto de cuerpo, elementos de UI

---

## Licencia

ISC
