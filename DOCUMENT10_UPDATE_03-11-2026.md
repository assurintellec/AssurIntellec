# AssurIntellec — Word document 10 update

This revision implements `10.Website_Update_03-11-2026.docx`. It supersedes older notes about the mobile/tablet composition and the email footer template. Previous video, enquiry, subscription, unsubscribe, visitor and free WhatsApp changes remain included.

## 1. Blue-and-gold icon-only email links

Both independent Apps Script projects render the same nine navy/blue-and-gold badges as individual links in a three-column presentation table:

| Row | First | Second | Third |
|---|---|---|---|
| 1 | Instagram | Facebook | LinkedIn |
| 2 | YouTube | WhatsApp Channel | Telegram |
| 3 | Threads | X | Google |

These names describe the mapping in this guide; no platform name is printed beside or beneath the icons in the HTML email. The existing PNG/SVG artwork already uses the reference palette and is retained. All nine destination URLs still come from the existing published social settings. Company branding, contact details, email body and unsubscribe behavior are preserved.

The previous source already had a 3×3 grid, but its nonempty image alt text could show platform names if a client blocked the images. Social images now use empty visual alt text and presentation roles, while each link retains an accessible label and title. Inline PNG attachment payloads remain bundled in both scripts. The old SMTP Worker fallback uses refreshed public PNG URLs. Plain-text email alternatives retain usable links because they cannot display graphic icons. An email client's image-blocking settings can still prevent pictures from displaying.

The new footer version is `2026-11-03-icons-only-v4`. Each Apps Script now exposes read-only layout metadata for that version. The website's `/admin/email-footer-check.html` previews HTML generated from the actual email template and checks both deployed scripts through `/api/email-footer-status`. The check reports an old deployment, missing URL or unavailable backend without sending mail, writing a spreadsheet or returning private settings. A current template version confirms deployment of the template; it does not prove a particular inbox rendered its images.

### Required activation

1. Merge/deploy the updated main website source, including new `email-footer-status.js`, updated `maintenance-router.js` and `.assetsignore`, new preview/check files, the updated public HTML/CSS/JS and all nine `images/email-icons/*.png`. Preserve existing large media and live settings.
2. ENQUIRY project: replace only `Code.gs` with `integrations/Code.gs`. Retain `Bridge.html`, free-mode `WhatsApp.gs`, properties, spreadsheet and private values. Save, then Deploy > Manage deployments > Edit > New version > Deploy. Preserve the existing `/exec` URL and existing Me / Anyone deployment settings.
3. NEWSLETTER project: replace only `Code.gs` with `integrations/newsletter/Code.gs`. Retain `VisitorAnalytics.gs`, subscriber rows, unsubscribe tokens, properties and triggers. Update the SAME Web app to a new version, preserving its URL and Me / Anyone settings.
4. Open `/admin/email-footer-check.html` after the website deploys. Confirm nine loaded icons, then select **Check deployed templates**. Both template cards should detect the current version. A website-only update or saved-but-not-deployed script is insufficient.
5. Send a new controlled test enquiry and newsletter signup with your own email. Check three rows of three, individual icon links and no visible platform labels. An older received message remains unchanged.

No new setup function, secret, paid WhatsApp feature or newsletter migration is required. The separate SMTP mail Worker is unchanged in this revision. Earlier document 9 instructions still apply if its Worker/video changes were never activated. Optional `inspectEmailFooterLayout` in each script logs layout metadata without sending mail.

## 2. Desktop-style design across devices

Wider tablets (1000–1180px) now keep the desktop composition: video and text share the opening hero, the trust row sits at its bottom, and the service overview uses three columns. At 1100px and above, the about/contact/footer layouts also regain the desktop column structure. Full desktop navigation resumes above 1180px rather than keeping larger desktop windows in the compact layout.

Phones and narrower tablets retain the same content, service destinations, media selections, search, navigation, chat, WhatsApp, enquiry, subscription and footer functions. Their layout adapts to maintain readable type and usable controls. Short windows keep media and text separate when the desktop overlay would collide. Original media files are not cropped or resized. Service detail text remains in its existing one-column arrangement. A subtle gold divider is shared by service cards on desktop and mobile.

The added stylesheet is `assets/desktop-consistency.css`, loaded after the existing responsive styles on all 14 public content pages. Changed site JavaScript/styles use cache version `20261103-doc10`. The previous viewport/keyboard, safe-area and orientation handling remains present. No forced desktop viewport or zoom restriction was introduced.

## Validation and limits

- All 36 isolated automated tests pass, covering both icon grids, PNG bytes and links, read-only deployment detection, old-deployment failures, viewport behavior and the existing video, email, newsletter, unsubscribe, visitor and WhatsApp regressions.
- All 15 public pages passed 180 page/viewport checks in Chrome over 12 phone, tablet and desktop configurations, including portrait and landscape. No horizontal page overflow, clipped main text or compact-layout form text below 16px was detected. The desktop-style tablet hero was checked for separation between the copy and trust row; all seven service cards and navigation/search/chat/newsletter controls were present.
- Browser preview confirmed nine loaded 48px icon images, three rows of three, nine original destination links and no visible grid text. Both outdated/current deployment states were checked with local fixtures; no live deployment status is claimed.
- Current content, uploaded image assets, Decap configuration, video modules, visitor scripts, newsletter transport, Worker configuration and separate SMTP Worker match the previous source.

Actual Safari, Firefox, Edge, Instagram-app behavior, user media codecs and delivered email rendering still require device/inbox checks after deployment. This preparation did not change an external site/account, submit a live form or send a live email. The ZIP remains lightweight; retain your existing large videos and photographs. QA pages/clips are excluded.

References: [Google Apps Script Web apps](https://developers.google.com/apps-script/guides/web), [MailApp HTML/inline image options](https://developers.google.com/apps-script/reference/mail/mail-app).
