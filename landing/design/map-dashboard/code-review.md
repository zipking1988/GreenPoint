# Map dashboard code review

2026-10-31 — manual diff/source review, browser interaction checks and regression checks. Scope: new map components/geometry/sample data, shared native dialog, existing video entry points, documentation and packaging. No inference API, authentication policy or MCP transport behavior changed.

Findings repaired:

- **P1 / positioned controls:** the existing dashboard's active transform overrode map-pin/label positioning and could cancel mouse clicks. Added map-specific pressed transforms; actual Not observed and plant/zone pointer clicks retested.
- **P2 / crop geometry:** responsive photo aspect changes could move the source outline away from the actual pixels. SourceCrop measures its container and derives the crop and outline from the same normalized box.
- **P2 / source connector:** inspector scrolling and font layout could leave an old endpoint. Listen for captured scroll and font readiness, observe relevant dimensions, hide offscreen endpoints, and keep the selected link across layers. Selecting a new offscreen candidate recenters it.
- **P2 / short viewport:** Save & next was clipped at 1280 × 720. Added a compact short-screen layout; the button is now fully visible.
- **P2 / mobile operation:** icon-only upload needed an accessible name and hotspot selection needed to reveal the evidence below the map. Added an explicit label and reduced-motion-aware scroll.
- **Performance:** connector canvas now reallocates only when dimensions change, and returning to the map pauses hidden video playback while retaining the session.
- **Data boundaries:** sample review storage is versioned and separate from the video/MCP sample. CSV preserves original labels and image-coordinate provenance. Unobserved regions contain no example source centers; source centers lie in their declared zone and field.

Verification: 34 automated checks passed, including source projection under zoom/pan, zone geometry, malformed storage, uncertain-but-reviewed records, next-unreviewed completion, provenance CSV and existing analysis/MCP/Sites checks. Browser confirmed review persistence/reset, local MP4 preview/session retention, real MCP discovery/sample call, map layers, source linkage and responsive operation. Production build passed. See `../../design-qa.md` for visual evidence.

No unresolved blocking findings in this review scope. No paid provider or physical drone validation is claimed.
