# INFINITE — Managed by MEDELITE · Facility Assessment Snapshot

A full-stack micro-app that turns a **CCN** (CMS Certification Number) into a branded,
print-ready **Facility Assessment Snapshot**. It pulls live **CMS Care Compare** data,
blends in **Medelite manual operational inputs**, renders a live WYSIWYG report canvas, and
exports pixel-matched **PDF** and editable **Word (.docx)** reports.

> **Sample test CCN:** `686123` (Kendall Lakes Healthcare and Rehab Center, FL)

The UI implements the **"Clinical Minimalism / Report-First Canvas"** Stitch design
(`facility_assessment_snapshot_dashboard`): a fixed Facility Controls sidebar, a sticky
"INFINITE — Managed by MEDELITE / Clinical Audit Dashboard" top bar, and a centered white
A4-style report canvas with Merriweather headings, zebra tables, and a Clinical Advisory.

---

## Highlights

**Core MVP**
- Dynamic CCN lookup against the live **CMS Provider Data Catalog API**
- Auto-populated facility name, location, certified beds, and 4 star ratings
- **Facility name override** (CMS legal name by default, custom name wins on the report)
- Manual operational inputs (EMR, current census, patient type, Medelite history, etc.)
- One-click **PDF export** (server-side Puppeteer for pixel-perfect output)
- Clickable **Medicare Care Compare** hyperlink in every export
- Hardcoded `INFINITE — Managed by MEDELITE` branding banner (never overwritten by the facility name)

**Bonus features (all implemented)**
- **All 12 hospitalization / ED metrics** — Short-Stay & Long-Stay hospitalization + ED visits,
  each with **facility / state avg / national avg** (4 measures × 3 columns = 12 values),
  programmatically renamed from the verbose CMS measure descriptions
- **Word (.docx) export** with the same data and a live clickable hyperlink
- **Responsive cards & charts** (Recharts in the browser, CSS/embedded-image charts in exports)
- **Advanced error handling** — inline CCN validation, friendly retry on API errors,
  `Data not available` + tooltips for missing metrics, timeouts, rate-limit smoothing
- **High-fidelity polish** — loading skeletons, success/error toasts, accessible forms,
  Clinical Advisory callout, print CSS for the report canvas

---

## Architecture

```
medelite-facility-snapshot/
├── server/                 # Node + Express + TypeScript API
│   └── src/
│       ├── cms/            # CMS client (retry/backoff/timeout), dataset IDs, normalization + 12-metric mapping
│       ├── report/         # Shared HTML template, Puppeteer PDF, docx Word, formatting helpers
│       ├── routes/         # /api/facility/:ccn, /api/report/pdf|docx|preview
│       └── middleware/     # API-key guard, centralized error handler
└── client/                 # React + Vite + TypeScript + Tailwind
    └── src/
        ├── components/     # TopBar, ControlsSidebar, ReportCanvas, charts, cards, states, actions
        ├── context/        # FormContext (form state), ToastContext
        ├── hooks/          # useFacility (React Query)
        └── api/            # typed fetch client + file download helpers
```

### Tech stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Recharts, React Query (data) + Context (form state)
- **Backend:** Node 20, Express, TypeScript, Puppeteer (PDF), `docx` (Word), compression + rate limiting
- **Caching:** in-memory TTL cache for CMS responses (drop-in seam for Redis)

---

## Data sources & mapping

All data comes from the **CMS Provider Data Catalog** (`data.cms.gov/provider-data`):

| Report field | CMS dataset | Dataset ID |
| --- | --- | --- |
| Name, location, beds, star ratings, staffing | Provider Information | `4pq5-n9py` |
| Facility hospitalization/ED scores | Medicare Claims Quality Measures | `ijh5-nb2v` |
| State & National benchmark averages | State US Averages | `xcdc-v8bm` |

**The 12 hospitalization / ED metrics** (STR = Short-Stay, LT = Long-Stay):

| Report label | CMS measure code | Unit |
| --- | --- | --- |
| Short-Stay Hospitalization | 521 | % |
| Short-Stay ED Visit | 522 | % |
| Long-Stay Hospitalization | 551 | per 1,000 days |
| Long-Stay ED Visit | 552 | per 1,000 days |

Facility values use the CMS **risk-adjusted score** (the headline figure on Care Compare).
State/National averages are joined from the State US Averages dataset by `state_or_nation`.

---

## Getting started

