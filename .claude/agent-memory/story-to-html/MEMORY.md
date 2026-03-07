# Story Builder Agent Memory

## Template Conformance Checklist (vs. the-starving-sage reference)

- Featured image prompt comment goes AFTER `<img>` tag, not before it
- Only two placeholder variants exist: default (16/9) and `.portrait` (4/5) — no `.square` class
  - Use `portrait` class in `onerror` for square/portrait images; do not add a `.square` CSS rule
- The reference template has no `Verification` meta-card — it is a story-specific addition, acceptable to keep when present
- Image prompt comments for scene images go BEFORE the `<img>` tag (inside `.scene-image` div), after the opening div comment label
- Hero `<img>` uses `onerror="this.style.display='none'"` (not outerHTML replacement)
- Scene `<img>` tags use `onerror="this.outerHTML='<div class=\'img-placeholder portrait\'>Add imgN.png</div>'"`

## Story-Specific Notes

### the-letter-that-moved-a-god (Rukmini & Krishna)
- Rukmini's vow: "give up her vital force through severe penance" — NOT "fast unto death"
- Temple is Goddess Ambika (Girija), a form of Parvati — name her specifically
- Story path: `stories/the-letter-that-moved-a-god/index.html`
