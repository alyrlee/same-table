# Same Table — by Health + Heritage

Your culture's food. Your family's table. Just better for you.

A full-stack React PWA that works on mobile, desktop, and **offline**.

---

## For Users

### What This App Does

Same Table helps you find healthier versions of the cultural dishes you grew up eating. Search for a dish, see its nutrition breakdown side-by-side with a healthier alternative, and get step-by-step cooking instructions — all while preserving the flavors your family loves.

### Features

- **Search & Browse** — Find dishes by name or filter by culture (Jamaican, Puerto Rican, Dominican, Central American, Soul Food, West African, Haitian)
- **Side-by-Side Comparison** — See the original recipe vs. a healthier version with full nutrition bars, calorie savings, and ingredient swaps highlighted
- **My Pantry** — Add ingredients you already have at home and get meal suggestions you can cook tonight, ranked by health score
- **Same Table Helper Chatbot** — Ask questions like "make my rice healthier" or "diabetic-friendly meals" and get instant culturally-aware suggestions
- **4 Languages** — Switch between English, Spanish, Portuguese, and French at any time
- **Works Offline** — After your first visit the app caches everything locally. No Wi-Fi? No problem. Your pantry items and saved recipes persist in your browser's local database
- **Mobile-First** — Bottom tab navigation, touch-friendly cards, and safe-area support for modern phones

### How to Use

1. **Browse** the home page to see popular dishes across cultures
2. **Tap a dish** to see the original vs. healthier version with full nutrition and cooking steps
3. **Use the search bar** or quick-search tags to jump to a specific dish
4. **Open My Pantry** (bottom tab or top nav) to add what's in your kitchen and get personalized meal ideas
5. **Tap the chat bubble** in the bottom-right corner to ask Same Table Helper anything about nutrition or cooking
6. **Switch language** using the bar at the very top of the screen

---

## For Developers

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 7 |
| Styling | Vanilla CSS with CSS custom properties |
| State | React Context + IndexedDB (offline persistence) |
| Offline/PWA | vite-plugin-pwa (Workbox), service worker with NetworkFirst API caching |
| Backend | Express 5, Node.js |
| Database | SQLite (better-sqlite3) |
| Auth | JWT + bcrypt, email/password + SSO + guest mode |
| i18n | Custom lightweight solution (no library dependency) |

### Project Architecture

```
same-table/
│
├── index.html                 # HTML shell with font preloads & PWA meta tags
├── vite.config.js             # Vite + PWA service worker configuration
├── package.json               # Scripts: dev, build, start, server
│
├── public/
│   └── favicon.svg            # SVG logo used as favicon
│
├── server/
│   ├── index.js               # Express 5 API + production static file server
│   ├── db.js                  # SQLite database setup
│   └── routes/                # API route handlers
│       ├── auth.js            # Authentication (register, login, guest, SSO)
│       ├── recipes.js         # Recipe CRUD + search
│       └── nutrition.js       # USDA & Nutritionix nutrition lookup
│
└── src/
    ├── main.jsx               # React DOM entry point
    ├── App.jsx                # BrowserRouter + AppProvider + route definitions
    │
    ├── views/                 # Page-level components (one per route)
    │   ├── Home.jsx           # Hero, search, culture filters, food card grid
    │   ├── Compare.jsx        # Original vs. healthier recipe side-by-side
    │   ├── Pantry.jsx         # Ingredient input + meal suggestions
    │   ├── Terms.jsx          # Terms of Service
    │   └── Privacy.jsx        # Privacy Policy
    │
    ├── components/            # Reusable UI components
    │   ├── Navbar.jsx         # Sticky top nav with logo + actions
    │   ├── BottomNav.jsx      # Mobile bottom tab bar (5 tabs)
    │   ├── FoodCard.jsx       # Dish card with tags, culture label, CTA
    │   ├── ChatBot.jsx        # Floating chat widget with quick replies
    │   ├── FoodCamera.jsx     # AI food photo recognition (HuggingFace CLIP)
    │   ├── LangBar.jsx        # Language switcher bar (EN/ES/PT/FR)
    │   ├── AuthModal.jsx      # Sign up / Log in modal
    │   └── Logo.jsx           # Inline SVG logo component
    │
    ├── data/                  # Static data (acts as local database)
    │   ├── recipes.js         # All recipes, nutrition, ingredients, steps
    │   └── i18n.js            # Translation strings for 4 languages
    │
    ├── utils/
    │   └── api.js             # API fetch wrapper for all endpoints
    │
    ├── hooks/
    │   └── useAppContext.jsx  # Global state: language, online status, auth,
    │                          # pantry (IndexedDB), saved recipes
    │
    └── styles/
        └── global.css         # All styles — responsive, mobile-first,
                               # CSS variables for theming
```

