# Mythly Stories — Session Notes

## What This Project Is
A collection of Indian mythology stories rendered as beautifully styled standalone HTML pages. Each story has a hero banner, inline scene images, styled dialogue, a moral card, a teaser for the next story, and source metadata.

---

## What's Built So Far

### Stories (3 total)

| # | Story | Folder | Source | Images |
|---|-------|--------|--------|--------|
| 1 | The Starving Sage Who Was Offered Heaven — And Said No | `the-starving-sage/` | Mahabharata, Vana Parva, Ch 257–261 | ✅ All 3 added |
| 2 | The Thief Who Accidentally Became the God of Wealth | `the-thief-who-became-kubera/` | Shiva Purana, Rudra Samhita, Ch 17–20 | ❌ Needs 3 images |
| 3 | The Guru Who Taught His Student by Climbing on His Back | `the-guru-who-taught/` | Vishnu Purana, Book 2, Ch 15–16 | ❌ Needs 3 images |

### Duplicate Removed
- "The Sage Who Was Offered Heaven — and Said No" was a retelling of Story 1 (Mudgala). Deleted to avoid duplication. Original (more concise version) kept.

---

## Design System

### Typography
- **Playfair Display** (900) — titles, drop caps
- **Lora** (400/500/600) — body text, story paragraphs
- **Inter** (400/500/600) — labels, metadata, captions

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--gold` | `#C4963C` | Accents, drop caps, ornaments |
| `--gold-light` | `#E8C875` | Hero labels, moral section |
| `--saffron` | `#D4742C` | Speaker labels, teaser |
| `--cream` | `#FDF6E3` | Page background |
| `--parchment` | `#F5EDDA` | Card backgrounds |
| `--ink` | `#2C1810` | Body text, hero gradient |
| `--ink-light` | `#4A3728` | Secondary text |

### HTML Structure (per story)
```
header.hero          → Full-bleed feature image + title overlay
main.content
  .story             → Paragraphs with drop cap on first
    .dialogue        → Styled quote blocks with speaker labels
    .scene-image     → Inline images with captions
  .moral             → Dark card with lesson text
  .teaser            → Dashed box "But wait..." next story hook
  .metadata          → Grid of characters, theme, source
footer               → Lotus + "Mythly Stories" branding
```

### Image Naming Convention
Each story folder has `images/` with:
- `featured.png` — hero banner (16:9 or 3:4)
- `img1.png` — first scene image
- `img2.png` — second scene image

Images have `onerror` fallbacks that show placeholder text if missing.

---

## Tools & Infrastructure

### Dev Server
- **Config:** `.claude/launch.json`
- **Command:** `python3 -m http.server 8080 --directory stories`
- **Access:** `http://localhost:8080/<story-folder>/`

### Image Generation (NOT working yet)
- **Gemini CLI** (`v0.29.6`) is installed, authenticated via OAuth
- Gemini CLI agent mode tried external tools (pollinations.ai) and failed
- A Python script (`generate_images.py`) was written to use Google GenAI SDK but OAuth client refresh failed
- **Blocker:** Need a `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey) for direct API access
- **Alternative:** User generates images manually and drops them in `images/` folder

### Skills Available
- **nano-banana-prompts** (`~/Downloads/nano-banana-prompts/`) — prompt crafting guide for Gemini image generation
- **nano-banana-pro-prompts-recommend-skill** (`~/.agents/skills/...`) — 10,000+ curated prompt library with categories (social media, product, poster, etc.)

### GitHub
- **Repo:** https://github.com/PalankiBharat/mythly-stories
- **Auth:** `gh auth login` as PalankiBharat (HTTPS)
- SSH key is linked to `Bharat-Neo` account (different from repo owner), so use HTTPS for pushes

---

## Story Input Format

User provides stories in this markdown format:

```
📖 TITLE
<story title>

🖼️ FEATURE IMAGE PROMPT
<detailed prompt for hero image>

📜 THE STORY
<full story text with paragraphs>

🎨 IMAGE PROMPT 1
<prompt for inline scene image>

🎨 IMAGE PROMPT 2
<prompt for inline scene image>

🪷 MORAL
<lesson text>

🔗 BUT WAIT...
<teaser for next story>

👥 CHARACTERS
<character list>

💎 VIRTUE / THEME
<theme description>

📚 EPIC / SOURCE
<source citation>
```

---

## What To Do Next

### Immediate
- [ ] Add images to `the-thief-who-became-kubera/images/` (featured.png, img1.png, img2.png)
- [ ] Add images to `the-guru-who-taught/images/` (featured.png, img1.png, img2.png)
- [ ] Fix image generation pipeline (get GEMINI_API_KEY or use alternative)

### Future Ideas
- [ ] Create an index/home page listing all stories with thumbnails
- [ ] Add "Next Story" / "Previous Story" navigation between stories
- [ ] Add reading time estimate to each story
- [ ] Add a share button (WhatsApp, Twitter, copy link)
- [ ] Dark mode toggle
- [ ] Mobile-optimized reading experience improvements
- [ ] Convert to a static site generator (11ty, Astro) if stories grow past ~20
- [ ] Add audio narration option (TTS)
- [ ] Create a story submission template/script that auto-generates HTML from markdown
- [ ] Deploy to GitHub Pages or Vercel for public access
- [ ] Explore RSS feed for story subscriptions
