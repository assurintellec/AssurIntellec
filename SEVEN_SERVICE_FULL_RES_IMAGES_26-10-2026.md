# AssurIntellec™ — 26 October 2026 | Seven services: original-quality, uncropped images

## What was updated

- The **Services tab** (`services.html`) now presents **seven individual 16:9 image-and-text cards**; each uses the separate service's CMS-controlled hero image. The homepage service-title card presentation is left intact.
- On opening **any of the seven individual service pages**, the main banner now defaults to that service's **image with its service title and description**, not the former autoplay video. Service videos are preserved and can still be selected in the CMS.
- **Every photo in the seven service detail pages** — hero, main capability/service area, audience, specialised focus, additional scope — has a 16:9 frame with `object-fit: contain` so nothing is cut off. The previous unusually short `16:5` and `16:6` crops and small fixed `max-height` limits are removed. The hero's text panel sits **below**, rather than over, the full image.
- **Every detail photograph opens its full original uploaded file** when clicked, in a separate tab. The website's responsive presentation does not resize or recompress the underlying source file. The browser scales its display to fit a phone/tablet; the original is never changed or replaced by a low-resolution derivative.
- **Decap image processing is explicitly disabled** with `media_processing: {enabled: false}`. This preserves original uploaded bytes, dimensions and image format. No 5 MB image upload limit or 1920px resize is enforced in the CMS configuration. The actual Git repository, provider and browser can still impose upload limits.
- Every service photo location retains its **normal `image` CMS field** and also has an **optional `file` upload field** for advanced image types. An uploaded `..._image_file` takes precedence over that location's regular photo until cleared. The files go to `/images/uploads` and the published URLs use `/images/uploads/`.
- All seven existing separate hero/capability images are kept; original service videos, content, metadata, CMS backend `turbo-github` setup and other site assets are preserved.

## How to edit photos in Decap Turbo

Open **Site Admin → Services → All 7 Services → Service List → choose one service**:

| Website photo | CMS editor |
| --- | --- |
| Services tab card + large service page image | **Main Service Image (16:9) / Video Poster** (`hero_image`) |
| Alternate/legacy main image | **Alternate Main Image / Video Fallback** (`primary_image`) |
| Each individual capability image | **Core Capabilities → Section Visual** (`core_services[].image`) |
| Who We Support photo | **Who We Support Visual** (`resource_image`) |
| Specialised focus image | **Specialised Focus → Optional Image** (`focus_areas[].image`) |
| Additional info image | **Additional Information → Optional Image** (`additional_information[].image`) |
| An alternative modern original image format | Corresponding **Optional Original ... File** field (`*_image_file`) |
| Switch image/video | **Hero Media Type (16:9)** — leave as `image` for photos |

For best visual results upload **genuine 16:9 artwork** such as **1920×1080, 2560×1440 or 3840×2160**. Because the display uses `contain` rather than cropping, other aspect ratios will appear with side/top borders within the 16:9 frame. This avoids losing content. The source image remains at its original pixel dimensions, even when viewed on a smaller screen. The included older 960×540 images are untouched and cannot gain missing detail merely by displaying them bigger.

### Image file type support

- **Standard Decap image field:** JPG/JPEG, PNG, WebP, GIF, BMP, TIFF and SVG per the Decap CMS image widget's supported picker types.
- **Advanced original file field:** Uploads AVIF and other image extensions through the general `file` widget. It accepts more kinds of files but the site can **only display what the visitor's browser understands**. AVIF is widely supported by modern browsers; TIFF, HEIC/HEIF, JPEG XL and some RAW formats are not universally rendered. For these cases, prefer an original-quality browser-supported PNG/WebP/JPEG version if visual display is essential. The original-file link remains available if the browser cannot preview the file.
- A promise of **every possible image extension on every browser is not technically possible**. Do not upload executable or other non-image files in the advanced image field. Only upload photographs/illustrations with permission, especially when using SVG.

### Deployment checks

1. Upload the **contents** of `AssurIntellec-main` to the current Git branch that serves the live website, keeping directories and names intact.
2. Open `services.html` and verify all 7 image/text cards; open each individual service page and confirm its 16:9 uncropped hero and each section photograph.
3. Open `/admin`, select one service, upload a new unique 16:9 image, **Publish**, and confirm it appears on both the Services tab and that service's hero. If the standard Decap image field does not support an extension, use the corresponding optional original-file field.
4. Ensure image filenames and paths are unique across services and their sections. The existing duplicate-prevention logic can replace a repeated image with a branded text fallback.
5. The ZIP contains code/configuration only; Git/Decap permissions, CMS publishing, browser codec support and backend upload limits cannot be established offline.
