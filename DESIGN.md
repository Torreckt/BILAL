---
name: Mainstream
description: Riyadh marketing agency site, Arabic RTL first. A spy dossier on dark beige stock, set in the brand's own red, ink and ribbons.
colors:
  mainstream-red: "#a3121f"
  bright-red: "#e0303b"
  dark-beige: "#b3a081"
  beige-deep: "#a8946f"
  ink-black: "#111111"
  ink-soft: "#2a2622"
  off-white: "#f2ede4"
  white: "#ffffff"
  ghost-paper: "rgba(242, 237, 228, 0.3)"
typography:
  display:
    fontFamily: "Rakkas, serif"
    fontSize: "clamp(2.75rem, 7.2vw, 6rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "0"
  headline:
    fontFamily: "Rakkas, serif"
    fontSize: "clamp(2.25rem, 4.6vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "0"
  title:
    fontFamily: "Rakkas, serif"
    fontSize: "clamp(2rem, 3.4vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.15
  subhead:
    fontFamily: "Tajawal, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.3
  ghost:
    fontFamily: "Gloock, serif"
    fontSize: "clamp(6rem, 15vw, 15rem)"
    fontWeight: 400
    lineHeight: 0.8
  numeral:
    fontFamily: "Gloock, serif"
    fontSize: "clamp(3rem, 5vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1
  lede:
    fontFamily: "Tajawal, sans-serif"
    fontSize: "clamp(1.0625rem, 1.3vw, 1.25rem)"
    fontWeight: 500
    lineHeight: 1.75
  body:
    fontFamily: "Tajawal, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.8
  button:
    fontFamily: "Tajawal, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 800
    lineHeight: 1
  ribbon:
    fontFamily: "Tajawal, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1
  label:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.2em"
rounded:
  none: "0"
spacing:
  gutter: "clamp(16px, 4vw, 56px)"
  container: "1320px"
  section: "clamp(88px, 12vw, 168px)"
  sheet: "clamp(28px, 4vw, 56px)"
  card: "24px"
components:
  ribbon-button-red:
    backgroundColor: "{colors.mainstream-red}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0.95em 1.4em 0.9em"
  ribbon-button-ink:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.off-white}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0.95em 1.4em 0.9em"
  ribbon-button-paper:
    backgroundColor: "{colors.off-white}"
    textColor: "{colors.ink-black}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0.95em 1.4em 0.9em"
  ribbon-tag-red:
    backgroundColor: "{colors.mainstream-red}"
    textColor: "{colors.white}"
    typography: "{typography.ribbon}"
    padding: "0.6em 1em 0.55em"
  ribbon-tag-ink:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.off-white}"
    typography: "{typography.ribbon}"
    padding: "0.6em 1em 0.55em"
  case-sheet:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    padding: "{spacing.sheet}"
  case-tab:
    backgroundColor: "{colors.beige-deep}"
    textColor: "{colors.ink-black}"
    padding: "10px 16px 12px"
  case-tab-selected:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-black}"
  paper-card:
    backgroundColor: "{colors.off-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    padding: "{spacing.card}"
  ink-panel:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.off-white}"
    padding: "{spacing.sheet}"
  nav:
    backgroundColor: "{colors.dark-beige}"
    textColor: "{colors.ink-black}"
    height: "76px"
---

# Design System: Mainstream

## Overview

**Creative North Star: "The Case File"**

The agency that watches, rendered as a dossier the eye opens on your business. The ground is dark beige file stock; on it sit ink-black frames, white case sheets with a hard black offset shadow, red and black ribbons tilted a few degrees, rubber-stamp verdicts, halftone dots, and huge pale ghost words in Gloock behind everything. Every element in this vocabulary comes from the binding Mainstream brand guidelines; the dossier is how they were put to work, not a layer on top of them.

Density is poster-like rather than app-like: few, large, confident pieces per section, each one an object (sheet, ledger, stamp, ribbon) that sits slightly off square as if dropped on a desk. Arabic is the primary reading direction (RTL); Latin appears as a second, tracked voice for file codes, places and taglines. Colour is committed: beige and ink carry most surfaces, while Mainstream Red takes over entire sections at the moments that sell (the one-salary argument, the finale).

