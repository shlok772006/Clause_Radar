# Stack — Clause Radar

## Runtime

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript strict
- **Node version:** 18+ (for Cloud Run compatibility)

## Styling

- **CSS Framework:** Tailwind CSS
- **Fonts:** Instrument Sans (interface), Source Serif 4 (document text)
- **Design system:** 7 custom tokens, no gradients, no shadows except one soft one

## AI & ML

- **Primary model:** Gemini via @google/generative-ai SDK
- **Structured output:** responseMimeType: "application/json" + responseSchema
- **Embeddings:** Gemini embeddings, cosine similarity in-memory
- **Temperature:** 0 for factual, 0.4 for generative copy

## Storage

- **Database:** None (by design)
- **Session store:** In-memory Map<string, Session> with 30-min TTL sweeper
- **File storage:** None — PDF bytes stay in browser, server holds only extracted text

## PDF Processing

- **Library:** pdfjs-dist
- **Usage:** Server-side text extraction + client-side rendered viewer with text layer

## Translation & Speech (Day 4)

- **Translation:** Google Cloud Translation API
- **Speech:** Google Cloud Text-to-Speech

## Testing

- **Unit tests:** Vitest
- **Eval harness:** Custom (eval/run.ts)
- **Accessibility:** axe-core via @axe-core/react

## Deployment

- **Target:** Google Cloud Run
- **Configuration:** min=1, max=1 (single instance for session coherence)
- **Secrets:** Google Secret Manager
- **Container:** Dockerfile (Next.js standalone output)
