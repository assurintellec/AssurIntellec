# AssurIntellec™ — Service video controls update (25 October 2026)

## Requested adjustment

On **all seven service detail pages**, the hero video now starts muted, autoplays inline when browser policy permits, and repeats with `loop`. Standard browser controls (play/pause, seek, fullscreen, download menu, speed, picture-in-picture) are not displayed. A single visible button in the bottom-right corner lets the visitor mute or unmute sound. Tapping the video itself does not pause playback.

The change is implemented once in `assets/site.js` (`serviceVideoMarkup`, `setupServiceVideoPlayers`) with the associated style in `assets/service-editorial.css` (and a matching legacy-detail fallback in `assets/site.css`). No service descriptions, layouts, existing images, Decap CMS configuration, or video files were replaced.

## Service CMS editing

Continue to edit the service video in Decap Turbo under **Services → All 7 Services → Service List → [Service] → Main Service Video (Hero Video)** and its optional poster/fallback image. Replacing the MP4 with one containing an audio track enables the unmute control to produce sound.

**Important:** Six of the seven supplied service MP4 files have **no audio track**. Only `videos/gmp-engineering-intro.mp4` contains audio. On a silent file the audio toggle changes the mute state but cannot produce sound. Hiding the browser download interface cannot prevent somebody from retrieving publicly hosted video URLs. Browser data-saver and autoplay policies can still override automatic playback.

To deploy, replace the corresponding files in your Git repository with files from this ZIP. The original Decap Turbo setup is retained.
