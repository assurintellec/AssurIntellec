# AssurIntellec™ — Service Opening Video Playback Fix (26 October 2026)

## What was fixed

Earlier service pages started a video in their HTML and then **removed and recreated the video element** when `content/services.json` finished loading. This restarted playback; updating the HTML alone was also silently overwritten by the CMS values. The video player now **stays mounted continuously** as the service data and text load. There are no duplicate introductory video players, and every service page begins with its video above the text, in 16:9.

- All 7 service detail pages start their videos automatically **muted**, loop inline, and expose a sound-on/sound-off button.
- If browser autoplay is blocked, visitors see a Play button. If a file is missing or unplayable, visitors see an actionable message and Retry button rather than a dead black box.
- The CMS can update the first video path without destroying the player element. Manual overrides can deliberately take precedence.
- The first video's poster and all other images/16:9 layouts remain in place; image/video hover zoom stays disabled while text animations remain.
- The 60-second GMP Engineering source HEVC file remains preserved. The default playback video is a **new H.264/AAC, fast-start MP4** at the source 1280×720 resolution, about 14.2 MB instead of the prior 25.8 MB H.264 file. Both prior videos are retained.
- Existing homepage hero behavior and file remain unchanged.

## Decap Turbo — change the FIRST video

1. Open `/admin/`, then **Services → All 7 Services → Service List** and select one service.
2. Find **OPENING VIDEO (FIRST ON SERVICE PAGE) — Auto-play H.264 MP4** (technical field: `hero_video`). This is **not** the Secondary/Legacy Service Video or the homepage Service Image.
3. Upload/select the video. Use `.mp4` with **H.264/AVC video and AAC audio**, in a 16:9 ratio. 1920×1080 or 3840×2160 is fine if your device/host supports it. Decap does not transcode your video automatically.
4. **Save/Publish** changes. Confirm both `content/services.json` and the new file in `/videos/` are actually published to the same live version of the website.
5. Reload the service page (Ctrl+Shift+R) to bypass previously cached scripts. It starts **muted** due to browser autoplay rules; click the sound button for audio.

## Manual method A — recommended (same source as Decap)

1. Copy your compatible video file to `videos/YOUR-FILE.mp4`.
2. Edit `content/services.json`. Under the relevant service slug change the exact JSON property:

   `"hero_video": "/videos/YOUR-FILE.mp4"`

3. Also update the matching `service-<slug>.html` opening `<video src="/videos/...">` URL if you want the new video to start **before** services.json finishes loading. Leave `data-manual-video="false"` so subsequent Decap updates continue to work.
4. Deploy **both** the file and the edits. Paths and filenames are case-sensitive on hosting systems.

## Manual method B — HTML-only override

If you specifically need to override the CMS rather than change JSON:

1. Copy the video file to `/videos/`.
2. Find the opening `<video>` tag in that service's `service-<slug>.html`.
3. Change its `src` to your file, and set `data-manual-video="true"`.
4. Publish the changed HTML and video. This makes the HTML URL win **even when Decap specifies a different hero_video**. To allow CMS control again, switch it back to `false`.

## Compatibility checklist

- Recommended: MP4/H.264 video, AAC audio, `yuv420p` pixel format, with the MP4 `moov` index placed at the start (`-movflags +faststart`).
- Supported extensions depend on each visitor's browser; HEVC/H.265, AVI, MKV, MOV etc. cannot all be made to play merely through HTML/CMS configuration.
- If a video is not appearing after upload, check the `/videos/<filename>` direct URL and that it returns **HTTP 200** with a real video, not an HTML error page, and that the host is not blocking the file size/range requests.
- Do not preview the extracted files using `file://`; test using a web server, preview deployment, or your real website.
- Original file pixel dimensions are never silently reduced by the CMS. Playback speed depends on encoding, file size, device and network.

## Validation completed on this ZIP

- All 7 services: JavaScript syntax, DOM construction, same persistent video node, opening video first, sound control and error feedback, correct original service text.
- Browser DOM tests for CMS source replacement and manual HTML override.
- All 7 current opening video files exist and are H.264 at 1280×720. GMP has newly encoded fast-start media.
- YAML config parsed and JSON validated.

**Note:** These tests validate the package locally. The hosting platform and Decap Turbo's live publishing permissions cannot be confirmed without a deployment to your live account.
