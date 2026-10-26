# Service images, videos and hover — update on 26 October 2026

Updated the **user-supplied** AssurIntellec_26-10-26(1).zip; original videos and media files were not edited.

1. Homepage and Services tab: each of the seven service cards displays its **own 16:9 original image**, plus title and description. Edit `Services > All 7 Services > Service List > Services Listing Image` (or the optional original-file field).
2. Each individual service still begins with its **existing autoplay, looping, muted video**. The sound toggle is unchanged. Existing `hero_media_type=video` and `hero_video` URLs are unchanged. The file uploader accepts video files; HTML5 video playback recognizes MP4, WebM, Ogg and additional formats if the browser supports them.
3. All service images (hero poster, capabilities, specialised focus, supporting/audience, additional details and listing images) display in a responsive **16:9 frame without cropping** (`object-fit: contain`). They use the original uploaded asset path and retain the original pixel dimensions, which may be much larger than the on-screen viewport. To fill the entire frame without letterboxing, upload images already composed in 16:9 (such as 960×540, 1920×1080 or 3840×2160).
4. `media_processing.enabled=false` in `admin/config.yml` prevents Decap browser-side resizing, recompression, reformatting or automatic cropping. It does not remove any upstream GitHub/Turbo/CDN storage limits.
5. Decap's normal **image picker** accepts JPG, JPEG, PNG, WebP, GIF, BMP, TIFF and SVG. Each service image field also has an optional **Original File Upload** field (using the `file` widget) for additional extensions. When supplied, this original-file value takes priority. Web browsers do **not** render every conceivable image or video extension; JPG/PNG/WebP for images and MP4/H.264 for videos give best cross-browser compatibility.
6. Pointer hover no longer zooms images/videos in the service cards or seven service detail pages. Text hover zoom, if enabled in Site Settings > Animation & Motion, remains unchanged.
7. Existing bundled videos and all uploaded image binaries are byte-for-byte unchanged. Only site code, 7 service listing image field values, Decap configuration and documentation are modified.

## Update website
Deploy the ZIP contents as the website repo root, not as an extra nested `AssurIntellec-main` folder. Confirm CMS access and test uploads using your Turbo/GitHub backend. Large 4K+ assets may fail if backend-specific per-file, repository or hosting limits are exceeded. Preview video MP4 first, then test other formats on browsers you support.
