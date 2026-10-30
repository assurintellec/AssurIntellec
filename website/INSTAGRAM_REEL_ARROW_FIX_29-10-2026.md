# Instagram Reel navigation fix

The Previous/Next arrow handlers existed but were not attached when the viewer first rendered. The viewer now attaches them during initialization, with a guard to prevent duplicate handlers when switching reels.

Both arrows cycle through the enabled, non-empty Reel links saved under **Decap → Site Settings → Complete Website Settings → Instagram Reels (up to 10)**. The last Reel wraps to the first, and Previous on the first wraps to the last. Save and Publish after editing links. With one valid enabled link, both arrows are disabled.

Your four existing Reel links, viewer position and dimensions, content, CMS settings, enquiry integration, visitor-counter update, and animation enhancements are retained. The homepage script version was refreshed so browsers fetch the corrected code.
