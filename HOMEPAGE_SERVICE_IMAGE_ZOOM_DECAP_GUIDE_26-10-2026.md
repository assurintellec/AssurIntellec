# Homepage Service Image Hover Zoom — Decap Turbo Switch (26 October 2026)

## New feature

The latest AssurIntellec website ZIP now has a **working CMS switch** for zooming the seven images in the service cards on the HOME page. It is **OFF by default**, and saved as `false` in `content/site.json`.

## How to turn the animation ON or OFF

1. Deploy this revised website ZIP (replace the previous site files with this version).
2. Open `https://www.assurintellec.in/admin/` and sign in to Decap Turbo.
3. Open **Site Settings → Complete Website Settings → Animation & Motion**.
4. Find **Homepage Service Image Hover Zoom (7 service cards) — Default OFF**.
5. Switch **ON** to zoom images on mouse hover; switch **OFF** to stop zoom. Then **Save / Publish**.
6. Open the homepage and reload (Ctrl+Shift+R) to confirm the published setting.

## Technical mapping

- Decap schema: `admin/config.yml`, within `animation_options`.
- Saved value: `content/site.json` → `animation_options.homepage_service_image_hover_zoom` (`false` by default).
- Runtime: `assets/site.js` sets `html[data-home-service-image-hover-zoom="true|false"]` from that JSON value.
- Animation: `assets/site.css`, restricted to `body[data-page="home"]` and `.service-card-with-image .service-tile-image img`.
- The value must be exactly `true` to enable zoom. Missing values also mean OFF.

## Unchanged behavior

- All seven opening service videos and their CMS replacement controls are **unchanged**.
- Homepage 16:9 images, original uploads and filenames are **unchanged**; zoom is CSS-only, not an image resize.
- Text hover zoom and other animation settings **remain independent**.
- Zoom on service-detail page images/videos **remains disabled**.
- Browser preference for reduced motion disables this image zoom automatically.
- If the Decap changes fail to publish due to a backend/GitHub permission problem, the switch cannot update the live website until publishing is fixed.

## Manual option

For advanced manual changes, edit `content/site.json`:

`"homepage_service_image_hover_zoom": false`  → no image zoom  
`"homepage_service_image_hover_zoom": true` → image zoom on hover

Keep the option inside the `animation_options` object, save valid JSON and deploy the edited file.
