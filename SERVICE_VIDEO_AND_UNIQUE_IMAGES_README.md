# AssurIntellec™ — Seven service videos and single-use CMS images

**Updated:** 25 October 2026 (video control behavior refreshed)  
**Deployment:** Upload all files of `AssurIntellec-main` to the same website/Git repository root; preserve the `content/`, `images/`, `videos/`, `assets/` and `admin/` directories.

## What changed

1. All seven individual service detail pages use their own **MP4 video** in the large 16:9 opening visual, with muted automatic playback, continuous looping, and a service-specific poster frame. Only a mute/unmute button is shown; native playback controls are hidden.
2. Each intro video is a **different excerpt of the existing 60-second video shipped in the uploaded website**. These are not newly filmed, independently produced service-specific advertisements. They illustrate the service categories using footage already available, and can be replaced separately through Decap Turbo.
3. The original 7 distinct service cover photographs remain available as alternate main images. New **single-use media files** supply each service's video poster, individual capability visuals, audience image, and optional specialised/additional-area visuals. Across service configuration entries, **111 image references resolve to 111 different binary files**. Some frames show similar environments because they are extracted from the *same existing promo footage*. Replace these with relevant independent photos when available.
4. An actual image is never repeated by the new service page renderer: if a CMS editor assigns the same image path twice within one page or across two services, the later occurrence is replaced by a branded text visual instead of a duplicate image.
5. **Specialised Focus** and **Additional Information** optional image fields now display their chosen images on published service pages. Previously those fields were in Decap Turbo but ignored by the new premium renderer.
6. Kept existing single-column details, paragraphs, bullet lists, contact sections, homepage service links, backend (`turbo-github`) ID and unrelated content.

## Change every video and photograph in Decap Turbo

Navigate to `https://www.assurintellec.in/admin/` → **Services** → **All 7 Services** → **Service List** → choose service.

| Visual on site | Editable CMS field |
| --- | --- |
| Full-width main video | **Hero Media Type (16:9) — VIDEO by default** + **Main Service Video — upload your own MP4 (16:9)** |
| Loading poster / still-photo fallback | **Video Poster / Hero Fallback Image (16:9)** |
| Each individual core capability image | **Core Services → each entry → Section Visual — unique photograph (single use)** |
| Who We Support picture | **Who We Support Visual** |
| Each specialised category photo | **Specialised Focus / Product Categories → entry → Optional Image** |
| Each Additional Information photo | **Additional Information → entry → Optional Image** |
| Additional legacy visual fallback | **Alternate Main Image / Video Fallback (16:9)** (not shown in the premium video hero if video is available) |

Upload new photos using the Decap media library (normally saved in `/images/uploads/`) and new MP4s in `/videos/`. Upload a genuinely different file for each visible placement. For a service's main video, update **Hero Video**, not just the old **Primary Service Video** field. Do not reuse images from a different section or another service. A duplicated path is intentionally rendered as branded fallback artwork.

## Production notes

- Original 60-second hero video and unrelated website assets are preserved.
- The supplied seven service videos are H.264 MP4, 1280×720. Six have no audio track; the GMP Engineering file does contain AAC audio. The visible sound button can mute/unmute but silent videos remain silent. Browser autoplay and media playback policies can override autoplay; hiding controls is not digital download protection.
- Do not upload videos or images with unclear copyright, false regulatory claims, patient information, trade secrets or unauthorised employee likenesses.
- Check live Decap Turbo authorization / publishing and Git permissions in your account; the ZIP cannot verify those cloud credentials.
- See `SERVICE_MEDIA_UNIQUENESS_AUDIT.json` for service-by-service image/video assignments.
