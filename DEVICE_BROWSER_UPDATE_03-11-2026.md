# AssurIntellec device and browser refinement — 3 November 2026

This revision extends the previous phone update to tablet portrait/landscape, short landscape screens and entry from an Instagram bio link. It targets current Chrome, Firefox, Microsoft Edge and Safari. Existing company copy, media paths, Decap settings, free WhatsApp flow, enquiry/newsletter integrations and backend settings remain intact.

## Changes

- Navigation now adapts up to 1380px, covering larger tablets and narrow desktop windows. Tablet headers use one row for logo, search and menu. Short landscape headers measure about 65px rather than the previous 137px. Larger desktop windows retain the existing full navigation.
- Tablet homepage text follows the full video frame, with readable service names, descriptions, buttons and trust items. Long rotating names wrap on smaller screens, and desktop title fitting resets correctly after resizing. The film is contained within the available landscape height; the original file is not cropped or resampled.
- Tablet cards, contact content and footer use appropriate grids and larger controls. Service detail copy stays in its existing single-column layout. Form and search text remain at least 16px at compact widths.
- Viewport metadata permits notch-safe rendering and asks supporting browsers to resize the layout for the virtual keyboard. A small local script reads the visual viewport, using the window height when unavailable. Dialogs and chat use the visible screen height and offsets; pinch zoom remains available. Resize, rotation and back-navigation events refresh the measurements.
- The enquiry popup, confirmation, assistant and privacy notice scroll within short screens. The popup close control remains available while scrolling. Floating controls hide during form entry. Unequal side cutouts are accounted for in header and content alignment.
- Instagram bio query parameters do not trigger a redirect or browser-specific layout. The same public website can open inside an embedded browser. The update does not force an external browser, read Instagram account data or change the account.

## Deploy

Follow `START_HERE_DEVICES_03-11-2026.txt`. Merge all 15 updated public HTML files, `assets/site.js`, `assets/mobile-refinement.css` and new `assets/responsive-layout.js`. Responsive scripts/styles use cache version `20261103-11`. Preserve your current content, large media, backend configuration and credentials. Redeploy the existing main website only.

No Apps Script, separate mail Worker, WhatsApp or Decap change is needed for this responsive revision. Earlier document 9 activation instructions remain in `WEBSITE_UPDATE_03-11-2026_REV9.md` if those changes are not active yet.

## Screen checks

The final browser audit checks all 15 public pages, including all seven services, a configured Why Us detail page, unsubscribe and maintenance, at these 12 viewport configurations. These are CSS-pixel layout checks in Chrome, not physical-device or separate browser-engine certification.

| Size | Scenario |
|---|---|
| 320 × 568 | Small phone portrait |
| 390 × 844 | Phone portrait |
| 568 × 320 | Small phone landscape |
| 844 × 390 | Phone landscape |
| 768 × 1024 | Tablet portrait |
| 1024 × 768 | Tablet landscape |
| 820 × 1180 | Large tablet portrait |
| 1180 × 820 | Large tablet landscape |
| 1024 × 1366 | Large tablet portrait |
| 1366 × 1024 | Large tablet landscape |
| 1280 × 800 | Wide tablet / narrow desktop |
| 1440 × 900 | Desktop |

Additional interaction checks cover landscape menu bounds and scrolling, Escape dismissal, enquiry text retention after a portrait/landscape resize, short-screen popup/confirmation/chat bounds, popup close-button access after scrolling, and asymmetric 44px/18px side gutters. A small H.264 QA clip confirmed decoding and contained playback in a short landscape service frame; test clips are excluded from the ZIP. The homepage audit includes representative Instagram bio tracking parameters.

31 isolated automated tests cover visible viewport/keyboard calculations, resize and back-navigation recovery, video replacement, newsletter/unsubscribe, email icons, visitor data and free WhatsApp regressions. Existing content, images, admin configuration, integrations, routing and video-player files match the previous source version.

## Browser and device sign-off

| Environment | Completed here | Check after deployment |
|---|---|---|
| Chrome | Responsive geometry and selected interactions in the preview | Actual Android phone keyboard, media and enquiry delivery |
| Microsoft Edge | Standards-compatible code review | Windows/Android application checks |
| Firefox | Standards-compatible code review | Desktop/Android application checks |
| Safari | WebKit viewport/safe-area guidance and compatible fallbacks | iPhone/iPad toolbar, keyboard, rotation and media checks |
| Instagram on iPhone/Android | Website entry with bio query parameters; embedded-window size checks | Open the real bio link in each app and send a controlled test enquiry |

No live forms were submitted and no external site/account/deployment changed. Actual uploaded media codecs, browser media permissions, embedded third-party content, virtual keyboard behavior and delivered email need real-device checks after deployment. The test environment does not provide Safari, Firefox, Edge or the Instagram app, so those checks are not represented as completed.

Implementation references: [MDN viewport metadata](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport), [MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport), [MDN safe-area environment variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env), [WebKit viewport units](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/).
