# Parking Lot SaaS — System Design

A multi-tenant, event-driven smart parking platform: cameras detect license plates, the
system auto-assigns parking slots, tracks occupancy in real time, and bills vehicles on
exit. Built as a TypeScript/Node microservices backend, a Python computer-vision service,
and a React frontend, wired together with Kafka-compatible event streaming and WebSockets.

## 1. High-level architecture

```
                                   ┌─────────────┐
                                   │   Frontend   │  React + Vite (5173)
                                   └──────┬───────┘
                          REST (JWT)      │      WebSocket (JWT)
                     ┌────────────────────┴───────────────┐
                     ▼                                     ▼
             ┌───────────────┐                     ┌────────────────┐
             │  api-gateway   │                     │ realtime-service│  Socket.IO (4010)
             │  (8080)        │                     │  (4010, stateless)
             └───────┬────────┘                     └────────▲────────┘
                      │ REST proxy / BFF                       │ Kafka consumer
     ┌────────────────┼────────────────┬───────────────┬───────┴──────┐
     ▼                ▼                ▼               ▼              ▼
┌─────────┐   ┌───────────────┐  ┌──────────────┐ ┌───────────┐ ┌──────────────┐
│  auth-   │   │ parking-core- │  │  vehicle-     │ │  camera-  │ │  pricing-     │
│ service  │   │  service      │  │  records-svc  │ │  service  │ │  billing-svc  │
│ (4001)   │   │  (4002)       │  │  (4003)       │ │  (4004)   │ │  (4005)       │
└────┬─────┘   └──────┬────────┘  └──────┬────────┘ └─────┬─────┘ └──────┬───────┘
     │                │                   │                │              │
     └──── MongoDB (Atlas, one logical DB per service) ─────┴──────────────┘
                                   │
                          ┌────────┴────────┐
                          │  Redpanda (Kafka)│  event bus (9092)
                          └────────┬────────┘
                                   │
                          ┌────────┴────────┐
                          │   cv-service     │  Python/FastAPI (8000)
                          │ (OCR / ANPR)     │
                          └──────────────────┘
```

Everything runs as Docker containers orchestrated by a single `docker-compose.yml`
(`infra/docker/docker-compose.yml`). There's no Kubernetes/Helm layer — this is a
compose-first setup sized for a single-host deployment or local dev.

## 2. Why these technologies

| Concern | Choice | Why |
|---|---|---|
| Backend language | TypeScript (Node 20) on every service | One language across the whole backend keeps the team small-scale-friendly; `strict: true` TS catches contract drift between services at compile time. |
| Web framework | Express | Minimal, well-understood, easy to keep 6 services structurally identical (routes → controllers → services → models). |
| Database | MongoDB (Atlas, hosted) | Flexible schema fits fast-moving domain models (zone graphs, map cells, pricing rules) better than a rigid relational schema at this stage; document model maps naturally to nested DTOs shared via `@parking/shared`. |
| Database-per-service | One Mongo *database* per service (`auth-db`, `parking-core-db`, `vehicle-records-db`, `camera-db`, `pricing-db`), same Atlas cluster | Enforces service ownership of its own data — no service reaches into another's collections directly. Classic microservices data-isolation pattern. |
| Event bus | Redpanda (Kafka API-compatible) | Gives Kafka's durable, ordered, replayable event log without the JVM/ZooKeeper operational overhead — a single lightweight container is enough for this scale, while every service still just uses `kafkajs` against the standard Kafka protocol. |
| Event contracts | Shared `KafkaEventEnvelope<T>` + a typed `Topics` registry in `@parking/shared` | Prevents topic-name typos and payload drift; every consumer/producer imports the same TS types, so a payload shape change is a compile error everywhere, not a runtime surprise. |
| Real-time push to browser | Dedicated `realtime-service` (Socket.IO) that bridges Kafka → WebSocket | Keeps WebSocket connection management out of every domain service; only one service needs to know about Socket.IO rooms/auth. Domain services stay simple publishers. |
| API entry point | `api-gateway` (reverse proxy + BFF) | Single public surface simplifies CORS/auth/rate-limiting and hides internal service topology from the frontend and from the outside world. Also gives a home for cross-service aggregation (`/api/dashboard/summary`) without polluting a domain service. |
| Auth | JWT (`jsonwebtoken`), verified independently by every service using a shared secret | Stateless auth avoids a session store and an extra network hop per request; every service can authorize locally. Internal service-to-service calls reuse the same JWT mechanism via a short-lived self-signed "system" token, avoiding a second auth scheme. |
| Validation | Zod | Runtime schema validation at the HTTP boundary, paired with static TS types — catches bad input before it reaches business logic. |
| Monorepo tooling | npm workspaces (`shared`, `services/*`, `frontend`) | Lets every service import `@parking/shared` as a normal package without publishing to a registry; one `npm install` at the root wires all of it. |
| Frontend framework | React 18 + Vite + TypeScript | Fast dev server / HMR via Vite; React for a componentized dashboard/map UI; TS shares mental model (and some types) with the backend. |
| Frontend styling | Tailwind CSS | Utility-first styling for rapid UI iteration on data-dense screens (maps, tables, cards) without hand-rolled CSS files per component. |
| Frontend state | No global store (Redux/Zustand) — local `useState`/`useEffect` per page + one `AuthContext` | The app's state is mostly per-page server data kept fresh via REST + socket events, not complex client-side state — a global store would add ceremony without solving a real problem here. |
| Computer vision | Python + FastAPI + OpenCV + EasyOCR, with optional Plate Recognizer API / OpenAI Vision fallback | Python owns the CV/OCR ecosystem (EasyOCR, OpenCV, PyTorch); FastAPI gives a light async HTTP surface so it drops into the same container-per-service model as everything else despite being a different language. Multiple OCR backends (local EasyOCR → cloud Plate Recognizer → LLM vision) trade off cost, accuracy, and offline-capability. |
| Multi-tenancy | `clientId` (tenant id) on nearly every document + `tenantScope` middleware + Kafka envelope `tenantId` | Single deployment serves many parking-lot operators ("clients"); tenant id is threaded through REST auth, Mongo queries, and even async event payloads so no data can leak across tenants at any layer. |

