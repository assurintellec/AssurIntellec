# AssurIntellec — Word document 9 update, 3 November 2026

This guide covers the two requests in `9.Website_Update_03-11-2026.docx`. It supersedes older instructions about service opening-video replacement and email social-icon appearance. Existing enquiry/newsletter URLs, text, media selections, visitor settings, free WhatsApp flow and other functions are preserved.

## 1. Opening videos on all seven service pages

The service opening-video and secondary-video file widgets now use the explicit repository-root `/videos` upload directory and `/videos` public path. The previous relative widget folder could resolve under the content directory while the saved URL pointed at a different location. Admin configuration and script versions are refreshed.

The player uses the current CMS `hero_video` selection directly. It keeps the video element when replacing the source, correctly resets loading/error state, and does not mistake normal source-change AbortError or blocked autoplay for a broken file. It does not substitute the homepage's fixed compatibility video for a newly selected service video. If an old upload path is confirmed missing, it can try the same filename in the historical `/content/videos` folder.

An optional **Opening Video — Optional Compatible MP4 Copy** field supports an H.264/AAC MP4 copy of the SAME scene. It is tried only after the original fails. Image mode is also respected. The opening player remains 16:9, starts muted, loops, and retains its sound toggle. No existing video is transcoded, resized, replaced or included in this lightweight ZIP.

### Deploy and replace a service opening video

1. Back up the current website source. Merge this package into it, keeping all existing large video/image files. Include the new `assets/service-video.js`, `assets/service-video.css`, updated seven service HTML files, `assets/site.js`, `admin/config.yml` and `admin/index.html`.
2. Deploy the EXISTING main website Worker through your normal root `wrangler.toml` workflow. Preserve existing bindings, migrations, domain, secrets and integration URLs.
3. Reload `/admin/` with **Ctrl+F5**. Open the service you want to edit.
4. Use **OPENING VIDEO (FIRST ON SERVICE PAGE)**, not the secondary/legacy video field and not the homepage service image field.
5. Upload/select ONE video. For reliable broad browser support, export MP4 containing H.264 video and AAC audio; keep your original frame dimensions and desired quality. Prefer a new filename when replacing a file to avoid a stale browser/CDN copy. Renaming HEVC/MOV to .mp4 is not a conversion.
6. If you need to retain an original format that some browsers cannot decode, upload a compatible copy of the SAME video in the optional compatible-copy field. Leave it blank if the primary MP4 already plays.
7. Save and Publish, then wait for the website deployment to complete. Refresh the service page.
8. Open `/admin/service-video-check.html` on the published website. It lists all seven selected opening video URLs, HTTP/content-type checks and playback previews. It reads published `content/services.json`, so it will show the old selection until the CMS change has been published/deployed.

A 404 or HTML response at a video URL means the file/path/deployment needs correction. A reachable file can still contain a codec the browser cannot decode. Hosting/CMS file-size limits also remain in effect; frontend code cannot raise an account's upload limit. Actual failing/replacement videos were not attached to this task, so their codecs and upload status could not be inspected.

## 2. Blue/gold social icons, three rows of three, in both thank-you emails

The enquiry and newsletter email templates now use the same nine navy/royal-blue and gold PNG badges. Each icon is independently linked to its existing social URL, without a visible social-media name beside it.

| Row | Icons |
|---|---|
| 1 | Instagram · Facebook · LinkedIn |
| 2 | YouTube · WhatsApp Channel · Telegram |
| 3 | Threads · X · Google |

Email markup uses a three-column presentation table for compatibility rather than a single flattened image or CSS grid. The PNGs are displayed at 48 × 48 and include transparent edges. Accessible image descriptions and link titles are retained; they are not visible labels when images load normally. If an email client blocks all images it may display alt descriptions instead, according to that client's settings.

Existing destination URLs still come from published Decap Social Media settings. The company logo, signature/contact text, unsubscribe link and message content are unchanged. The main website's header/footer social icons are unchanged; this request applies to the automated email footers.

### Activate email changes

1. Upload/deploy **all nine files in `images/email-icons/`**, including the changed PNGs. Do not upload the nine-icon reference as a single clickable strip.
2. ENQUIRY project: open the existing Enquiries spreadsheet > Extensions > Apps Script. Replace `Code.gs` with `integrations/Code.gs` from this package. Keep `Bridge.html`, the free-mode `WhatsApp.gs`, EMAIL_WORKER_URL, EMAIL_WORKER_TOKEN and other existing settings.
3. Update the SAME enquiry Web app: Deploy > Manage deployments > edit > New version > Deploy. Execute as Me; access Anyone. Keep the same /exec URL. No new setup function or secret is required for this revision.
4. NEWSLETTER project: replace its `Code.gs` with `integrations/newsletter/Code.gs`. Keep the existing `VisitorAnalytics.gs`, spreadsheet, subscribers, tokens, Script Properties and triggers. Update the SAME newsletter Web app to a new version (Me / Anyone), preserving its /exec URL. The previous visitor setup is not repeated just to change icons.
5. Update the EXISTING separate email Worker from `cloudflare-worker/src/index.js`. Preserve its SMTP credentials, WORKER_BRIDGE_TOKEN, URL and other settings. It now advertises `2026-11-03-inline-v3` and accepts the branded PNG attachment sizes. The new enquiry script falls back to versioned public PNG URLs if the mail Worker is older, rather than sending unsupported CID references.
6. Send one controlled test enquiry and one test newsletter signup with your own email. Verify three rows of three icons, no visible platform names, and all nine links. Already-sent emails cannot be changed.

No live email was sent and no external system was deployed in preparing this package. Google/Cloudflare redeployment is required; replacing website HTML alone cannot update deployed email scripts.

## Validation

27 isolated automated tests pass, covering video URL handling, in-place replacement, missing-path recovery, explicit compatible-copy selection, autoplay/AbortError handling, both 3 × 3 email grids, all nine linked PNG payloads, SMTP MIME, old-Worker fallback and existing newsletter/unsubscribe/visitor/free-WhatsApp regressions.

Browser checks on all seven service pages used small locally generated H.264 QA clips, including filenames with spaces, and confirmed that selecting a replacement changes the active playing source. The sound toggle, error text contrast, desktop and 360px email layout, all nine loaded icons and destination links were checked. QA clips/pages are excluded from this ZIP. Actual user video files, Decap uploads and delivered email-client rendering remain to be checked after deployment.

Editable code-native badge SVGs and attribution are included under `images/email-icons/source/` and `LICENSE-Font-Awesome.txt`. The optional rebuild script is `scripts/build_email_icons.py`; it is not needed to deploy or use the supplied PNGs.

References: https://decapcms.org/docs/widgets/file/ ; https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/load ; https://fontawesome.com/license/free
