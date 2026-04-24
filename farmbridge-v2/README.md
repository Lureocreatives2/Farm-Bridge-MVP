# 🌾 FarmBridge v2

Nigerian agricultural marketplace. Five languages. Mobile-first. Zero commission.

## File Map

```
farmbridge-v2/
├── netlify.toml          Frontend deploy (Netlify)
├── render.yaml           Backend deploy (Render IaC)
├── backend/
│   ├── server.js         Express entry point
│   ├── package.json      npm scripts: dev, start, db:seed, db:reset, test:api
│   ├── .env.example
│   ├── prisma/schema.prisma   users + farmers + products
│   ├── lib/
│   │   ├── prisma.js     Singleton client
│   │   └── cloudinary.js Multer upload middleware
│   ├── middleware/
│   │   ├── logger.js     Request logger (no deps)
│   │   ├── rateLimit.js  In-memory limiter (10 POST/min, 60 GET/min)
│   │   ├── sanitize.js   XSS strip on all string body fields
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── health.js     GET /health  +  GET /api/stats
│   │   ├── products.js   POST + GET + GET/:id + PATCH/:id + DELETE/:id
│   │   └── farmers.js    GET /api/farmers/:id
│   └── scripts/
│       ├── seed.js       10 farmers, 15 products, real Nigerian data
│       └── test-api.js   Integration tests, no library needed
└── frontend/
    ├── manifest.json     PWA manifest
    ├── sw.js             Service worker (offline support)
    ├── css/style.css     Mobile-first design system
    ├── js/
    │   ├── i18n.js       Language engine
    │   └── api.js        fetch() helpers, card renderer, offline detection
    ├── lang/
    │   ├── en.json  yo.json  ha.json  ig.json  pc.json
    └── pages/
        ├── index.html    Browse: search, filters, shareable URLs
        ├── list.html     Farmer listing form
        ├── product.html  Detail + WhatsApp CTA + Share button
        ├── farmer.html   Public farmer profile
        ├── manage.html   My Listings: view + edit modal + delete
        └── 404.html
```

## Quickstart

```bash
cd backend
npm install
cp .env.example .env          # fill in DB + Cloudinary values
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed               # load sample data
npm run dev                   # → http://localhost:5000

# Frontend — separate terminal
npx serve ../frontend/pages   # → http://localhost:3000
```

## API Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | /health | DB ping |
| GET | /api/stats | Live counts |
| POST | /api/products | Create listing (multipart) |
| GET | /api/products | Browse + search + filter + paginate |
| GET | /api/products/:id | Single product |
| PATCH | /api/products/:id | Update listing (phone as ownership proof) |
| DELETE | /api/products/:id | Remove listing (phone as ownership proof) |
| GET | /api/farmers/:id | Public farmer profile |

## Deploy

**Backend → Render**
- Root dir: `backend`
- Build: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start: `npm start`
- Health check: `/health`
- Env vars: `DATABASE_URL`, `CLOUDINARY_*`, `FRONTEND_URL`, `NODE_ENV=production`

**Frontend → Netlify**
1. Update `API_BASE` in `frontend/js/api.js` to Render URL
2. Drop `frontend/` folder on app.netlify.com/drop

## npm Scripts

```bash
npm run dev          # hot-reload dev server
npm run db:seed      # load 10 farmers + 15 realistic products
npm run db:reset     # wipe + re-seed (dev only)
npm run test:api     # integration tests (server must be running)
npm run db:studio    # Prisma Studio GUI
```

## After MVP

- JWT auth (replace phone-as-auth)
- Farmer verification badge
- Admin dashboard
- Paystack payments
- Termii SMS notifications
- Socket.io messaging
- USSD for feature phones (Africa's Talking)

---
*No middlemen · No commission · Built for Naija farmers 🇳🇬*