## 3. Repository layout

```
_parking-lot-project/
├── frontend/                    React + Vite + TS + Tailwind SPA
├── cv-service/                  Python/FastAPI ANPR (OCR) microservice
├── shared/                      @parking/shared — DTOs, enums, Kafka event contracts
├── services/
│   ├── api-gateway/             REST reverse proxy + BFF, port 8080
│   ├── auth-service/            Identity, tenants, users, JWT issuance, port 4001
│   ├── parking-core-service/    Lots, zones, slots, navigation, slot assignment, port 4002
│   ├── vehicle-records-service/ Vehicles, entry/exit records, port 4003
│   ├── camera-service/          Camera registry, detection ingestion, port 4004
│   ├── pricing-billing-service/ Pricing rules, fee calculation, port 4005
│   └── realtime-service/        Kafka → Socket.IO bridge, port 4010
└── infra/docker/                docker-compose.yml, mongo-init/ seed scripts
```

Every Node service follows the same internal skeleton: `routes → controllers → services →
models`, plus shared middleware (`errorHandler`, `asyncHandler`/`AppError`, Zod `validate`,
JWT `auth.middleware`, `tenantScope`). All build against `tsconfig.base.json` (ES2022,
CommonJS, strict) and ship as near-identical `node:20-alpine` Docker images.

## 4. Services in detail

### api-gateway (8080) — no database
Public entry point for the frontend. Two jobs:
- **Reverse proxy** (`http-proxy-middleware`): routes `/api/auth/*` to auth-service
  unauthenticated (login), everything else through JWT `authenticate` +
  `express-rate-limit` (300 req/min per tenant) before proxying to the right downstream
  service (`/lots`,`/zones`,`/slots` → parking-core; `/vehicles`,`/parking-records` →
  vehicle-records; `/cameras`,`/detections` → camera; `/pricing-rules`,`/billing` → pricing).
- **BFF aggregation**: `GET /api/dashboard/summary` fans out to parking-core-service and
  combines results for the dashboard's summary tiles.

Purely synchronous — no Kafka involvement.

### auth-service (4001) → `auth-db`
Tenant (`Client`) and `User` CRUD, login, JWT issuance (`AuthTokenPayload`: `sub`,
`clientId`, `role`, `assignedLotIds`, `email`). Roles: `super_admin`, `client_admin`,
`operator`. Publishes to Kafka but has no consumer — it's a pure source of identity events.

### parking-core-service (4002) → `parking-core-db`
Owns lots, zones (with a graph of `graphNode {x,y,floor}` + `connections` for pathfinding),
slots, and the multi-level map editor. Two standout pieces:
- **Slot assignment** (`slotAssignment.service.ts`): filters candidate slots by
  vehicle-type preference (e.g. EV vehicles prefer EV slots, fall back to REGULAR), then
  ranks them by walking distance from the entry zone using **Dijkstra's algorithm** over
  the zone graph.
- **Event loop closure**: consumes `PARKING_RECORD_ENTRY_DETECTED` /
  `_EXIT_DETECTED` (from vehicle-records-service) to flip slot occupancy, and publishes
  `SLOT_STATUS_CHANGED` for the realtime service to broadcast.

