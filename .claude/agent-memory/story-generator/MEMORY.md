# Story Generator Memory

## Stories Completed
- See `stories-completed.md` for full list of stories already generated (to avoid repeats)

## Project Conventions
- Each story lives in `/stories/<slug>/index.html` with `images/` subfolder
- Images: `featured.png` (3:4 hero), `img1.png` (1:1 scene), `img2.png` (1:1 scene)
- Image prompts saved as `.txt` files in the images folder when PNGs not yet generated
- HTML uses shared CSS design system (inline per file): Playfair Display, Lora, Inter fonts
- Color palette: gold #C4963C, cream #FDF6E3, ink #2C1810, saffron #D4742C
- Dialogue uses `.dialogue` class with `.speaker` label
- Story format: hero > ornament > story paragraphs > scene images > moral > teaser > metadata > footer
- `onerror` fallbacks on all images

## Source Preferences for Devi Stories
- Devi Mahatmya (Markandeya Purana Ch 81-93) - most reliable source for goddess stories
- Devi Bhagavata Purana - expanded narratives
- Shakambhari story: Devi Mahatmya Ch 11 (~verses 42-51), expanded in Devi Bhagavata Skandha 7
