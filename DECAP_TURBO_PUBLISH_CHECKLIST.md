# AssurIntellec CMS, publishing and website update notes

## Decap CMS and Turbo backend

- The CMS loader at `admin/index.html` uses the stable Decap CMS 3.x CDN entry point. The old `decap-cms@beta` loader has been removed because the Decap Turbo backends are supported in the stable release.
- `admin/config.yml` uses `backend.name: turbo-github`, the existing site UUID, and branch `main`. Publishing mode is explicitly `simple`, so an editor's Publish action should commit to the configured publication branch rather than creating an editorial-workflow draft.
- Before live verification, sign in to the Decap Turbo dashboard and confirm that the site with ID `970e4e24-dfda-4ae1-beec-118e1dc52488` is connected to the intended GitHub repository, uses branch `main`, and points to `admin/config.yml`. The Turbo dashboard's Admin interface URL list must include `https://www.assurintellec.in/admin/`; add any other hostname from which editors sign in, such as `https://assurintellec.in/admin/`. The signed-in user must have access to this specific Turbo site. These account-side values cannot be verified from a source ZIP.
- Test after deployment by editing a low-risk text value, publishing, and confirming that a commit appears on the correct GitHub repository's `main` branch. If the commit appears but the public site does not change, check the Cloudflare Pages/Workers deployment connection and build status. A successful CMS commit and a successful hosting deployment are separate events.
- If Publish appears to do nothing, open browser DevTools → Console and Network while publishing; save any error text. Confirm Turbo's GitHub App has access to the repository and check Turbo's site access / config path. Do not switch the backend to `github` or `git-gateway` unless a separate authentication server has been configured.

## Contact location

Edit in Decap CMS → Site Settings → Contact & Enquiry fields. The exact visible address is stored in `Address Display`; structured address fields support organization metadata. `Google Maps Embed URL` is used for the inline map. `Google Maps Open Link` is the external click-through, so a `maps.app.goo.gl` share link can be used without breaking the iframe.

## Why Us detail pages

Edit in Site Settings → Why Us Details. Each enabled point needs a unique Page Slug such as `technical-focus`. Clicking a Why Us card now opens `why-us-detail.html?point=<slug>` as a separate full page. The main media is 16:9; its image/video and detail sections remain editable from Decap. Keep slugs stable after links have been shared.

## Animations and text styling

Site Settings → Animation & Motion controls hover text zoom, scroll reveal, animation speed/distance and card lift. Text Style Overrides can target individual CSS selectors and set font size/color/family/weight/style plus text alignment, line-height, letter spacing and decoration. Respect for reduced-motion preferences is built in.

## Footer

The footer background defaults to pure black, social icons stay on a single horizontally scrollable line on narrow layouts, and footer text sizes have been increased. Theme & Layout values remain editable from Decap CMS.
