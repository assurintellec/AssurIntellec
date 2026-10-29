# Instagram Reel audio update

The viewer now loads Instagram's native Reel iframe with `allow="autoplay; fullscreen; picture-in-picture; encrypted-media"` set before navigation. The previous embed.js-generated iframe on the live website had no `allow` attribute. The native Play control remains accessible, and switching Reels replaces the old iframe so only the selected Reel remains loaded.

Tap **Play inside the Reel** to start it with sound. Browsers and Instagram may require a visitor's tap before allowing audio. The website cannot force an Instagram player to unmute across origins or override browser/device sound settings. It does not display a false “Sound On” toggle or use unsupported Instagram player commands.

A short hint and an **Open on Instagram** link appear below the existing frame. The link follows the currently selected Reel and remains usable if the embedded player is restricted. Both labels can be edited in **Decap → Site Settings → Complete Website Settings → Homepage → Homepage Instagram Viewer**. All previous CMS controls remain available. Reel URLs are still managed in the existing Instagram Reels list.

The frame's position, width and height remain controlled by your existing layout settings. The hint does not cover the player. Text content, saved Reel URLs, photos/videos, enquiry integrations, and previous counter/animation updates are retained.

## Applying the small update ZIP

Copy the included files over the corresponding files in your existing website project, then deploy. Retain all files and media not included in the update. The patch intentionally omits `content/site.json`, `content/services.json`, and media folders so your current published CMS content and media are not replaced. The `admin/config.yml` change adds only the two optional Instagram help labels.

The full website ZIP is also updated, but its content JSON is the same as the previously supplied ZIP. If you have since edited content through Decap, use the small update ZIP to preserve those newer edits.

## Verification and limits

Navigation tests verify all saved links, both arrow directions, wraparound, empty/disabled slots, and repeated renders. Audio-markup tests check the iframe's permissions, native controls, current-Reel link, and absence of a forced-mute flag. A live Instagram player was observed playing with `muted=false` after a Play tap. Actual audible output on the user's device and the new website deployment still require checking after upload. If a Reel's source audio is absent or restricted by Instagram, website code cannot restore that audio.

References: [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay) and [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