### vehicle-records-service (4003) → `vehicle-records-db`
Vehicle registry + parking session (`ParkingRecord`) lifecycle, both via direct REST
(manual entry/exit) and automatically via Kafka. Consumes `CV_PLATE_DETECTED`: on an
entry-camera event it calls parking-core-service's `POST /slots/assign` synchronously
(authenticated with a short-lived self-signed "system" JWT, `sub: "system"`), creates the
record, and publishes `PARKING_RECORD_ENTRY_DETECTED`; on an exit-camera event it closes
the record and publishes `PARKING_RECORD_EXIT_DETECTED`.

### camera-service (4004) → `camera-db`
Camera registry + detection log + the bridge to the Python cv-service. Exposes an
internal-only webhook `POST /cv-ingest/detections` (guarded by a shared `INTERNAL_API_KEY`
header, not user JWT) that cv-service calls when it detects a plate; publishes
`CV_PLATE_DETECTED` to Kafka. Also calls *out* to cv-service (`/cv/simulate/start|stop`,
`/cv/ocr`) to control the demo simulator and trigger on-demand scans.

### pricing-billing-service (4005) → `pricing-db`
Pricing-rule CRUD plus fully event-driven billing: consumes
`PARKING_RECORD_EXIT_DETECTED`, checks idempotency (skip if a `BillingRecord` already
exists for that record), looks up the lot's active `PricingRule`, computes
`amountDue = ceil((billableMinutes/60) * ratePerHour)` (minus a grace period, capped by
`maxDailyCharge`), stores the record, and publishes `FEE_CALCULATED`. No outbound REST to
any other service — the entire feature is an event handler.

### realtime-service (4010) — stateless, no database
Socket.IO server that authenticates connections via JWT, joins each client to
`tenant:<clientId>` and `tenant:<clientId>:lot:<lotId>` rooms, and consumes nearly every
domain event (`SLOT_STATUS_CHANGED`, `SLOT_ASSIGNED`, `SLOT_RELEASED`, `CV_PLATE_DETECTED`,
`FEE_CALCULATED`) from Kafka, re-emitting each as a scoped Socket.IO event (`slot:updated`,
`detection:created`, `fee:calculated`, …). This is the only piece of the system the
frontend talks to outside of the gateway.

### cv-service (8000, Python/FastAPI) — no database
Standalone ANPR service, not on the Node/TypeScript stack. `POST /cv/ocr` picks an OCR
backend at runtime by precedence: **Plate Recognizer API** (if token configured) →
**OpenAI Vision** (`gpt-4o-mini`, if API key configured) → **local EasyOCR** (always
available, OpenCV-preprocessed: grayscale, CLAHE contrast, sharpen). Also runs a
background **simulator** that posts synthetic detections to camera-service every ~15s,
used for demos without real camera hardware. Authenticates both directions
(camera-service ⇄ cv-service) with the shared `INTERNAL_API_KEY`.

### shared (`@parking/shared`)
The contract layer every Node service imports:
- **Types**: enums (`Role`, `SlotType`, `SlotStatus`, `VehicleType`, …), tenant/user/lot/
  zone/slot/vehicle/record/camera/detection/pricing/billing DTOs.
- **Events**: `KafkaEventEnvelope<T>` (`eventId`, `eventType`, `occurredAt`, `tenantId`,
  `version`, `payload`), a canonical `Topics` registry, and one payload type per topic.

Because every producer and consumer imports the same types, an event payload change is a
TypeScript compile error in every affected service, not a silent runtime mismatch.

### frontend (React + Vite + TS, 5173)
- **REST**: single axios instance (`api/client.ts`) pointed at the gateway
  (`VITE_API_BASE_URL`), JWT attached from `localStorage` via a request interceptor.
- **Realtime**: a Socket.IO client connects directly to `realtime-service`
  (`VITE_REALTIME_URL`), subscribes per-lot (`subscribe:lot`), and listens for
  `slot:updated`, `fee:calculated`, `detection:created` to keep the UI live without polling.
- **Auth**: `AuthContext` decodes the JWT payload client-side (no `/me` round trip needed
  for basic identity) and gates routes via `ProtectedRoute`.
- **Pages**: `Login`, `Dashboard` (live multi-level parking map, entry/exit workflow,
  billing modal), `Cameras` (start/stop simulation, live detections, webcam scanner),
  `Billing` (pricing-rule CRUD + live billing table), `VehicleLocator` (find a car by
  plate), `LotMapBuilder` (visual editor for multi-level lot maps — cells typed as
  slot/lane/entry/exit/wall, linked to real `ParkingSlot` records).

## 5. Infrastructure (`infra/docker/docker-compose.yml`)

