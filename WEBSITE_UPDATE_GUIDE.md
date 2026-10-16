# AssurIntellec website update guide (16 October 2026)

## Decap CMS updates
- Open `/admin/` and publish the **Complete Website Settings** entry. Text and profile/detail fields are optional; blank optional entries are skipped by the site.
- Clickable media are controlled globally at **Media Options → Clickable Images Enabled** and individually by each item's **Enable Link** toggle and **Link URL**. A blank URL never creates a dead link.
- Replace the header logo under Media Assets → Header / Main Logo; replace the browser icon under Website Favicon; and replace the Organization/Google Search logo under Google Search / Organization Logo. These fields are wired to the live site output. Hero, founder, service, Why Us, certificate, client, expert, and footer media are edited in their corresponding content fields, avoiding duplicate inactive upload settings.
- Replacement images support the usual browser image formats accepted by Decap's image picker (PNG, JPG/JPEG, WebP, and GIF where supported). Recommended sizes: certificates 600×400 px, company logos 600×300 px, expert portraits 600×750 px, and service/Why Us visuals 1600×900 px (16:9). Recommended image file size is up to 5 MB. The CMS hint is advisory: the Git-backed upload widget does not enforce a universal pixel/file-size cap in every hosting configuration.
- For a service or Why Us video, select Video in its media type field and upload an MP4 (recommended 1920×1080 / 16:9, up to about 25 MB). Keep the video short and compressed for faster loading.
- The ten optional expert slots are labeled `Expert_1` through `Expert_10`. Enable only the records with real information; empty/disabled entries stay hidden.
- Ten Instagram Reel slots are available. Paste a public Reel URL into each slot, enable it, then publish. Left/right arrows cycle through all configured links.
- The visitor counter uses a stable CounterAPI namespace/action/key. Keep those values unchanged during routine website file replacements. `Starting Value` is an offset that can be used if you intentionally create a fresh CounterAPI key: set the key to a new value and set the starting value to the last count you want to carry forward. The displayed count is `Starting Value + CounterAPI value`.
- The social Google icon link is set to `https://share.google/BDZ7i6bRNwF4qLD3S`; it can be changed in the Social Media list.
- The footer uses `videos/footer-logo-animated.mp4` inside a pure-black panel. In Decap CMS → Media Assets, choose Video mode and replace the video, or choose Image mode to use the editable logo image with a subtle animation.
- Theme & Layout exposes standard sizes/colors. **Text Style Overrides** can target individual selectors (for example `#heroHeading`, `.service-card h3`, or `.testimonial-text`) with font size, color, family, weight, and style.

## Maintenance mode (Cloudflare)
1. Deploy `cloudflare-worker/maintenance-worker.js` as a separate Worker using `cloudflare-worker/maintenance.wrangler.toml` as a reference.
2. Add the route `www.assurintellec.in/*` (and `assurintellec.in/*` too if the apex domain serves the site).
3. Add a Worker variable `MAINTENANCE_MODE` set to `OFF`. When an update starts, change it to `ON`; change it back to `OFF` after publishing.
4. The page HTML is embedded in the Worker. It therefore still displays if you remove the site's static files while maintenance mode is ON. Use a separate Worker to avoid modifying the existing enquiry/email worker.

## Enquiry form safety
The existing form markup IDs, submission JavaScript, Google Apps Script bridge, confirmation overlay, and Apps Script/SMTP integration have not been intentionally changed. Test a real enquiry and automatic confirmation email after deployment because this local ZIP cannot verify external account secrets or live email delivery.


## Updates applied on 16 October 2026
- Decap loads the stable 3.x release (not the beta CDN bundle) and explicitly uses the simple publish mode with the existing Turbo site UUID and `main` branch. Review `DECAP_TURBO_PUBLISH_CHECKLIST.md` for required account-side checks.
- Why Us cards navigate to individual full pages at `why-us-detail.html?point=<slug>`. Unique slugs, detail media and full subsections are editable in Decap.
- Contact display address and the external Google Maps share URL are editable in Site Settings; the map embed has its own separate URL.
- Footer background is black, footer social icons remain on one line, bottom text is larger, and hover/scroll animations are controllable via the new Animation & Motion settings.

- Why Us cards now open separate full pages via `why-us-detail.html?point=<slug>`; each card has its own editable slug, 16:9 image/video, introduction and flexible subsections.
