# AssurIntellec™ — Single-Column Service Readability Update

**Updated:** 24 October 2026

## Changes across all seven individual service pages

- **One full-width content column** for core services, specialist areas, process steps, deliverables, target audiences, benefits, important notes and contact sections (desktop, tablet and mobile).
- Detailed service areas remain presented in vertical order. Each area includes a full-width photograph, clear heading, short description and 2 visible bullet-point highlights, followed by an **expandable full scope** with more bullet points, paragraphs, expected outcome and important qualifications.
- Each page's first detailed service area opens by default to demonstrate the expandable formatting.
- Lists use real semantic `<ul>` / `<li>` markup. Text fields entered in Decap Turbo with separated paragraphs stay separated; Markdown-style `- item`, `* item`, `• item`, `✓ item`, and numbered lines are formatted as readable lists.
- Increased line spacing, clean borders and padding; all detailed text stays dark on light backgrounds.
- Repaired a data import problem that had repeated the entire source document inside the introduction for Pharma & Laboratory Technologies, Research & Scientific Services, and Pharma Solutions & Manufacturing. The original detailed content remains in the separate core services, process, deliverables and related sections.
- Corrected shifted headings and descriptions in Advisory & Transactions' `Pharmaceutical Opportunities We Support` list.

## Editing formatting in Decap Turbo

Open **Admin → Services → selected service**. Edit the **Introduction** in short paragraphs with an empty line between them. For each item under **Core Capabilities**, fill in **Opening Statement**, **Detailed Overview**, and **Support Activities** separately. Add one short support activity per list item. Do not paste all sections together into a single paragraph.

For optional multiline explanation fields, you can enter bullets like:

    Important technical considerations:

    - Facility layout and personnel flow
    - Cleanroom/HVAC requirements
    - Utilities and equipment interfaces

Leave an empty line before the bullet list. The site displays those lines as a properly indented bulleted list.

For the main set of service bullet points, use Decap's **Support Activities** list editor rather than typing manual bullets into an overview.

## Notes

- This package is a static website upload. Live publishing, CMS access and media upload permissions require a working Decap Turbo/GitHub configuration.
- Images and video were preserved from the provided website package. Review image licenses and replace placeholders as needed.
- Checks performed: services JSON integrity, JavaScript syntax, Decap YAML parsing, all seven content structures and all one-column selectors. A full production deployment/browser compatibility review remains advisable.