### Data Flow

```
User Action
    │
    ▼
React View (Home / Compare / Pantry)
    │
    ├─► useApp() hook ──► React Context (lang, online, auth, pantry state)
    │                          │
    │                          ├─► localStorage (language preference, JWT token)
    │                          └─► IndexedDB (pantry items, saved recipes)
    │
    ├─► recipes.js (static data, available offline)
    │
    └─► /api/* (Express backend, cached by service worker when offline)
```

### Offline Strategy

1. **Service Worker** (generated by vite-plugin-pwa / Workbox) precaches all built assets (JS, CSS, HTML, fonts)
2. **Google Fonts** are cached with `CacheFirst` strategy (fonts rarely change)
3. **API responses** are cached with `NetworkFirst` strategy — tries network, falls back to cached response within 3 seconds
4. **Pantry & Saved Recipes** are stored in **IndexedDB**, not dependent on network
5. **Language preference** is stored in **localStorage**
6. **Online/offline banner** appears automatically via `navigator.onLine` event listeners

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/recipes` | List all recipes (query: `?culture=`, `?search=`) |
| GET | `/api/recipes/:id` | Get single recipe by ID |
| GET | `/api/search?q=` | Search recipes by name, culture, or tag |
| POST | `/api/pantry/suggest` | Get meal suggestions from ingredient list |
| POST | `/api/auth/register` | Create account (email, password, name) |
| POST | `/api/auth/login` | Log in (email, password) |
| POST | `/api/auth/guest` | Create guest session |
| GET | `/api/auth/me` | Get current user (requires JWT) |
| GET | `/api/nutrition/usda/:query` | USDA nutrition lookup |
| GET | `/api/nutrition/search/:query` | Nutritionix instant search |
| POST | `/api/nutrition/natural` | Nutritionix natural language nutrition |

### Running Locally

```bash
# Install dependencies
npm install

# Development (hot reload on :5173, API proxy to :3001)
# Terminal 1: Start the backend
npm run server

# Terminal 2: Start the frontend
npm run dev

# Production build
npm run build

# Production server (serves built app + API on :3001)
npm start
```

### Design Tokens (CSS Variables)

| Variable | Value | Usage |
|----------|-------|-------|
| `--forest` | `#2D6B1A` | Primary green, healthy indicators |
| `--forest-deep` | `#1A3D0E` | Hero backgrounds, dark accents |
| `--terra` | `#C05C2A` | Warm accent, CTAs |
| `--saffron` | `#E8A838` | Gold accents, offline banner |
| `--table-brown` | `#5C3D2E` | Warm brown, cultural warmth |
| `--obsidian` | `#1A1A1A` | Primary text |
| `--linen` | `#F8F4EE` | Page background |
| `--cream` | `#FDF9F4` | Card backgrounds |

### Fonts

- **Playfair Display** (serif) — Headings, brand name, display text
- **Cormorant Garamond** (serif) — Elegant accents, quotes
- **Lato** (sans-serif) — Body text, UI elements

---

## License

ISC
