# GSAP Typewriter for Webstudio

## Overview
Use `dist/typewriter-webstudio.js` as a single script include. It auto-loads GSAP + TextPlugin, then animates any element with the `dv-typewriter` attribute.

## Script Include
```html
<script src="https://YOUR-CDN/typewriter-webstudio.js"></script>
```

For local testing:
```html
<script src="./dist/typewriter-webstudio.js"></script>
```

## Basic Usage
```html
<span dv-typewriter="auto loop">made fun|made bold|made creative</span>
```

## Full Example (matching your style)
```html
<span
  class="tag"
  dv-typewriter="inview duration-72 delete-44 before-delete-1200 before-type-180 loop"
  dv-typewriter-colors="#F39A02|#0B7A17|#91128A|#F14921"
>
  made fun|made bold|made creative|made intentional
</span>
```

## Options
- `auto` = start immediately (default)
- `inview` = start once when element enters viewport
- `loop` = repeat forever
- `duration-X` = typing speed in ms per character (default `55`)
- `delete-X` = deleting speed in ms per character (default `45`)
- `before-delete-X` = delay before deleting in ms (default `1400`)
- `before-type-X` = delay before typing next phrase in ms (default `260`)

## Additional Attributes
- `dv-typewriter-items="one|two|three"`  
If provided, this is used instead of the element text content.
- `dv-typewriter-colors="#F39A02|#0B7A17|#91128A"`  
Optional color cycle for background transitions.
- `dv-typewriter-color-target="self|parent|.selector"`  
Select where background colors are applied.
- `dv-typewriter-cursor="|"`  
Customize cursor character.

## Notes
- The script respects `prefers-reduced-motion` and shows the first phrase only.
- The generated cursor element uses class `.dv-typewriter-cursor`.
- The generated text wrapper uses class `.dv-typewriter-text`.
