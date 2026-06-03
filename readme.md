# Orchestra-AI: Enterprise AI Streaming & Orchestration Gateway

Orchestra-AI is a high-performance, cloud-native API Middleware Gateway built with **TypeScript** and **Express**. It acts as an intelligent, secure control plane sitting between client interfaces and upstream LLM inference engines (Groq Cloud / Llama-3). 

Rather than acting as a simple API wrapper, the gateway orchestrates traffic routing, sliding-window rate limiting, in-memory caching layers, autonomous system function calling (Tools), and 12-factor-compliant observability streams.

###  Pluggable Caching Layer (Redis-Ready Abstraction)
To maintain strict architectural separation of concerns, the gateway implements a **Provider Pattern Abstraction** over the caching layer inside `src/config/cache.ts`. 

While the standalone sandbox utilizes an in-process V8 memory pool (`node-cache`) for lightweight local development, the routing layer interacts entirely with a decoupled interface. Migrating the infrastructure to a distributed **Redis** or **Memcached** cluster for horizontal scaling requires zero modifications to the core business routing pipelines—it is achieved completely by updating the underlying provider implementation wrapper.

##  System Architecture

```text
       [ CLIENT REQUEST ] (e.g., UI Client / cURL)
               │
               ▼
   ┌─────────────────────────────────────────────────────────┐
   │             EXPRESS MIDDLEWARE SECURITY GATE            │
   ├─────────────────────────────────────────────────────────┤
   │ 🔒 apiKeyGuard      ──► Validates 'x-api-key' header    │
   │ ⏳ apiRateLimiter   ──► Sliding Window Spam Protection  │
   └───────────────────────────┬─────────────────────────────┘
                               │
                               ▼
   ┌─────────────────────────────────────────────────────────┐
   │             IN-MEMORY PERFORMANCE LAYER                 │
   ├─────────────────────────────────────────────────────────┤
   │ Is Prompt Key in NodeCache?                             │
   │   ├── YES (Cache Hit) ──► Instant RAM Stream Intercept  │
   │   └── NO  (Cache Miss)──► Initiates Cloud Handshake     │
   └───────────────────────────┬─────────────────────────────┘
                               │
                               ▼
                   🤖 [AI MODEL DECISION POINT]
                   Does context need real-time system data?
                     ├── YES ──► Executes Native TypeScript Service
                     └── NO  ──► Direct SSE Token Fluid Stream