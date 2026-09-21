# 07 — Security and Privacy

An employment agreement contains the user's full name, address, salary, bank details in some cases, and signature. It is one of the most sensitive documents a young professional owns. Treat privacy as a **product feature that appears in the UI**, not as a configuration detail buried in a repo.

Security is a scored criterion. These controls take about two hours total.

---

## Threat model

| Threat | Control |
|---|---|
| API key leaked to the client | Server-side only. No `NEXT_PUBLIC_` key. Model calls exclusively in route handlers. Verified by grepping the client bundle in CI. |
| Document persisted and later breached | Nothing written to disk or a database. In-memory only, 30-minute TTL. PDF bytes never leave the browser — the server receives extracted text, not the file, or discards the buffer immediately after parsing. |
| Document text in logs | A logging helper that accepts only IDs, counts, durations and error codes. `console.log` of raw strings banned by AGENTS.md and checked in review. |
| Prompt injection via the PDF | Delimited untrusted-content framing, schema-constrained output, clause-ID existence checks, verbatim quote checks, plus an injection-detection finding. See `04-PROMPT-STRATEGY.md`. |
| Malicious file upload | Magic-byte check (`%PDF`), not just extension or MIME. Size cap 15 MB, page cap 60. Parse in a try/catch with a timeout. |
| Session ID guessing | `crypto.randomUUID()`. Session IDs are unguessable and short-lived. |
| Cost/abuse via open endpoints | Per-IP rate limit in memory: 5 uploads/hour, 60 questions/hour. Returns 429 with a clear message. |
| XSS via document content | Contract text is rendered as text nodes, never `dangerouslySetInnerHTML`. The highlight `<mark>` is applied to DOM nodes the viewer created, not to injected HTML. |
| Clickjacking / MIME sniffing | Security headers in `next.config.js`. |

---

## Concrete checklist

**Secrets**
- [ ] `.env.local` in `.gitignore`, `.env.example` committed with placeholder values
- [ ] No key in any client component, `NEXT_PUBLIC_` variable, or API response
- [ ] Cloud Run secret supplied via Secret Manager, not a plaintext env var in the console
- [ ] Repo scanned for accidentally committed keys before submission (`git log -p | grep -i "AIza"` as a crude last check)

**Data handling**
- [ ] No database, no file writes, no `/tmp` persistence
- [ ] `SessionStore` sweeper runs on every request, deletes entries older than 30 minutes
- [ ] `DELETE /api/session/[id]` removes the entry and returns 204; subsequent GETs 404
- [ ] PDF buffer released immediately after text extraction
- [ ] No third-party analytics, no error-reporting service that could capture payloads

**Input validation**
- [ ] Magic bytes checked (`25 50 44 46`)
- [ ] Size ≤ 15 MB enforced server-side, not only in the file input
- [ ] Page count ≤ 60
- [ ] Parse timeout of 20 seconds
- [ ] Scanned PDF detected and rejected with an explanation

**Headers** (`next.config.js`)
- [ ] `Content-Security-Policy` with no `unsafe-eval`, script-src self, connect-src self
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Referrer-Policy: no-referrer`
- [ ] `Permissions-Policy` denying camera, microphone, geolocation

**Rate limiting**
- [ ] In-memory per-IP limiter on `/api/ingest` and `/api/ask`
- [ ] 429 responses carry a human-readable message, not a stack trace

**Errors**
- [ ] No stack traces in production responses
- [ ] Typed error codes mapped to user-facing copy

---

## Make it visible in the UI

The controls above only score if someone can see them. Three small pieces of interface:

1. **On the upload screen**, one line under the drop zone: *"Your contract is processed in memory and deleted after 30 minutes. It is never written to a database."* Plain sentence, no lock icons, no badges.

2. **A persistent session timer** in the header: *"This review expires in 24 minutes"* with a **Delete now** button beside it. This is the single best privacy affordance you can build — it makes the policy legible and the action available in the same place.

3. **On delete**, confirm what happened: *"Deleted. The extracted text is gone from the server."* Then return to the upload screen.

In the video, click Delete on camera and show the session 404. Ten seconds, and it is the most concrete trust demonstration in the whole demo.

---

## Responsible-use guardrails

Distinct from security, but judged in the same neighbourhood and explicitly raised in the briefing session.

- Persistent footer, quiet, not a modal: *"Clause Radar helps you understand your document. It is not legal advice."*
- Every risk finding ends with a `suggestedQuestion` aimed at HR or a lawyer.
- Every refusal offers `clarifyWithProfessional` items.
- Legal context notes (e.g. the Section 27 reference) are phrased as *"worth confirming with a lawyer"*, never as *"this clause is void"* or *"this is unenforceable."* The tool points at the question; it does not answer it.
- No prediction of outcomes, no "you should sign / should not sign", no enforceability verdicts.

Write this as a short **Responsible AI** section in the README. It takes ten minutes and directly answers a criterion the judges named.
