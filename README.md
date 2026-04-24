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
