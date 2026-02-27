# Typewriter Component for Webstudio

## 1) Publish the script
This component is loaded as one JS file:
`dist/typewriter-webstudio.js`

If you are using this GitHub repo directly, use jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/gh/marksagangms-debug/ws-typewriter@main/dist/typewriter-webstudio.js"></script>
```

For production, pin to a release tag instead of `main`:

```html
<script src="https://cdn.jsdelivr.net/gh/marksagangms-debug/ws-typewriter@v1.0.0/dist/typewriter-webstudio.js"></script>
```

## 2) Add script in Webstudio
In your Webstudio project:
1. Open `Project Settings`.
2. Go to `Custom Code`.
3. Paste the script tag in `Before </body>` (recommended).
4. Publish.

## 3) Add a typewriter element
Add a text element (for example a `Span` or `Heading`) and set its custom attribute:

```html
<span dv-typewriter="auto loop">made fun|made bold|made creative</span>
```

Use `|` to separate text variations.

## 4) Match your highlighted style
Use this markup pattern:

```html
<span
  class="tag"
  dv-typewriter="inview duration-72 delete-44 before-delete-1200 before-type-180 loop"
  dv-typewriter-colors="#F39A02|#0B7A17|#91128A|#F14921"
>
  made fun|made bold|made creative|made intentional
</span>
```

Add CSS in Webstudio custom CSS:

```css
.tag {
  --angle: -0.5deg;
  display: inline-flex;
  align-items: baseline;
  gap: 0.04em;
  padding: 0.09em 0.24em 0.14em;
  color: #fff;
  background: #f39a02;
  transform: skewX(var(--angle));
  white-space: nowrap;
}

.dv-typewriter-text,
.dv-typewriter-cursor {
  transform: skewX(calc(var(--angle) * -1));
}
```

## 5) Attribute reference
`dv-typewriter` supports:
- `auto` = start on load (default)
- `inview` = start when entering viewport
- `loop` = repeat forever
- `duration-X` = typing speed in ms per character (default `55`)
- `delete-X` = deleting speed in ms per character (default `45`)
- `before-delete-X` = wait before deleting (default `1400`)
- `before-type-X` = wait before next phrase (default `260`)

Optional attributes:
- `dv-typewriter-items="one|two|three"` uses this list instead of inner text
- `dv-typewriter-colors="#F39A02|#0B7A17|#91128A"` cycles background colors
- `dv-typewriter-color-target="self|parent|.selector"` sets where color animation is applied
- `dv-typewriter-separator="|"` custom separator for parsing phrases
- `dv-typewriter-cursor="|"` custom cursor character

## 6) Notes
- The script auto-loads GSAP automatically.
- It respects `prefers-reduced-motion` and shows only the first phrase.
- Generated text wrapper class: `.dv-typewriter-text`
- Generated cursor wrapper class: `.dv-typewriter-cursor`

## 7) Troubleshooting
- If only the first letter appears, make sure your text element does not force a tiny fixed width.
- Prefer plain text phrases like `made fun|made creative|made intentional`.
- If you must keep spaces around separators, this is supported: `made fun | made creative`.
