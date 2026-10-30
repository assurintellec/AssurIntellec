# AssurIntellec™ — Editorial Service Pages Update

**Edition:** 24 October 2026 — Seven-Service Editorial Architecture

This update restructures the seven individual service pages while retaining the existing homepage, company pages, navigation, Cloudflare configuration and Decap Turbo/GitHub backend settings.

## New service-page order

1. 16:9 photo/video hero and service-specific CTA.
2. Short executive introduction, with extended content hidden behind an optional disclosure.
3. Eight or nine core capabilities. Each has its own image, lead, two quick-preview points, expandable full scope, objective and scope note.
4. Optional specialisms/product categories (shown when this service has relevant source content).
5. Project approach or engagement stages (six stages for most services; distinct employer and candidate paths for Talent & Recruitment).
6. Typical deliverables (only when supported by the source document).
7. Target audiences and reasons to work with AssurIntellec™.
8. Additional scope considerations, a dedicated service contact block, important service note and related services.

## Edit in Decap Turbo

Open `/admin/` → **Services** → **All 7 Services**, then open the relevant service within **Service List**.

Editable fields include hero image/video selection (change **Hero Media Type** to `video` when a suitable MP4 is uploaded), hero text, introduction, navigation/section headings, body size and text colour, all eight or nine core capabilities with individual images and captions, process steps, lists of deliverables, audiences, differentiators, extra information, service-specific email, call-to-action links, and all new page UI labels.

For a capability, change the title, **Opening Statement**, **Detailed Overview**, **Support Activities**, **Expected Project Outcome** and **Important Scope Qualification** independently. The full scope is presented inside an accessible expandable panel.

**Media:** The 16:9 hero uses the existing service image by default. The core cards reuse images already provided in the website archive. Check every image against the subject before publishing and replace less-relevant placeholders with licensed original or rights-cleared images of appropriate equipment, facilities or professional activities. The service card images and hero image are editable in Decap Turbo. Video playback requires a real uploaded video; no video is fabricated.

## Typography and motion

Service-page dark text and large type are controlled with **Body Font Size (px)**, **Section Heading Font Size (px)** and **Text Color** fields. Scroll reveal is toggled per service with **Enable Service Animations**. Reduced-motion settings are respected.

## Service mailboxes

- GMP Engineering & Compliance: `gmp@assurintellec.in`
- Advisory & Transactions: `advisory@assurintellec.in`
- Talent & Recruitment: `careers@assurintellec.in`
- Life Sciences Trade: `trade@assurintellec.in`
- Pharma & Laboratory Technologies: `laboratory@assurintellec.in`
- Research & Scientific Services: `research@assurintellec.in`
- Pharma Solutions & Manufacturing: `manufacturing@assurintellec.in`

## Technical files changed

- `content/services.json` — modular service content.
- `admin/config.yml` — Decap Turbo fields for modular content and visible page labels.
- `assets/site.js` — new semantic service renderer.
- `assets/service-editorial.css` — responsive editorial service design system.
- Seven `service-*.html` files — load the new stylesheet.

Other site files and the existing CMS backend section are unchanged.

## Local verification performed

- JavaScript syntax validation via Node.js.
- Decap YAML parsing with PyYAML.
- Services JSON parsing and all seven data records verified.
- Template executed with a DOM stub for all seven services and checked for hero, core cards, contact section, dedicated email and absence of undefined output.
- Media paths referenced by page data confirmed present in the archive.

**Not verified:** Live browser layout across devices, Decap GitHub authorization, live GitHub publishing, Cloudflare deployment, video loading and mail delivery. These depend on your deployment and should be confirmed on a staging URL before replacing the current site. There is no guaranteed live Decap publish test in this ZIP.

The Word document remains the authoritative source for precise legal, regulatory and service-scope wording; inspect all content and qualifications before launch.
