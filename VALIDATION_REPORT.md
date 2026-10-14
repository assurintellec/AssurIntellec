# Validation report — AssurIntellec website upgrade

**Package date:** 14 October 2026  
**Scope:** Offline/static checks of the supplied website project and mocked logic checks. No changes were pushed to GitHub or deployed to Cloudflare or Google Apps Script during this build.

## Checks completed locally

| Check | Result | Notes |
|---|---|---|
| Original ZIP integrity | PASS | Uploaded archive could be read and its CRC check passed. |
| Revised ZIP integrity | PASS | The completed delivery archive passed a CRC/integrity check and contains 104 files at the archive root, with no extra wrapper directory. |
| JavaScript syntax | PASS | `node --check` on `assets/site.js`, `cloudflare-worker/src/index.js`, and the `Code.gs` source copied to a `.js` file. Apps Script runtime services themselves cannot run in Node. |
| JSON syntax | PASS | `content/site.json`, `content/services.json`, and `site.webmanifest` parse. |
| Decap YAML syntax | PASS | `admin/config.yml` parses with PyYAML; no duplicate sibling field names were found by the check. |
| CMS/data field coverage | PASS | A recursive comparison found all saved fields in `content/site.json` and `content/services.json` represented in the CMS config. |
| Internal HTML file references | PASS | Twelve root HTML pages were scanned; no missing local `href`, `src`, or `poster` targets were found at validation time. |
| CMS JSON asset paths | PASS | Local file paths referenced by CMS-managed JSON were checked and none were missing. |
| CSS local URL references | PASS | Local files referenced through CSS `url(...)` were checked and none were missing. |
| Service page preservation | PASS | All seven individual service HTML pages are present. |
| Ten Expert Team slots | PASS by data/config inspection | Slots 1–4 align with the supplied table; slots 5–10 are disabled and blank by default. No unsupported expert biography or qualifications were added. |
| Expert modal behavior | Static/code inspection | Escape, close control, focus trap/restoration, and scroll locking are implemented. A full interactive browser test is still needed. |
| Splash/reduced motion fallback | Static/code inspection | Timeout/fallback and `prefers-reduced-motion` handling are implemented; a browser performance test remains outstanding. |
| Reel audio-toggle removal | PASS by source search | No Reel-specific audio toggle references remain. The hero-video audio toggle is preserved as required. |
| Counter / Worker URL model test | PASS | `node tests/visitor-counter-model.test.cjs` simulated a legacy total of 12,850, session deduplication on refresh, subsequent increments, applying 13,020 once as a new baseline, not resetting when only the value changes, ignoring client-supplied baseline values, and normalizing base/`/send`/`/health` Worker URLs. |
| Enquiry success handling | Static/code inspection | Success is based on bridge postMessage response rather than iframe load; form values are not cleared. Live Apps Script response and email delivery still require testing. |
| ZIP extraction/root layout | PASS | Archive root includes `index.html`, `admin/config.yml`, source, assets, docs, and tests; no extra wrapper directory. |
| Existing project file preservation | PASS | All 97 files present in the original uploaded ZIP remain in the project; seven new documentation/profile/test files were added. |

## Counter model test detail

The standalone test uses mocked Apps Script-style services, including a simulated `LockService`, `PropertiesService`, and session sheet. It verified that an imported baseline of 12,850 becomes 12,851 for the first counted session, same-session refresh does not add another count, the next distinct session increments, a new unique baseline version of 13,020 applies once and then becomes 13,021 for the first new counted session, changing only the numeric start value does not trigger a reset, and arbitrary baseline values submitted with a public request are ignored. This is a logic simulation, not proof of simultaneous live Apps Script requests or cross-device live storage.

## Not tested against live services

The following require the owner to apply the package and use the existing accounts/deployments:

- The existing Cloudflare Workers Builds production build, current live URLs, cache behavior, and Decap CMS authentication after deploy.
- Actual Google Apps Script permissions, authorization, JSONP behavior, active spreadsheet binding, Google Sheet writes, and simultaneous real requests.
- Recovery of the prior CounterAPI total. The package attempts a one-time read-only import; no reliable live previous total was recovered during offline work. If import fails, set a known baseline and a new baseline-version value in Decap CMS before relying on the new live count.
- Confirmed email send from `info@assurintellec.in`; the Worker must have the exact verified mailbox configured as `TITAN_SMTP_USER` and the existing secrets/config must be valid.
- Mail notification/auto-reply delivery, spam filtering, reply-to behavior, and Worker/Apps Script execution logs.
- Live enquiry response through the existing web app deployment, and behavior in real browsers under redirects/CORS/postMessage restrictions.
- Actual authorized MP4 playback, third-party Instagram embed behavior, and touch/keyboard interaction on physical/mobile browsers.
- Visual regression, accessibility tree checks, screenshots, Lighthouse/performance metrics, and browser-console checks at every requested viewport. A reliable full-browser rendering run was not completed here, so no visual screenshot/pass is claimed.
- A real ZIP replacement/deployment round-trip.

## Owner verification checklist after deployment

- [ ] Cloudflare build completes and all twelve main/service pages open.
- [ ] `/admin/` opens and authentication still works.
- [ ] Publish a harmless CMS edit and confirm the public page reflects it.
- [ ] Enable/edit/disable one Expert Team profile and confirm its card/dialog; verify empty profiles remain hidden.
- [ ] Test reduced-motion mode and the splash timeout in a browser.
- [ ] Check visitor-counter live response; test same-tab refresh, a new browser/session, and a second device.
- [ ] If old CounterAPI count did not import, publish the correct baseline and a unique baseline-version text, then confirm baseline + 1 and no double-add.
- [ ] Confirm the public counter endpoint does not permit an anonymous baseline reset.
- [ ] Submit a test enquiry and verify the sheet row, unique reference, notification email, confirmation email, and status fields.
- [ ] Confirm the contact form remains filled and WhatsApp opens with the same values.
- [ ] Test local MP4 and Instagram fallback on desktop/mobile; verify no Reel audio toggle appears.
- [ ] Check console, layout overflow, keyboard focus, and dialogs at 320, 360/375, 390–430, 768, 1024, 1280–1366, and 1440+ pixel widths.

Do not mark the external checks complete until they have actually been performed against the live deployment.
