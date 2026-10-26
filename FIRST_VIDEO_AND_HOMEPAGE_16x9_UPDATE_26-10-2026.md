# Revised first-video and 16:9 homepage service images (26 October 2026)

## Which Decap Turbo field is the FIRST video?
1. Go to Admin / Decap Turbo > Services > All 7 Services > Service List > choose the service.
2. Find **FIRST VIDEO ON SERVICE PAGE — Upload Opening Video (16:9)** (`hero_video`). This is the video at the top of the individual service page.
3. **HOMEPAGE SERVICE IMAGE (16:9) — unique picture with service text** (`listing_image`) controls the separate 16:9 card on the homepage and Services listing.
4. **Secondary / Legacy Service Video (NOT the first video)** (`primary_video`) is not the page-opening video.
5. Publish changes. Verify playback after deployment. Prefer MP4/H.264 for broad browser compatibility.

## Default video sources (one opening video per service)
- GMP Engineering & Compliance: `/videos/gmp-engineering-intro-browser-compatible.mp4`
- Advisory & Transactions: `/videos/advisory-transactions-intro.mp4`
- Talent & Recruitment: `/videos/talent-recruitment-intro.mp4`
- Life Sciences Trade: `/videos/life-sciences-trade-intro.mp4`
- Pharma & Laboratory Technologies: `/videos/pharma-laboratory-technologies-intro.mp4`
- Research & Scientific Services: `/videos/research-scientific-services-intro.mp4`
- Pharma Solutions & Manufacturing: `/videos/pharma-solutions-manufacturing-intro.mp4`

The 60-second GMP Engineering original HEVC file `/videos/gmp-engineering-intro.mp4` is still included unchanged, and `primary_video` still references it. Its default opening playback copy is an H.264 rendition of the same 1280x720 video.

## Homepage/Services listing images
All seven default listing images are saved as lossless 16:9 presentation PNGs without cropping or downsampling the foreground source. The original assets remain untouched. Because some source images are very wide, a softly blurred background fills extra space instead of cropping their contents. Frames also use `object-fit:contain` and do not hover-zoom.

## Upload quality
Decap media processing is disabled. Standard JPG/PNG/WebP etc and optional other-format file fields are available. Browser support and hosting/Turbo/GitHub/CDN size limits still apply. Converting a source cannot create detail beyond its original resolution.

## Immediate video first
Every individual service HTML file embeds its opening video at the first position inside `<main>` even before service data loads. The fully rendered service page uses the same opening video, with title/description below it.

## New lossless presentation images
- `Service_1_16x9_full_clarity.png`: original (1672, 941), presentation canvas (1680, 945), 1.72 MiB
- `Service_2_16x9_full_clarity.png`: original (1915, 821), presentation canvas (1920, 1080), 2.03 MiB
- `Service_3_16x9_full_clarity.png`: original (1916, 821), presentation canvas (1920, 1080), 1.84 MiB
- `Service_4_16x9_full_clarity.png`: original (1915, 821), presentation canvas (1920, 1080), 1.99 MiB
- `Service_5_16x9_full_clarity.png`: original (1915, 821), presentation canvas (1920, 1080), 2.0 MiB
- `Service_6_16x9_full_clarity.png`: original (1672, 941), presentation canvas (1680, 945), 1.72 MiB
- `Service_7_16x9_full_clarity.png`: original (1916, 821), presentation canvas (1920, 1080), 1.98 MiB
