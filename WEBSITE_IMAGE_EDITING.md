# Website image and media editing

All media references are managed through **Decap CMS → Site Settings → Complete Website Settings**, the **All 7 Services** collection, and `content/site.json` / `content/services.json` in GitHub. When using Decap, choose the replacement from the media picker and publish; the CMS updates the JSON file reference to the actual uploaded file. The prescribed filenames below are the recommended GitHub naming convention for a one-to-one asset replacement.

## Dedicated image names
- Certificates / approvals: `FDA`, `ISO`, `GLP`, `WHO_GMP`, `Revised_Schedule_M`, `NABL`
- Clients: `Envacare`, `Axelus_Pharma`, `Client_3`, `Client_4`, `Client_5`
- Experts: `Expert_1` through `Expert_10`
- Service detail media: `Service_1` through `Service_7`
- Why Us images: `Why_1` through `Why_4`

PNG, JPG/JPEG, and WebP are recommended for photos/logos (GIF where supported by the CMS). Recommended dimensions: approval logos 600×400 px, customer logos 600×300 px, expert portraits 600×750 px, and service / Why Us visuals 1600×900 px (16:9). Aim for images under 5 MB. Videos should be MP4, 16:9, preferably 1920×1080 and compressed (about 25 MB or less). These are recommendations shown in CMS help text; exact upload limits depend on the configured Decap/Turbo media backend.

## Optional clickable media
The **Media Options → Clickable Images Enabled** setting is the global switch. Each supported media record also has **Enable Link** and **Link URL** controls. Both switches and a safe HTTP(S) or site-relative URL are required for the image to act as a link.

## Replacing images without filename conflicts
Decap automatically changes the JSON media reference when you upload a new filename. For direct GitHub replacements, keep names distinct and update the matching JSON media path. Do not rename an asset without updating its JSON reference.


The visible `Client_3.png`, `Client_4.png`, and `Client_5.png` files are labelled placeholders only, not real client trademarks; replace them with the actual client logos in Decap CMS when available. The 10 expert records default to `Expert_1`–`Expert_10` but remain disabled until each profile is completed and enabled.
