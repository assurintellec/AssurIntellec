# Decap CMS: Images, Videos, Click Actions and Text Styling

This guide documents the CMS enhancements in the 15 October 2026 website package. These are source-code changes; they take effect on the live website only after the updated project is committed and deployed through the existing repository/build.

## Where to edit

- **Why Us page:** open Decap CMS → **Site Settings → Complete Website Settings → Why Us Page Content**. Four saved points are provided. Turn a point on/off with **Enable this Why Us point**. Edit its short summary and detail title, select Image or Video, replace its poster/image or upload a video, and add/remove any number of detail subsections. Each subsection supports a heading, optional text and a list of bullets. One selected point is displayed in the full-width detail area at a time.
- **Services:** open Decap CMS → **Service Content** and edit one service record. Each service has its own **Main Service Image / Video Poster**, **Main Media Type**, optional **Main Service Video**, alt text, caption and supporting text. The feature media area is 16:9. Leave **Main Service Video** empty and choose Image to show the image; choose Video and upload a supported video to show the video with the image as its poster.
- **Whole-website click behavior:** each media entry that exposes click settings has an enable toggle, destination URL and new-tab preference. A blank URL or disabled toggle leaves the asset non-clickable. Existing buttons, links and video playback controls are preserved. When a video has a configured click destination, a separate “Open link” chip appears over the video so the player controls remain usable. Service cards may also use a custom URL; a blank URL opens that service's detail page.
- **Individual text styling:** open **Site Settings → Complete Website Settings → Individual Text Styling (Whole Website)**. Add a rule per element/group, set **Target CSS selector**, then fill whichever properties are needed: color, font size, font family, weight, style, alignment, line height and letter spacing. Turn a rule off instead of deleting it to retain its settings. For exact text elements, use an existing element ID such as `#heroHeading`, `#heroDescription` or `#whyDetailTitle`. For dynamic Why Us titles/sections, use a selector such as `[data-text-style="why-detail-title-technical-focus"]`, substituting the point slug and target key shown by the renderer. To affect a group, use an ordinary selector such as `.why-card h3`.

## Images and videos

- Use descriptive names when uploading, for example `gmp-engineering-compliance.jpg` or `why-us-technical-focus.png`. Decap updates the saved asset reference when a different filename is uploaded; keeping the existing filename is also suitable when replacing a file directly in GitHub.
- The seven Service Content records use seven separate descriptive image files. Do not assign the same main image to multiple services unless that reuse is intentional.
- The common web image formats supported by the browser can be used through the Decap image widget. The CMS schema labels the expected formats (JPEG/JPG, PNG, WebP and other browser formats); for the most predictable compatibility, use JPG/JPEG, PNG or WebP. Use MP4, WebM or Ogg for service/Why Us videos when supported by the browser.
- Service and Why Us media use a 16:9 display ratio. The website preserves the uploaded original; it does not require you to crop the source file to 16:9. It crops to fill the presentation area with `object-fit: cover`, so important content should stay near the center.
- Add meaningful alt text for images. Do not upload private, unlicensed or unauthorized media. Keep uploaded videos reasonably optimized for mobile playback.

## Important notes

- **Individual Text Styling** is a rule-based editor because Decap CMS does not create a separate graphical font panel for every text node. Add a separate rule for each exact element you want to control. The CMS will apply enabled rules after loading the saved content.
- Custom click destinations accept safe web, mail, phone and relative links. Unsafe script/data URL schemes are rejected by the frontend.
- These edits do not change the Google Apps Script enquiry backend, mail Worker secrets, DNS, domain or live CMS credentials. The ZIP alone does not publish changes.
- Check every important page at desktop and mobile widths after deployment. Video playback and CMS authentication require a live browser test.
