# Framer CMS Model

This rebuild changes the site architecture completely.

The page is no longer centered on a flat SVG illustration. It is now structured around:

1. one sticky true-3D product stage
2. a sequence of scroll chapters that drive the 3D camera and product state
3. supporting content sections for performance, finishes, specs, pricing, reviews, and CTA

## Page hierarchy

1. `Site Header`
2. `3D Tour`
3. `Performance`
4. `Finishes`
5. `Specs + Purchase`
6. `Reviews`
7. `CTA`
8. `Footer`

## Recommended collections

### `site_settings`

- `site_title` — plain text
- `meta_title` — plain text
- `meta_description` — long text
- `hero_eyebrow` — plain text
- `hero_title_line_1` — plain text
- `hero_title_line_2` — plain text
- `hero_body` — long text
- `hero_line` — plain text
- `hero_primary_cta_label` — plain text
- `hero_primary_cta_link` — link
- `hero_secondary_cta_label` — plain text
- `hero_secondary_cta_link` — link
- `hero_metric_1_value` — plain text
- `hero_metric_1_label` — plain text
- `hero_metric_2_value` — plain text
- `hero_metric_2_label` — plain text
- `hero_metric_3_value` — plain text
- `hero_metric_3_label` — plain text
- `hero_metric_4_value` — plain text
- `hero_metric_4_label` — plain text

### `tour_chapters`

- `slug` — plain text
- `order` — number
- `phase_key` — enum:
  - `hero`
  - `orbit`
  - `silence`
  - `band`
  - `yoke`
  - `shell`
  - `cushion`
  - `driver`
- `eyebrow` — plain text
- `title` — plain text
- `title_emphasis` — plain text
- `body` — long text
- `stat_label` — plain text, optional
- `alignment` — enum: `left`, `right`, `hero`

Important:
- `phase_key` is logic-bound. It must stay synchronized with the 3D code timeline.
- Adding or renaming a phase requires updating the Framer code component that drives the scene.

### `feature_highlights`

- `slug` — plain text
- `order` — number
- `index_label` — plain text
- `title` — plain text
- `description` — long text
- `stat_label` — plain text

### `finishes`

- `slug` — plain text
- `order` — number
- `name` — plain text
- `description` — long text
- `theme` — enum: `obsidian`, `mineral`, `ember`
- `image` — image, optional if you replace the CSS visual blocks with product renders

### `spec_rows`

- `slug` — plain text
- `order` — number
- `label` — plain text
- `value` — plain text

### `price_tiers`

- `slug` — plain text
- `order` — number
- `name` — plain text
- `tagline` — plain text
- `price` — plain text
- `flag` — plain text, optional
- `features` — list
- `cta_label` — plain text
- `cta_link` — link
- `is_featured` — boolean

### `reviews`

- `slug` — plain text
- `order` — number
- `quote` — long text
- `name` — plain text
- `role` — plain text

## Framer component mapping

- `ThreeDStage`
  - code component
  - owns the WebGL canvas, procedural headphone model, lighting, material system, and scroll timeline
  - binds to `tour_chapters` only through the `phase_key` timeline mapping, not raw visual layers

- `TourChapter`
  - binds to `tour_chapters`
  - pure content layer that sits above the sticky 3D stage

- `FeatureCard`
  - binds to `feature_highlights`

- `FinishCard`
  - binds to `finishes`

- `SpecRow`
  - binds to `spec_rows`

- `PriceTier`
  - binds to `price_tiers`

- `ReviewCard`
  - binds to `reviews`

## Layer naming rules

- Keep motion ownership obvious in the layer tree:
  - `3D Stage`
  - `Scene Canvas`
  - `Tour Chapters`
  - `Chapter Copy`

- Keep CMS collections plural:
  - `tour_chapters`
  - `feature_highlights`
  - `finishes`
  - `spec_rows`
  - `price_tiers`
  - `reviews`

- Keep phase names exact:
  - `hero`
  - `orbit`
  - `silence`
  - `band`
  - `yoke`
  - `shell`
  - `cushion`
  - `driver`

## Handoff notes

- The headphone is now procedural true 3D, generated in `app.mjs`.
- It is not a sprite sequence and not a flat SVG stack.
- In Framer, this should be treated as a dedicated code component rather than a regular layer composition.

- The scroll choreography depends on:
  - sticky stage layout
  - chapter activation based on viewport position
  - a pose timeline with camera, rotation, and exploded-state values

- If you later replace the procedural model with a production 3D asset:
  - keep the same phase keys
  - keep the same chapter structure
  - swap only the scene/model implementation inside the code component

- The finish blocks are still CSS-driven placeholders.
- If real product renders arrive, replace only the visual area inside each finish card and leave the content structure intact.
