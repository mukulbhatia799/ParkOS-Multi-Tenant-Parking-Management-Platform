# ParkOS — Multi-Tenant Smart Parking Management Platform

🔗 **Live Demo:** [ParkOS Live](https://d2zr6d2ywvk7is.cloudfront.net/login)

ParkOS is a multi-tenant, event-driven smart parking management platform that automates the complete parking workflow — from vehicle entry and license plate recognition to intelligent slot allocation, real-time occupancy tracking, vehicle exit, and automated billing.

## Features

- Multi-tenant parking management
- JWT-based authentication and role-based access control
- Automated vehicle entry and exit workflow
- Automatic Number Plate Recognition (ANPR)
- 3-tier OCR fallback mechanism
- Intelligent parking-slot allocation using Dijkstra's algorithm
- Real-time parking occupancy updates using Socket.IO
- Event-driven communication using Kafka/Redpanda
- Automated parking fee calculation
- Idempotent billing to prevent duplicate charges
- Parking lot, zone, slot, and camera management
- Vehicle and parking-session management
- Pricing-rule management
- Dashboard and parking-map visualization
- Dockerized microservices architecture

## Architecture

```text
                           ┌─────────────────────┐
                           │      Frontend       │
                           │ React + TypeScript  │
                           └──────────┬──────────┘
                                      │
                               REST / WebSocket
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │    API Gateway      │
                           │        :8080        │
                           └──────────┬──────────┘
                                      │
              ┌───────────────────────┼──────────────────────┐
              │                       │                      │
              ▼                       ▼                      ▼
       ┌─────────────┐        ┌──────────────┐       ┌──────────────┐
       │ Auth Service│        │Parking Core  │       │Vehicle       │
       │    :4001    │        │   :4002      │       │Records :4003 │
       └─────────────┘        └──────────────┘       └──────────────┘
              │                       │                      │
              └───────────────────────┼──────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │      Redpanda       │
                           │   Kafka Event Bus   │
                           │        :9092        │
                           └──────────┬──────────┘
                                      │
                  ┌───────────────────┼───────────────────┐
                  │                   │                   │
                  ▼                   ▼                   ▼
          ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
          │Camera Service│    │Billing       │    │Realtime      │
          │    :4004     │    │Service :4005 │    │Service :4010 │
          └──────┬───────┘    └──────────────┘    └──────┬───────┘
                 │                                        │
                 ▼                                        ▼
          ┌──────────────┐                         ┌──────────────┐
          │ CV Service   │                         │  Socket.IO   │
          │ Python/FastAPI│                        └──────┬───────┘
          │    :8000     │                                │
          └──────────────┘                                ▼
                                                   ┌──────────────┐
                                                   │   Frontend   │
                                                   └──────────────┘
```

## System Workflow

### Vehicle Entry

```text
Vehicle Arrives
      │
      ▼
Camera / CV Service
      │
      ▼
License Plate Detection
      │
      ▼
Camera Service
      │
      ▼
CV_PLATE_DETECTED
      │
      ▼
Kafka / Redpanda
      │
      ▼
Vehicle Records Service
      │
      ▼
Parking Core Service
      │
      ▼
Find Nearest Available Slot
      │
      ▼
Dijkstra's Algorithm
      │
      ▼
Parking Session Created
      │
      ▼
Slot Status → OCCUPIED
      │
      ▼
SLOT_STATUS_CHANGED
      │
      ▼
Realtime Service
      │
      ▼
Socket.IO
      │
      ▼
React Dashboard
```

### Vehicle Exit

```text
Vehicle Exits
      │
      ▼
License Plate Detection
      │
      ▼
Camera Service
      │
      ▼
CV_PLATE_DETECTED
      │
      ▼
Vehicle Records Service
      │
      ▼
Active Parking Session Found
      │
      ▼
Parking Session Closed
      │
      ▼
PARKING_RECORD_EXIT_DETECTED
      │
      ├───────────────────────┐
      │                       │
      ▼                       ▼
Parking Core          Pricing & Billing
      │                       │
      ▼                       ▼
Release Slot           Calculate Fee
                              │
                              ▼
                        Billing Record
                              │
                              ▼
                        FEE_CALCULATED
                              │
                              ▼
                       Realtime Service
                              │
                              ▼
                          Socket.IO
                              │
                              ▼
                       React Dashboard
```

## Microservices

| Service | Port | Responsibility |
|---|---:|---|
| API Gateway | 8080 | Routing, authentication, rate limiting and dashboard aggregation |
| Auth Service | 4001 | Authentication, users, tenants and JWT |
| Parking Core Service | 4002 | Parking lots, zones, slots, maps and allocation |
| Vehicle Records Service | 4003 | Vehicles, parking sessions and entry/exit |
| Camera Service | 4004 | Camera management and license-plate detections |
| Pricing & Billing Service | 4005 | Pricing rules and billing |
| Realtime Service | 4010 | Kafka-to-Socket.IO event bridge |
| CV Service | 8000 | License plate detection and OCR |
| Frontend | 5173 | React dashboard |
| Redpanda | 9092 | Kafka-compatible event broker |

## Service Responsibilities

### API Gateway

The API Gateway acts as the public entry point for the frontend.

Responsibilities:

- REST request routing
- JWT authentication
- Rate limiting
- CORS handling
- Reverse proxying
- Backend-for-Frontend aggregation

### Auth Service

Responsible for:

- User authentication
- Tenant management
- JWT generation
- Role-based access control

Supported roles:

```text
super_admin
client_admin
operator
```

JWT claims contain tenant and authorization information such as:

```text
userId
clientId
role
assignedLotIds
email
```

### Parking Core Service

Responsible for:

- Parking lots
- Zones
- Parking slots
- Parking maps
- Navigation graph
- Slot allocation
- Slot status

### Vehicle Records Service

Responsible for:

- Vehicle registry
- Parking sessions
- Vehicle entry
- Vehicle exit
- Camera-driven entry
- Camera-driven exit

### Camera Service

Responsible for:

- Camera registration
- Camera configuration
- Detection logs
- License plate detection
- Communication with the CV service

Once a valid plate is detected, the service publishes a `CV_PLATE_DETECTED` event.

### Pricing & Billing Service

Responsible for:

- Pricing rules
- Parking fee calculation
- Billing records
- Idempotent billing

The service consumes parking exit events and calculates the final parking fee.

### Realtime Service

The Realtime Service acts as a bridge between Kafka and Socket.IO.

```text
Kafka Event
     │
     ▼
Realtime Service
     │
     ▼
Socket.IO
     │
     ▼
Frontend
```

## Multi-Tenancy

ParkOS supports multiple parking operators using the same platform while maintaining logical tenant isolation.

Tenant context is propagated through:

- JWT claims
- Database queries
- Kafka events
- WebSocket rooms
- Authorization middleware

```text
JWT
 │
 └── clientId
       │
       ▼
Tenant Context
       │
       ├── REST
       ├── Kafka
       ├── Database Queries
       └── Socket.IO Rooms
```

WebSocket rooms are scoped by tenant and parking lot:

```text
tenant:<clientId>
tenant:<clientId>:lot:<lotId>
```

## Authentication & Security

ParkOS uses JWT-based authentication and role-based access control.

Security mechanisms include:

- JWT authentication
- Role-based access control
- Tenant-level authorization
- Internal API key authentication
- Service-to-service authentication
- API rate limiting
- Environment-based secret management
- Tenant-scoped WebSocket rooms

## Event-Driven Architecture

ParkOS uses Redpanda as a Kafka-compatible event broker.

Kafka is used for asynchronous communication between microservices.

```text
Camera Service
      │
      ▼
CV_PLATE_DETECTED
      │
      ▼
   Redpanda
      │
      ├───────────────┐
      ▼               ▼
Vehicle Records    Realtime
      │               │
      ▼               ▼
Parking Session   Dashboard
```

This provides:

- Loose coupling
- Asynchronous processing
- Independent service scaling
- Better fault isolation
- Event-based communication
- Real-time event propagation

## Kafka Events

| Event | Producer | Consumer |
|---|---|---|
| `CV_PLATE_DETECTED` | Camera Service | Vehicle Records, Realtime |
| `PARKING_RECORD_ENTRY_DETECTED` | Vehicle Records | Parking Core |
| `PARKING_RECORD_EXIT_DETECTED` | Vehicle Records | Parking Core, Billing |
| `SLOT_STATUS_CHANGED` | Parking Core | Realtime |
| `SLOT_ASSIGNED` | Parking Core | Realtime |
| `SLOT_RELEASED` | Parking Core | Realtime |
| `FEE_CALCULATED` | Billing | Realtime |

## Shared Event Contracts

The project contains shared contracts for communication between services.

The shared package contains:

- DTOs
- Enums
- Kafka event contracts
- Topic definitions
- Common domain models

Kafka events follow a common envelope:

```text
KafkaEventEnvelope<T>

├── eventId
├── eventType
├── occurredAt
├── tenantId
├── version
└── payload
```

Example:

```json
{
  "eventId": "uuid",
  "eventType": "CV_PLATE_DETECTED",
  "occurredAt": "2026-01-01T10:00:00Z",
  "tenantId": "tenant-id",
  "version": 1,
  "payload": {}
}
```

The version field allows event contracts to evolve without breaking consumers.

## Computer Vision & OCR

The CV Service is implemented using Python and FastAPI.

It performs Automatic Number Plate Recognition using a fallback-based OCR pipeline.

```text
             Plate Recognizer
                    │
               unavailable
                    │
                    ▼
               OpenAI Vision
                    │
               unavailable
                    │
                    ▼
                 EasyOCR
```

The OCR pipeline uses OpenCV for image preprocessing.

```text
Input Image
     │
     ▼
Image Processing
     │
     ▼
OpenCV Preprocessing
     │
     ▼
Plate Detection
     │
     ▼
OCR
     │
     ▼
Normalized Plate
     │
     ▼
Detection Result
```

The fallback mechanism improves fault tolerance when an external OCR provider is unavailable.

## Parking Slot Allocation

ParkOS uses Dijkstra's shortest-path algorithm to find an appropriate parking slot.

The parking lot is represented as a graph where nodes represent locations and edges represent navigable paths.

```text
                 Entry
                   │
            ┌──────┴──────┐
            │             │
          Zone A        Zone B
            │             │
       ┌────┴────┐       Slot
       │         │
     Slot A1   Slot A2
```

When a vehicle enters:

1. Identify available slots.
2. Filter slots based on requirements.
3. Identify the relevant parking area.
4. Use the parking navigation graph.
5. Calculate shortest paths from the entry point.
6. Compare candidate slot distances.
7. Select the nearest suitable slot.

Dijkstra is appropriate because the parking graph uses non-negative edge weights.

## Idempotent Billing

Kafka provides at-least-once delivery semantics, meaning an event may potentially be processed more than once.

Without idempotency, duplicate exit events could result in duplicate charges.

ParkOS prevents this by checking whether a billing record already exists for the parking session before creating a new one.

```text
PARKING_RECORD_EXIT_DETECTED
             │
             ▼
      Billing Service
             │
             ▼
   Billing Record Exists?
        /          \
      YES           NO
       │             │
       ▼             ▼
     Ignore      Calculate Fee
                     │
                     ▼
               Create Billing
                     │
                     ▼
                FEE_CALCULATED
```

## Pricing Calculation

The billing service considers:

- Parking duration
- Grace period
- Pricing rules
- Maximum daily charge

```text
Parking Duration
       │
       ▼
Apply Grace Period
       │
       ▼
Billable Duration
       │
       ▼
Apply Pricing Rule
       │
       ▼
Apply Maximum Daily Charge
       │
       ▼
Final Fee
```

## Real-Time Communication

ParkOS uses Socket.IO to provide live updates to the frontend.

Domain services do not directly manage frontend WebSocket connections.

Instead:

```text
Domain Service
      │
      ▼
Kafka Event
      │
      ▼
Realtime Service
      │
      ▼
Socket.IO
      │
      ▼
React Frontend
```

Real-time events include:

```text
SLOT_STATUS_CHANGED
SLOT_ASSIGNED
SLOT_RELEASED
CV_PLATE_DETECTED
FEE_CALCULATED
```

## Frontend

The frontend is built using:

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Socket.IO Client

### Dashboard

The dashboard provides:

- Parking occupancy
- Parking-lot overview
- Parking maps
- Entry/exit information
- Billing information
- Real-time updates

### Camera Management

Provides:

- Camera management
- Detection logs
- Detection simulation
- Webcam scanner
- License plate information

### Billing

Provides:

- Pricing-rule management
- Billing records
- Parking fee information
- Real-time billing updates

### Vehicle Locator

Allows operators to search for vehicles using license plate information.

### Lot Map Builder

Provides a visual editor for designing parking lots.

Supported cell types include:

```text
Slot
Lane
Entry
Exit
Wall
```

The system supports multi-level parking structures.

## Repository Structure

```text
parking-lot-project/
│
├── frontend/
│
├── cv-service/
│
├── shared/
│
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── parking-core-service/
│   ├── vehicle-records-service/
│   ├── camera-service/
│   ├── pricing-billing-service/
│   └── realtime-service/
│
├── infra/
│   └── docker/
│       ├── docker-compose.yml
│       └── mongo-init/
│
├── package.json
└── README.md
```

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Socket.IO Client

### Backend

- Node.js
- TypeScript
- Express.js
- FastAPI
- Python

### Databases

- MongoDB
- MongoDB Atlas
- Mongoose

### Messaging

- Kafka
- Redpanda
- KafkaJS

### Computer Vision

- Python
- FastAPI
- OpenCV
- EasyOCR
- Plate Recognizer
- OpenAI Vision

### Authentication

- JWT
- Role-Based Access Control

### Validation

- Zod

### DevOps

- Docker
- Docker Compose

## Infrastructure

The project uses Docker Compose for running the microservices.

| Container | Purpose | Port |
|---|---|---:|
| `redpanda` | Kafka-compatible event broker | 9092 |
| `auth-service` | Authentication and tenant management | 4001 |
| `parking-core-service` | Parking infrastructure | 4002 |
| `vehicle-records-service` | Vehicles and parking sessions | 4003 |
| `camera-service` | Cameras and detections | 4004 |
| `pricing-billing-service` | Pricing and billing | 4005 |
| `cv-service` | ANPR/OCR | 8000 |
| `realtime-service` | Kafka to Socket.IO bridge | 4010 |
| `api-gateway` | Public API | 8080 |
| `frontend` | React application | 5173 |

MongoDB is hosted using MongoDB Atlas.

## Getting Started

### Prerequisites

Install:

- Node.js 20+
- npm
- Docker
- Docker Compose
- Python 3+
- MongoDB Atlas account

### Clone the Repository

```bash
git clone <your-repository-url>
cd parking-lot-project
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create the required environment files for the services.

Example backend configuration:

```env
MONGO_URI=
JWT_SECRET=
KAFKA_BROKERS=
INTERNAL_API_KEY=
```

CV service:

```env
PLATE_RECOGNIZER_TOKEN=
OPENAI_API_KEY=
INTERNAL_API_KEY=
```

Frontend:

```env
VITE_API_BASE_URL=
VITE_REALTIME_URL=
```

Do not commit secrets or API keys to Git.

### Run the Project

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

Run in detached mode:

```bash
docker compose -f infra/docker/docker-compose.yml up --build -d
```

### Stop the Project

```bash
docker compose -f infra/docker/docker-compose.yml down
```

### Rebuild the Project

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

## Service URLs

```text
Frontend
http://localhost:5173

API Gateway
http://localhost:8080

Auth Service
http://localhost:4001

Parking Core Service
http://localhost:4002

Vehicle Records Service
http://localhost:4003

Camera Service
http://localhost:4004

Pricing & Billing Service
http://localhost:4005

Realtime Service
http://localhost:4010

CV Service
http://localhost:8000

Redpanda
localhost:9092
```

## API Gateway

The API Gateway exposes unified APIs for the frontend.

Typical routes include:

```text
/api/auth/*
/api/lots/*
/api/zones/*
/api/slots/*
/api/vehicles/*
/api/parking-records/*
/api/cameras/*
/api/detections/*
/api/pricing-rules/*
/api/billing/*
```

The gateway handles:

- Authentication
- Routing
- Rate limiting
- CORS
- Request forwarding
- Dashboard aggregation

## Dashboard Aggregation

The API Gateway provides a Backend-for-Frontend aggregation endpoint:

```text
GET /api/dashboard/summary
```

Conceptually:

```text
Frontend
   │
   ▼
API Gateway
   │
   ├── Auth Service
   ├── Parking Core
   ├── Vehicle Records
   └── Billing
          │
          ▼
   Aggregated Response
          │
          ▼
       Frontend
```

This reduces the number of independent service calls required by the frontend.

## Data Ownership

Each domain service owns its own data.

```text
Auth Service
    └── Auth Data

Parking Core Service
    └── Parking Data

Vehicle Records Service
    └── Vehicle and Session Data

Camera Service
    └── Camera and Detection Data

Pricing & Billing Service
    └── Pricing and Billing Data
```

Services do not directly access another service's database.

Communication happens through:

- REST APIs for synchronous operations
- Kafka events for asynchronous operations

## Synchronous vs Asynchronous Communication

### Synchronous Communication

REST is used when an immediate response is required.

Examples:

- Login
- Creating parking lots
- Managing zones
- Managing slots
- Registering vehicles
- Manual entry
- Manual exit
- Updating pricing rules
- Dashboard queries
- Vehicle searches

```text
Frontend
   │
   ▼
API Gateway
   │
   ▼
Domain Service
   │
   ▼
Response
```

### Asynchronous Communication

Kafka/Redpanda is used for event-driven workflows.

Examples:

- License plate detection
- Vehicle entry events
- Vehicle exit events
- Slot status changes
- Billing events
- Real-time updates

```text
Producer
   │
   ▼
Kafka
   │
   ├── Consumer A
   │
   └── Consumer B
```

## Why REST + Kafka?

REST and Kafka serve different purposes.

### REST

Best suited for:

- Request/response operations
- User-triggered actions
- Queries
- CRUD operations
- Immediate validation

### Kafka

Best suited for:

- Domain events
- Asynchronous processing
- Event propagation
- Loose coupling
- Real-time workflows
- Retryable operations

Using both allows the system to choose the appropriate communication model for each workflow.

## Design Principles

### Separation of Concerns

Each microservice owns a specific business domain.

```text
Auth → Authentication
Parking → Parking infrastructure
Vehicle → Parking sessions
Camera → Detection
Billing → Pricing and billing
Realtime → WebSocket delivery
CV → OCR
```

### Single Responsibility

Services focus on their own business responsibilities, making them easier to develop, test, debug, deploy and scale.

### Loose Coupling

Kafka events allow services to communicate without creating direct synchronous dependencies for every workflow.

### Database Ownership

Each service owns its own data and exposes functionality through APIs or events.

### Contract-Based Communication

Shared event contracts ensure consistent producer-consumer communication.

### Idempotency

Event consumers such as Billing are designed to safely handle duplicate events.

### Tenant Isolation

Tenant information is propagated through REST, Kafka and WebSocket communication.

## Key Engineering Challenges

### Intelligent Parking Slot Allocation

The system avoids simply selecting the first available slot.

The parking structure is represented as a graph and Dijkstra's algorithm is used to find the shortest path to suitable parking slots.

### Duplicate Event Processing

Kafka may deliver events more than once.

Billing checks whether the parking session has already been billed before creating a billing record.

### Multi-Tenant Isolation

Tenant context is carried through:

- JWT claims
- Database queries
- Event envelopes
- WebSocket rooms

### OCR Reliability

OCR can fail because of poor image quality, network failures, external API failures or incorrect detection.

The CV service uses multiple OCR providers with EasyOCR as the local fallback.

### Real-Time Communication

The Realtime Service consumes Kafka events and broadcasts them through Socket.IO, keeping domain services independent from WebSocket management.

## Project Highlights

ParkOS demonstrates the integration of:

```text
Microservices
        +
Event-Driven Architecture
        +
Kafka / Redpanda
        +
REST APIs
        +
WebSockets
        +
Computer Vision
        +
OCR
        +
Dijkstra's Algorithm
        +
Idempotent Processing
        +
Multi-Tenancy
        +
JWT Authentication
        +
Database-per-Service
        +
Docker
```

## Learning Outcomes

Building ParkOS provided hands-on experience with:

- Microservice architecture
- Event-driven systems
- Kafka event modeling
- Synchronous and asynchronous communication
- Database-per-service architecture
- Multi-tenant system design
- Real-time communication
- Idempotent event processing
- Graph algorithms
- Computer vision integration
- OCR fallback strategies
- API Gateway design
- Backend-for-Frontend architecture
- Authentication and authorization
- Dockerized application development
- Shared contracts between services

## Future Improvements

- Kubernetes deployment
- Helm charts
- Production frontend deployment
- Dedicated analytics service
- Centralized logging
- Distributed tracing
- Prometheus/Grafana monitoring
- CI/CD pipeline
- Horizontal service scaling
- Advanced parking analytics
- EV charging management
- Payment gateway integration
- Parking reservations
- Dynamic pricing
- Advanced camera monitoring
- Notification service

## Known Limitations

- Some Kafka events are defined in the shared contracts but are not fully utilized by every service.
- Some dashboard metrics are currently placeholders and can be replaced with data from a dedicated analytics service.
- Billing seed data can be added for easier local setup.
- The frontend currently uses the Vite development server instead of a production-optimized static build.
- The current deployment setup uses Docker Compose; Kubernetes deployment can be added later.

## API Examples

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### Create Parking Lot

```http
POST /api/lots
Authorization: Bearer <JWT>
Content-Type: application/json
```

### Register Vehicle

```http
POST /api/vehicles
Authorization: Bearer <JWT>
Content-Type: application/json
```

### Dashboard Summary

```http
GET /api/dashboard/summary
Authorization: Bearer <JWT>
```

## Troubleshooting

### Containers Are Not Starting

```bash
docker ps
```

View logs:

```bash
docker compose -f infra/docker/docker-compose.yml logs
```

View logs for a specific service:

```bash
docker compose -f infra/docker/docker-compose.yml logs <service-name>
```

### Redpanda Connection Issues

Verify that Redpanda is running:

```bash
docker ps
```

Services inside Docker should connect to:

```text
redpanda:9092
```

### MongoDB Connection Issues

Verify:

- MongoDB Atlas cluster is running
- Connection string is correct
- Database credentials are valid
- Network access is configured
- Environment variables are loaded

### Frontend Cannot Reach Backend

Verify that the frontend is configured to use the API Gateway:

```text
Frontend
   │
   ▼
API Gateway :8080
```

### WebSocket Updates Are Not Working

Check:

1. Realtime Service is running.
2. Socket.IO endpoint is reachable.
3. JWT is valid.
4. Tenant and parking-lot authorization is correct.
5. Kafka events are being published.
6. Realtime Service is consuming Kafka events.

## Production Considerations

Before deploying ParkOS to production:

- Use a production secrets-management solution.
- Enable HTTPS.
- Configure secure CORS policies.
- Replace development servers with production builds.
- Configure centralized logging.
- Add monitoring and alerting.
- Add distributed tracing.
- Configure Kafka/Redpanda replication and retention.
- Configure automated database backups.
- Add appropriate database indexes.
- Add CI/CD pipelines.
- Add automated integration and end-to-end tests.
- Deploy services using Kubernetes or another production orchestration platform if required.

## Author

**Mukul Bhatia**

Software Developer | Full Stack Developer

### Interests

- Software Engineering
- Backend Development
- Distributed Systems
- System Design
- Data Structures & Algorithms
- Cloud Computing
- DevOps
- Event-Driven Architecture
- Microservices

## License

This project is intended for educational, learning, and portfolio purposes.
