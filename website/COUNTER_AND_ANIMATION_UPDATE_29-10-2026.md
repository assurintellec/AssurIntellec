# AssurIntellec — visitor counter and animation update

## Starting number and new visits

The saved starting value remains **148160**. The displayed number is:

**Starting Value / Carry-Forward Offset + visits recorded by the new persistent counter**

For example, the first new visit displays **148161**; twelve new visits display **148172**. A visit groups page views from the same browser. Navigating between pages or refreshing does not add another visit while that visit is active. Thirty minutes of inactivity starts a new visit. This measures browser visits, not verified individual people.

To change the starting number, open **Decap → Site Settings → Complete Website Settings → Visitor Counter → Starting Value / Carry-Forward Offset**, then Save and Publish. Enter a non-negative whole number. Set the starting number before the first deployment of this update. After visits have accumulated, the field remains an offset: changing it changes the displayed total by the same amount.

Keep **Counter Namespace**, **Counter Action**, and **Counter Key** unchanged during normal updates. The persistent visit total survives file replacements and Worker deployments. To intentionally begin a new counter, use a new Counter Key and enter the desired starting value; the old counter's stored data remains associated with its old key.

This update moves counting away from the external CounterAPI service. It carries forward your saved starting number. It does not import any additional historical total from that external service. If your last confirmed historical total differs from 148160, enter that total as the starting value before launching this version.

## Deploy the persistent counter

Your uploaded website already includes a Cloudflare Worker and a root `wrangler.toml`. Deploy the **complete updated project with that root configuration**, including:

- `maintenance-router.js`
- `visitor-counter.js`
- `wrangler.toml`, including the new `VISITOR_COUNTER` binding and `visitor-counter-v1` migration
- All updated HTML files, `assets/site.js`, `assets/premium-motion.css`, and `admin/config.yml`

For an existing Git-connected Cloudflare Worker deployment, merge these files into the same repository and deploy from the project root. With Wrangler already authenticated for your website, the deployment command from this folder is `npx wrangler deploy`. Keep your existing domain, environment variables, maintenance switch, and mail Worker settings.

The new binding creates a SQLite-backed Durable Object for shared, persistent visit storage. The code and binding must be deployed together. Uploading only static HTML/CSS/JS files cannot activate this backend. This ZIP does not change your live website by itself.

After deployment, open `/api/visitor-count` on your website. A successful read returns JSON with `value` (new visits), `start_value`, and `total`. Reading this URL does not add a visit. Open the website in a separate browser/private session to confirm that a new visit adds one; moving between its pages should retain the same count.

During a connection interruption, the website displays the last confirmed numeric total available to that browser, or the configured starting number if none has been confirmed. It automatically retries and refreshes on reconnection. It does not invent visits while the server is unreachable; a visit counts when a request reaches the persistent backend. Hovering over the counter explains whether the number is live or retained.

## Animation controls

The update adds coordinated page and section reveals, button sheen, card border/shadow transitions, navigation accents, expanding-detail transitions, and a thin reading-progress line. It adds no animation libraries or external scripts.

**Decap → Site Settings → Complete Website Settings → Animation & Motion → Enable Enhanced Motion** controls the new decorative effects. Its default is ON. The existing scroll-reveal, duration, distance, text-hover, card-hover, and homepage image/text switches retain their current settings. Each service's **Enable Service Animations** switch is also respected. A device's reduced-motion preference disables the effects automatically.

The seven homepage service image and text zoom switches remain OFF in your saved settings. This update adds no image/video parallax or new media zoom behavior. It does not change aspect ratios, media sources, or their layout positions.

## Preserved files and media

All existing website content JSON files, enquiry and email integration files, supplied photos/videos, and the existing service stylesheet remain byte-for-byte unchanged. HTML changes only add the new stylesheet and refresh shared asset versions. The CMS changes are restricted to the counter help text/non-negative limit and the new optional enhanced-motion switch.

Merge the ZIP into your current website files. **Retain the photos and videos you omitted from the upload at their existing paths**, including files under `images/`, `images/uploads/`, `videos/`, and `content/videos/`. Do not delete those existing folders when applying this update. No omitted media has been recreated or renamed.

## Verification

The persistent-counter checks cover the starting offset, concurrent visitors, duplicate retries, repeat page requests, persistence after object restart, offset edits, expired visits, the enable/disable switch, invalid requests, and maintenance mode. Source and configuration comparisons verify preserved content, media, enquiry integration, and previous CMS controls. JavaScript syntax and the client counter/motion-control logic were checked.

The live site was not deployed. A browser preview could not run in this environment; check the responsive appearance and media playback after merging the omitted media and deploying.

Implementation references: [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/get-started/) and [SQLite storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/).
