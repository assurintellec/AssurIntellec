# AssurIntellec — corrected private review website

**Latest update: unsubscribe and embedded social logos, 30 October 2026.** Read `website/UNSUBSCRIBE_AND_EMAIL_LOGOS_FIX_30-10-2026.md` first. This update changes the newsletter integration, email rendering and Titan MIME support; the original public deployment and Google projects have not been updated automatically.

Based on `AssurIntellec_Enquiry_Newsletter_One_Click_30-10-2026.zip`, version 8, updated 30 October 2026.

`website/` contains the website in its original directory structure. The saved text, `content/site.json`, `content/services.json`, Decap configuration, enquiry code/settings, integration scripts, supplied media and media placements are preserved. The 157 media files omitted from the ZIP were restored by reading their existing paths on www.assurintellec.in. No public website, repository, Google Apps Script, Google Sheet, mail service or Decap account was changed.

For the original Cloudflare hosting, use the contents of `website/` as the project root. It retains the original Durable Object counter and Wrangler configuration. The surrounding framework is the separate private Sites host; do not copy it into the existing public deployment.

## Private host

The surrounding source serves the same HTML/assets using the supplied Sites Vinext starter and an isolated D1 counter. Its database is separate from the local preview and public website. `.openai/hosting.json` holds the private Site identity. Run `node scripts/prepare-website.mjs` to copy the website into generated `public/`, then build through the Sites build helper. Dependencies use the committed lockfile. The D1 schema and generated migration are under `db/` and `drizzle/`; local and production migrations are applied separately by the documented Sites workflow.

## Counter

The configured starting offset is **148160**. The display is `start_value + new visits`. The existing Decap Visitor Counter starting-value field remains editable. Editing that field changes the offset without deleting visits. Namespace/action/key identify a counter; use a different key only to intentionally start a separate count.

A browser visit expires after 30 minutes of inactivity. Page requests and retries are deduplicated; atomic transactions prevent lost concurrent increments. GET `/api/visitor-count` reads without incrementing; POST registers or refreshes a visit. During an outage the page shows the last confirmed numeric total, or the configured starting value, and retries. It does not invent visits or display temporary-unavailable text.

The private host uses `lib/visitor-counter.mjs`. The original Cloudflare host uses `website/visitor-counter.js`. Both return the same API response shape.

## Reels, sound and motion

The side arrows and left/right keyboard controls cycle through the four configured enabled reels, including wraparound. Empty, disabled, duplicate and invalid entries are handled. Replacing the iframe stops the previous player. Instagram owns native playback/sound controls; the frame delegates the necessary permissions without forcing mute. Visitors tap Play for audio. Source-audio restrictions and browser/device volume still apply. The existing sound hint and current-reel Open on Instagram link remain.

The motion layer includes coordinated reveals, button sheen, navigation accents, card lighting, reading progress, detail-opening transitions and a short reel fade. Existing CMS switches and reduced-motion preferences are respected. The seven service image/text zoom switches remain off. Preloader dismissal no longer waits for slow external frames. Phone grid children can shrink to the viewport, fixing horizontal overflow.

## Video compatibility

The restored homepage MP4 uses HEVC; the QA browser loaded its audio but showed no video frame. `website/videos/compat/hero-60sec.h264.mp4` is a compatible copy of the same recording, preserving the original 1280 × 720 resolution, timing and audio. Original files are intact. `website/content/video-compatibility.json` maps the original paths to that copy, without changing the CMS selection or media placement.

If a video at a mapped path is replaced, regenerate the compatible copy and map in the build. Newly selected CMS paths use the selected source directly. H.264/AAC MP4 is preferred for browser playback.

## CMS and enquiry scope

The Decap file remains byte-for-byte unchanged, including its Turbo site ID, branch, collections, media folder and original site URLs. It stays associated with the existing external CMS/backend. No login or Publish action was performed. Decap requires HTTPS for `crypto.randomUUID`; the local HTTP preview cannot supply that secure-context API.

The enquiry endpoint, recipient, confirmation-email settings and WhatsApp template are unchanged. This latest update changes only integration code needed for confirmed unsubscribe and embedded email logos, as documented in the new guide. Browser QA tested required fields without sending. Local tests use a stub to verify the configured endpoint/payload, success/failure feedback, restored button and retained form values. No enquiry, subscription, email or Sheet row was created.

## Validation

- `node tests/counter.test.mjs`: offset, new visits, concurrency, duplicates, cookies, persistence, offset edits, separate keys, expiry, disabled state and invalid requests.
- `node tests/reels.test.mjs`: all four URLs, arrows, wraparound, keyboard, one active iframe, sound permissions, fallback link and empty/disabled/one-slot cases.
- `node tests/enquiry.test.mjs`: local validation and mocked send/success/failure flows.
- `tests/preservation-results.json`: content, configuration, enquiry-code and original-media preservation.
- Browser QA: Home, About, Services, Why Us, Contact and all seven service pages; live numeric counter; all seven opening videos playing at 1280 px; no broken loaded images or desktop overflow.
- Responsive QA: Home, About, Services, Contact and all seven services at 390 px; Contact at 320 px and 768 px; no horizontal overflow after correction.
- Sound QA: homepage mute/unmute responds to clicks; Instagram native video loaded after Play with `muted=false`. Device sound output cannot be asserted remotely.

Production enquiry delivery and CMS publishing were not tested because they would change external systems.