**Key Characteristics:**
- Dark beige (#b3a081) ground, never white page.
- Square-cornered objects with hard, unblurred offset shadows.
- Ribbons and stamps tilted 2 to 8 degrees; panels tilted under 2 degrees.
- Rakkas Arabic display in red; Gloock for ghost words, numerals and the wordmark.
- Halftone ink dots on red and on paper as the only texture.
- The eye-and-wave mark appears as a recurring object, always in its fixed colours.

## Colors

The brand's six colours plus two derived working shades; beige and ink are the stock, red is the verdict.

### Primary
- **Mainstream Red** (mainstream-red): Arabic display headlines on light grounds, primary ribbon buttons, ribbons, stamps, list markers, link underlines, and full-bleed section drenches (the salary section and the finale). Also the eye's iris and wave.

### Tertiary
- **Bright Red** (bright-red): the live signal only. The reticle that sweeps the surveillance wall, the waves in the ink ticker, and hover/accent on black (footer wordmark, footer links). It is the colour of something happening, not a second brand red for surfaces.

### Neutral
- **Dark Beige** (dark-beige): the page ground and the sticky nav. Also the browser theme colour.
- **Deep Beige** (beige-deep): unselected case-file tabs and the scrollbar track; the one step darker than the ground used to show "behind".
- **Ink Black** (ink-black): text, 2px object borders, every offset shadow, the surveillance wall frame, the ticker, ink panels and the footer.
- **Soft Ink** (ink-soft): secondary body copy (ledes, step descriptions) on light grounds.
- **Off-White** (off-white): paper: ledgers, process cards, placeholder slots, halftone frame stock, and all text on ink or red.
- **White** (white): the case sheet and dossier (the two "documents"), text on red ribbons and buttons.
- **Ghost Paper** (ghost-paper): ghost words on the beige ground. On red the ghost drops to about 7% off-white; inside a white sheet it becomes beige at about 16%.

### Named Rules
**The Stock And Verdict Rule.** Beige and ink are the stock every section is built from; red is either a verdict (button, ribbon, stamp, headline) or a full-section drench. Red never becomes a tint or a gradient.

**The Display-Only Red Rule.** Red text on the beige ground measures about 3.1:1, so red type on beige is display size only (headlines, numerals, wordmark). Body-size emphasis on beige uses ink weight, not red.

**The Fixed Eye Rule.** The eye is always white with a red iris and black pupil, and its wave is red; only its outline switches between ink (light grounds) and off-white (black grounds). Never recolour, stretch, tilt or shadow the logo lockup, keep at least one eye-width of clear space, and place the logo only on dark beige, black or white.

## Typography

**Display Font:** Rakkas (with serif fallback), Arabic headlines
**Latin Display Font:** Gloock (with serif fallback), ghost words, numerals, the wordmark
**Body Font:** Tajawal 400/500/700/800 (with sans-serif fallback)
**Label Font:** Space Grotesk 700, tracked Latin labels

**Character:** A loud, hand-cut Arabic display face over a clean, sturdy Arabic grotesque, with a sharp Latin serif reserved for giant background words and a tracked grotesk for file stamps. The Arabic does the talking; the Latin is the file around it.

### Hierarchy
- **Display** (Rakkas 400, clamp(2.75rem, 7.2vw, 6rem), 1.12): the hero headline and the finale line. Red on beige, off-white on red. Balanced wrapping, about 14 to 16ch.
- **Headline** (Rakkas 400, clamp(2.25rem, 4.6vw, 4rem), 1.12): section headlines.
- **Title** (Rakkas 400, clamp(2rem, 3.4vw, 3rem), 1.15): document titles inside sheets and panels; the package dossier pushes to clamp(2.5rem, 5vw, 4.25rem).
- **Subhead** (Tajawal 800, 1.25 to 1.5rem, 1.3): card and block headings (process steps, dossier blocks).
- **Lede** (Tajawal 500, clamp(1.0625rem, 1.3vw, 1.25rem), 1.75): the paragraph under a headline, 34 to 44ch.
- **Body** (Tajawal 400, 1.0625rem, 1.8): running copy; list items step to 500 weight.
- **Button / Ribbon** (Tajawal 800, about 1rem, 1): all Arabic on ribbons, buttons and stamps.
- **Label** (Space Grotesk 700, 0.6875 to 0.8125rem, 0.14 to 0.24em tracking, uppercase Latin): file codes, camera numbers, place lines, the ticker's Latin taglines.
- **Ghost** (Gloock 400, clamp from 6rem up to 28rem, 0.8): one huge Latin word per section, behind content.
- **Numeral** (Gloock 400, clamp(3rem, 5vw, 4.5rem), 1): step numbers in red and the equals sign of the salary comparison.

### Named Rules
**The Arabic Leads Rule.** Rakkas carries every headline at weight 400 with zero letter-spacing; Latin never takes a headline role. Arabic text on a tag drops the tracking and switches to Tajawal 800.

**The Tracked Latin Rule.** Space Grotesk appears only as tracked uppercase Latin metadata on objects (file headers, camera codes, slot tabs, place and copyright lines, ticker taglines). It is never a heading or a label stacked above a section headline.

## Layout

A single centred container (1320px plus gutters of clamp(16px, 4vw, 56px)) holds asymmetric two-column grids: 6fr/5fr in the hero, 5fr/7fr for services and the salary argument, with the copy column sticky beside the services case file on wide screens. Sections breathe on clamp(88px, 12vw, 168px) of vertical padding, tightened per section (services, packages, watchlist, process) where the next object should arrive sooner. Drenched sections (salary, finale) and the ink ticker run full bleed; the ticker is rotated -1deg and overhangs the viewport edge.

Responsive behaviour collapses grids to a single column at 1100px (hero, dossier blocks to two columns), 960px (services, salary), 760px (dossier, team panel, process, watchlist) and 560px (case-file tabs become a two-column grid, ledger comparison stacks). The nav drops its link list at 860px and its place label at 1080px; at 520px the bar shrinks from 76px to 64px. Hero order on mobile is headline, lede, CTA, then the surveillance wall.

## Elevation & Depth

Depth is printed, not lit. Objects lift off the stock with hard offset shadows that have zero blur, cast down and to the right in ink black (or in red when the object itself is black). Pressing a button pushes it into its shadow. Ghost words and halftone fields sit behind content as the far plane.

### Shadow Vocabulary
- **Object** (`box-shadow: 6px 6px 0 #111111`): stamps, ledgers, price tag, process cards.
- **Document** (`box-shadow: 12px 12px 0 #111111`): the case sheet and the package dossier.
- **Button** (`box-shadow: 5px 5px 0 #111111`, 3px on hover, 0 on press): ribbon buttons.
- **Red offset on ink** (`box-shadow: 5px 5px 0 #a3121f` for ink buttons; 6px for the gift card, 12px for the team panel, 4px for the hero caption strip): black objects cast red.
- **Nav rule** (`box-shadow: 0 2px 0 #111111`): appears under the sticky nav once the page scrolls.

### Named Rules
**The No-Blur Rule.** Every shadow is a solid offset with 0 blur. Shadows are never on the logo.

**The Press-In Rule.** Interactive objects respond by translating toward their shadow and shrinking it (5px to 3px on hover, to 0 on press), never by glowing or lifting.

## Shapes

Everything is square-cornered (0 radius): buttons, ribbons, sheets, cards, tabs, stamps. Borders are 2px ink on documents and cards, 3px red on rubber stamps with a 1px red outline offset 3px for the double-rule look. Circles exist only as the world's own dots: halftone grids (ink dots at 11px to 18px pitch), round bullets in the dossier, and the eye's iris.

Tilt is the form signature. Ribbons sit at 2 to 4 degrees, rubber stamps at 4 to 8 degrees, and large panels (the wall, ledgers, slots, the team panel) at 0.6 to 2 degrees. Tilt is removed from the team panel under 760px so wide objects do not clip.

## Components

### Buttons
Ribbon buttons: a strip of colour tilted -2deg with a hard shadow, always a WhatsApp link.
- **Shape:** square (0), WhatsApp glyph as inline SVG at 1.25em before the label.
- **Primary (red):** Mainstream Red with white Tajawal 800, padding 0.95em 1.4em 0.9em; large size grows the type to clamp(1.125rem, 1.5vw, 1.3125rem).
- **Ink:** ink with off-white text and a red offset shadow; used in the nav and inside light documents.
- **Paper:** off-white with ink text; used on red grounds.
- **Hover / Press:** on fine pointers, translate 2px into the shadow (shadow 3px); on press translate 5px and scale 0.98 (shadow 0), 160ms ease-out.
- **Text link:** bold ink with a 2px red underline offset 6px; underline turns ink on hover.

### Ribbons (tags)
- **Style:** inline strips at -2deg, red with white, ink with off-white, or paper with ink. Arabic in Tajawal 800 at 1rem; Latin in tracked Space Grotesk.
- **Use:** a claim or tagline beside or after a headline ("WATCH US", "براتب موظف واحد."), or a run of ribbons inside a document head.

### Stamps
- **Hero stamp:** solid red block, white Tajawal 800, inner 3px white outline inset 10px, object shadow, -4deg; lands from 1.7x scale with a 340ms stamp ease and a small thud of the wall beneath it.
- **Rubber stamp:** transparent, red text, 3px red border plus 1px red outline offset 3px, -6 to -8deg; marks status on documents ("ضمن الفريق", "يُضاف قريباً", "WATCH US.").

### Cards / Containers
- **Corner Style:** square (0).
- **Documents:** white case sheet and dossier, 2px ink border, document shadow, padding clamp(24px to 28px, 4vw, 56px).
- **Paper cards:** off-white process steps, ledgers and slots, 2px ink border, object shadow (slots have none), padding 16 to 24px.
- **Ink panels:** black team panel and gift card with red offset shadows and off-white text.
- **Internal structure:** 2px ink rules under heads and above feet; 1px ink at 18 to 20% between list rows and columns.

### Navigation
- **Style:** sticky dark-beige bar, 76px tall (64px under 520px). Brand lockup at the reading start: the eye, the Gloock wordmark "Mainstream" in red, and a small red "WATCH US" ribbon.
- **Links:** Tajawal 700 at 1rem; a 2px red underline wipes in on hover.
- **Trailing:** tracked "RIYADH · KSA" label and an ink ribbon button. A 2px ink rule appears beneath once scrolled. Links hide under 860px; the CTA stays.

### Case Files (signature)
Tabbed service files: beige-deep folder tabs with a 2px ink border and no bottom edge sit 6px low and rise to white when selected, joining the white sheet below. The sheet opens with a top-down clip reveal (260ms). Inside: a tracked Latin file header over a 2px rule, a Rakkas title, a two-column list with small tilted red square markers, a ghost file code, and a rubber stamp. Under 560px tabs become a two-column grid with ink fill for the selected tab.

### Surveillance Wall (signature)
An ink frame tilted -1.2deg holding a 3x3 grid of off-white halftone frames, each with the eye, a camera code and an ink role label (tilted -2deg, dashed off-white inner outline). A bright-red corner reticle sweeps frame to frame while labels type in, then the hero stamp lands. The active frame's label turns red and its eye scales to 1.08.

### Stream Ticker
A full-bleed ink band at -1deg scrolling the taglines in Arabic and tracked Latin, separated by bright-red waves, 38s linear loop. Decorative (aria-hidden).

### Motion
Entrance and state motion use three curves: ease-out cubic-bezier(0.23, 1, 0.32, 1) for most transitions (160 to 260ms; headline rise 700ms), ease-in-out cubic-bezier(0.77, 0, 0.175, 1) for the reticle travel, and a stamp ease cubic-bezier(0.16, 1, 0.3, 1). Motion runs only when a pre-paint check confirms reduced motion is not requested; otherwise everything renders in its final state.

## Do's and Don'ts

### Do:
- **Do** build every page on the dark beige ground with ink type, and spend red on verdicts or a full-section drench.
- **Do** cast every shadow as a solid offset with 0 blur: 6px for objects, 12px for documents, 5px for buttons; black objects cast red.
- **Do** tilt ribbons 2 to 4 degrees and stamps 4 to 8 degrees; keep large panels under 2 degrees.
- **Do** set Arabic headlines in Rakkas 400 and keep Latin to Gloock ghosts/numerals and tracked Space Grotesk metadata.
- **Do** put one giant Gloock ghost word behind a section at low opacity, aria-hidden.
- **Do** keep the eye in its fixed colours and the logo on dark beige, black or white with one eye-width of clear space.
- **Do** route every call to action through a ribbon button that opens WhatsApp.
- **Do** show placeholders as labelled, stamped slots when client proof is not yet available.

### Don't:
- **Don't** round corners on buttons, ribbons, cards or documents.
- **Don't** blur a shadow, add a glow, or put any shadow on the logo.
- **Don't** recolour, stretch or tilt the logo lockup.
- **Don't** set body-size red text on the beige ground; it reads about 3.1:1.
- **Don't** stack a ribbon or tracked label above a headline as an eyebrow; ribbons carry a claim beside or after the headline.
- **Don't** use bright red as a surface colour; it is the reticle and live accent only.
- **Don't** add textures other than the halftone dot.
