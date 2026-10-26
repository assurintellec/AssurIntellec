# Homepage Service Text Hover Animation — Independent Decap Turbo Switch
Date: 26 October 2026

## What has changed
The seven service cards on the homepage can now separately enable/disable text hover zoom. **Default: OFF** to prevent headings (such as "GMP Engineering & Compliance") from growing and clipping inside the cards. Service numbers, titles and descriptions stay still while hovered over when this switch is OFF.

This is a separate setting from the existing **Homepage Service Image Hover Zoom** switch. Neither setting affects the seven individual service-page opening videos.

## Using Decap Turbo
1. Deploy the contents of this ZIP to the site's hosting/repository.
2. Sign into https://www.assurintellec.in/admin/.
3. Select **Site Settings → Complete Website Settings → Animation & Motion**.
4. Find **Homepage Service TEXT Hover Zoom (7 service cards) — Default OFF**.
5. **OFF:** no text zoom for the seven homepage cards (recommended; default).
6. **ON:** titles, descriptions, and numbers enlarge slightly when directly hovered or keyboard-focused.
7. Click **Save / Publish** and refresh the homepage with Ctrl+Shift+R.

## Manual method
Edit `content/site.json` within the `animation_options` object:

```json
"homepage_service_text_hover_zoom": false
```

Change `false` to `true` to enable. Deploy the updated JSON with your website. A missing key is treated as OFF.

## CMS / code wiring
- `admin/config.yml`: field `homepage_service_text_hover_zoom` in the `animation_options` object.
- `content/site.json`: saved `animation_options.homepage_service_text_hover_zoom` (default `false`).
- `assets/site.js`: `applyAnimationOptions()` maps it to the root HTML attribute `data-home-service-text-hover-zoom`.
- `assets/site.css`: only applies to `body[data-page="home"] #servicesGrid` text; prevents scaling of the text wrappers that previously clipped the headings.
- `index.html`: assets have an updated cache-busting version, so browsers load the new CSS and JS.

## Behavior kept unchanged
- All seven opening service-page videos, including playback and CMS replacement behavior.
- Separate homepage image hover switch, default OFF.
- 16:9 service images and their original full-resolution files.
- Text animations elsewhere on the website.
- Existing service card links, titles, descriptions and icons.

If Decap Turbo publishes are blocked by GitHub or backend permissions, the toggle will not affect the live site until changes to `content/site.json` are successfully published.
