# Phase 1: The Spine — User Acceptance Testing (UAT)

**Status:** Completed (Passed)  
**Completed:** 2026-09-21  

## Test Matrix

| # | Test Scenario | Expected Result | Status |
|---|---------------|-----------------|--------|
| 1 | Document Ingest & Two-Pane Review | Upload agreement PDF; redirects to `/review/[sessionId]` with rendered document on left and extracted clauses on right | Passed |
| 2 | Click-to-Highlight Navigation | Clicking any clause in right pane scrolls left pane to corresponding page and highlights text with marker animation | Passed |
| 3 | Filter & Search Clauses | Typing in the search input dynamically filters clauses by number, heading, or text snippet | Passed |
| 4 | Session Expiry & Purge | Header displays active 30-min countdown; clicking "Delete now" removes session and redirects to upload with confirmation badge | Passed |
| 5 | Validation & Edge Handling | Non-PDF files or files >15MB produce clear, typed error messages and do not upload | Passed |

## Session Log

- Verified Phase 1 end-to-end user flow: upload, PDF rendering, clause segmentation, two-pane navigation, and click-to-highlight. All tests passing.