| Container | Purpose | Port |
|---|---|---|
| `redpanda` | Kafka-API-compatible event broker (single node) | 9092 |
| `auth-service` | Identity/tenants | 4001 |
| `parking-core-service` | Lots/zones/slots/navigation | 4002 |
| `vehicle-records-service` | Vehicles/parking records | 4003 |
| `camera-service` | Cameras/detections | 4004 |
| `pricing-billing-service` | Pricing/billing | 4005 |
| `cv-service` | ANPR/OCR (Python) | 8000 |
| `realtime-service` | Kafka → Socket.IO bridge | 4010 |
| `api-gateway` | Public REST entry point | 8080 |
| `frontend` | Vite dev server | 5173 |

MongoDB itself is **not** containerized — every service's `MONGO_URI` points at a hosted
MongoDB Atlas cluster (`...?retryWrites=true&w=majority&appName=Cluster0`), supplied via
an untracked `infra/docker/.env`. `infra/docker/mongo-init/*.js` seed collection indexes
(unique constraints like `{clientId,lotId,slotNumber}`, `{clientId,licensePlate}`) for each
service's database — useful for bootstrapping a fresh Atlas database or a local Mongo swap-in.

No named volumes are declared: Redpanda's state and every service's build output are
ephemeral per container lifecycle; only the external Atlas cluster persists data.

## 6. The end-to-end event flow (core pipeline)

This is the system's central feature — a vehicle drives up, and the whole platform reacts
without a human clicking anything:

1. **cv-service** detects a plate (via OCR or the demo simulator) → `POST
   /cv-ingest/detections` on **camera-service** (internal API key).
2. **camera-service** logs the detection, publishes `CV_PLATE_DETECTED`.
3. **realtime-service** relays it as `detection:created` to subscribed browsers.
4. **vehicle-records-service** consumes the event:
   - **entry** camera → calls **parking-core-service** `POST /slots/assign` (Dijkstra-based
     nearest-available-slot assignment) → creates a `ParkingRecord` → publishes
     `PARKING_RECORD_ENTRY_DETECTED`.
   - **exit** camera → closes the matching record → publishes
     `PARKING_RECORD_EXIT_DETECTED`.
5. **parking-core-service** consumes the entry/exit event, flips the slot's status
   (occupied ↔ available), publishes `SLOT_STATUS_CHANGED`.
6. **pricing-billing-service** consumes the exit event, computes the fee against the lot's
   active pricing rule, stores a `BillingRecord`, publishes `FEE_CALCULATED`.
7. **realtime-service** relays `SLOT_STATUS_CHANGED` → `slot:updated` and
   `FEE_CALCULATED` → `fee:calculated` to the frontend — the dashboard's map and the
   billing screen update live, with no polling.

The **api-gateway** sits entirely outside this async chain — it only serves synchronous,
user-initiated REST traffic (login, CRUD, manual entry/exit, dashboard reads).

## 7. Cross-cutting design decisions worth calling out

- **Sync vs. async boundary**: user-triggered writes (create a lot, register a vehicle,
  manual entry) go over REST; anything triggered by a *sensor event* (a camera seeing a
  plate) flows through Kafka. This keeps the CV pipeline decoupled and independently
  scalable/retryable, while keeping admin CRUD simple and immediately consistent.
- **Internal service-to-service auth has two mechanisms**: a shared `INTERNAL_API_KEY`
  header for camera-service ⇄ cv-service (machine-to-machine, no user context), and a
  short-lived self-signed "system" JWT (`sub: "system"`) for vehicle-records-service →
  parking-core-service (reuses the same JWT trust every service already has, avoiding a
  second auth system for calls that *do* need a role/tenant context).
- **Idempotency**: pricing-billing-service explicitly checks for an existing
  `BillingRecord` before creating one — necessary because Kafka consumers can redeliver
  messages (at-least-once semantics), and fee calculation must not double-charge.
- **Multi-tenancy is pervasive, not bolted on**: `clientId` lives on nearly every Mongo
  document, every unique index, every JWT, every Kafka envelope, and is enforced by a
  shared `tenantScope` middleware — there's no single choke point where tenant isolation
  could be forgotten.

## 8. Known gaps / not-yet-wired pieces (as of this snapshot)

- `Topics` in `@parking/shared` reserves `CLIENT_CREATED`, `USER_CREATED`, `SLOT_ASSIGNED`,
  `EV_SESSION_STARTED/ENDED`, `ALERT_RAISED` — defined in the shared contract but not
  actively published by any service yet (future work).
- `api-gateway`'s dashboard aggregation hardcodes `revenueToday`/`entriesToday`/
  `exitsToday` — code comments indicate these are meant to fan out to an analytics/alerts
  service that doesn't exist yet.
- `pricing-billing-service` has no `mongo-init` seed script (its collections are created
  implicitly by Mongoose on first write, unlike every other service).
- The frontend Dockerfile runs the Vite **dev server** (`npm run dev`), not a production
  build — fine for the current demo/dev stage, but would need a build+serve step (e.g.
  Nginx serving `dist/`) before a real production deployment.
