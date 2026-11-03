# AssurIntellec mobile refinement — 3 November 2026

This package adds responsive refinements to the latest Word document 9 website source. Existing copy, service selections, social destinations, media paths, Decap settings, integrations, visitor settings and free WhatsApp flow are retained.

## What changed

- A sticky phone/tablet header, clear menu icon, highlighted current section and larger navigation targets. The menu reports its open state, closes with Escape or a click outside, and resets when returning to desktop width.
- The phone homepage keeps the complete 16:9 video, then presents the main message and full-width action buttons, followed by a readable two-column trust area. Longer rotating service names wrap across lines, with reserved space to reduce movement. Visitors requesting reduced motion receive the configured static heading.
- Fluid page and section headings, balanced spacing, readable card copy and improved narrow-screen service panels. Desktop layout rules remain intact.
- Single-column enquiry/newsletter fields on phones, 16px form text, generous controls and clearer focus states. Floating contact buttons hide while an input is focused.
- Wrapped footer social icons with individual 44px targets. Phone chat sizing and safe-area spacing are improved. The enquiry popup remains scrollable, with its close button available while scrolling. The thank-you confirmation fits short screens.

The responsive layer is `assets/mobile-refinement.css`, loaded after existing styles on all 14 public website pages. Breakpoints are 1020px for navigation/tablet behavior and 700px for phone layouts, with an additional adjustment at 360px. Existing mobile spacing/logo settings still supply values within sensible phone limits.

## Apply this update

1. Back up your current website source.
2. Merge the updated public HTML files, `assets/site.js` and new `assets/mobile-refinement.css` into the existing project. Keep all existing large videos/images and current content. Do not delete uploaded media to match this lightweight ZIP. If other changes were made to those HTML/JS files after this package, merge the differences before deploying.
3. Deploy the existing main website using the same hosting/Worker workflow and configuration. Keep the current domain, backend URLs, bindings, migrations and private values.
4. Hard-refresh after deployment. The HTML loads the JavaScript and responsive stylesheet with version `20261103-10` to refresh those assets.
5. On your phone, open/close the menu, search for a service, visit a long service page, enter an enquiry, inspect newsletter fields and scroll to the footer. Check the popup and thank-you confirmation with a controlled test after deployment.

Only website deployment is needed for these mobile refinements. No Apps Script, separate email Worker, WhatsApp or Decap setup change is introduced here. The earlier document 9 email/video changes remain included; if those are not yet active, follow `WEBSITE_UPDATE_03-11-2026_REV9.md` separately.

## Validation

- Browser geometry checks passed for all 14 public page templates at 320, 390 and 768px. Supplemental checks covered home, contact, GMP service and the Technical Focus detail page at 320, 360, 430, 1024 and 1440px: 62 layouts total, without horizontal page overflow or clipped main headings/paragraphs.
- Phone enquiry/newsletter form text measured at least 16px. Header navigation and footer social targets measured 44px or larger. Search results stayed within the viewport. Menu state, Escape dismissal, sticky header behavior, service navigation, chat fit, scrolling popup close control and short-screen confirmation were checked.
- All 27 existing isolated integration/video regression tests pass. JavaScript syntax was checked. Content, media assets, admin configuration, backend scripts, Worker configuration and video-player modules match the previous source version byte for byte.

The preview used the lightweight source and the supplied company logo. Large deployed images/videos are not included in this ZIP; actual device playback, virtual-keyboard behavior and live email/enquiry delivery should be checked after deployment. No live enquiries, subscriptions, messages or external deployments were performed. Preview pages and test media are excluded from the download.