**Prerequisites:** Node.js ≥ 18 (developed on Node 20).

```bash
# 1. Install all workspaces
npm install

# 2. Configure the server (optional — sensible defaults are built in)
cp server/.env.example server/.env

# 3. Run API + web app together (server :4000, client :5173)
npm run dev
```

Open **http://localhost:5173**, enter `686123`, and download a PDF/Word report.

### Useful scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Run server + client concurrently |
| `npm run build` | Type-check & build both workspaces |
| `npm start` | Run the compiled production server |
| `npm test` | Run server unit tests (Vitest) |

### API endpoints
| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness probe |
| `GET` | `/api/facility/:ccn` | Normalized facility snapshot JSON |
| `POST` | `/api/report/pdf` | Branded PDF (Puppeteer) |
| `POST` | `/api/report/docx` | Editable Word document |
| `POST` | `/api/report/preview` | Raw HTML (debugging PDF parity) |

---

## Environment variables (`server/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins (`*` allowed) |
| `API_KEY` | *(empty)* | If set, clients must send `x-api-key`. Empty = open (internal/local) |
| `CACHE_TTL_SECONDS` | `3600` | CMS response cache TTL |
| `CMS_TIMEOUT_MS` | `30000` | Upstream CMS request timeout |
| `CMS_MAX_RETRIES` | `3` | Retry attempts (exponential backoff + jitter) |

---

## Error handling & resilience

- **Invalid CCN** → inline validation (≤ 6 digits, zero-padded) before any request.
- **Facility not found (404)** → friendly error state, no retry button.
- **CMS upstream / timeout** → exponential backoff with jitter; user sees a clear message + **Retry**.
- **Missing metric values** → render `Data not available` / `N/A` with a tooltip and source footnote.
- **Partial data** → core provider info still renders; an amber banner + footnote lists what was unavailable.
- **Rate limiting** → 60 req/min per IP, plus the cache smooths repeat CMS lookups.
- **Timeouts** → 12 s client-side, 30 s server-side upstream.

---

## Security & compliance

- CMS Care Compare data is **public** — no PHI is fetched or stored.
- Manual inputs live only in browser state and the export request; they are **not persisted**.
- Only metadata/errors are logged server-side; sensitive inputs are never written to logs.
- Optional API-key gate + rate limiting for internal multi-user use.

---

## Deployment

- **Frontend:** build with `npm --workspace client run build` → deploy `client/dist` to Vercel/Netlify.
- **Backend:** deploy `server/` to Render/Railway/AWS. Puppeteer needs a Chromium-capable image
  (`--no-sandbox` flags are already set). Set `CORS_ORIGIN` to the deployed frontend URL.
- A managed Redis can back the cache for multi-instance deployments.

---

## Assumptions & notes

1. **Live API over CSV snapshots.** The CMS Provider Data Catalog API returns everything needed,
   so it is the primary source; the CSV fallback is documented as the degradation strategy
   (`partial`/`warnings`).
2. **Facility metric value = risk-adjusted score** (Care Compare's headline number; observed is the fallback).
3. **Dataset IDs are pinned** in `server/src/cms/datasets.ts`; update there if CMS rotates one.
4. **Care Compare URL** matches the brief's sample output: `https://www.medicare.gov/care-compare/details/nursing-home/{CCN}/view-all?state={STATE}`.
5. **Charts in exports** embed the browser-rendered chart image when available and fall back to a
   pure-CSS chart so PDFs/Word never depend on external assets.

> **Local dev note:** keep this project **outside** an iCloud-synced folder (e.g. not in
> `~/Downloads` with "Optimize Mac Storage" on) and ensure several GB of free disk — otherwise
> macOS may evict `node_modules`/source files when the disk fills.

---

## Test cases (CCN 686123 — Kendall Lakes)

- Facility name → `KENDALL LAKES HEALTHCARE AND REHAB CENTER`; Location → Miami, FL 33185.
- Census Capacity → `150` certified beds; State badge → `FL`.
- Star ratings populate (Overall 5 / Health 5 / Staffing 2 / Quality 5).
- All 12 hospitalization/ED values populate with state + national comparisons; cells above the
  national benchmark are highlighted (e.g. Short-Stay & Long-Stay Hospitalization).
- PDF and Word both download with the branding banner and a clickable Care Compare link.
- Unit tests (`npm test`) cover value formatting, star rendering, and variance math.
