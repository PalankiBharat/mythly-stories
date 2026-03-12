# Mythly Stories — JSON Content Format Specification

**Version:** 1.1.0
**Last updated:** 2026-03-10
**Status:** Reference specification — pre-implementation

---

## Changelog v1.1.0

| # | Change |
|---|---|
| 1 | `dropCap` boolean removed from `paragraph`. New block type `leadParagraph` added for the opening paragraph with large first letter. |
| 2 | `ornament` removed. Replaced with `divider` (visual `· · ·` separator) and `spacer` (empty height). |
| 3 | Inline text formatting unified: `bold`, `italic`, `boldItalic` node types removed. Replaced with `marks: string[]` on the `text` node. Supports `"bold"`, `"italic"`, `"underline"`. |
| 4 | `moral` is now **optional** (nullable). Not every story requires a lesson card. |
| 5 | HTML text strings **ruled out** — see Section 4 for the reasoning. |
| 6 | `characterLink` removed. Character deep links will be handled via `externalLink` using Mythly deep link URLs when character pages are built. |

---

## 1. Why JSON Blocks (not HTML)

| Concern | Raw HTML | JSON Blocks |
|---|---|---|
| **Native Android rendering** | Requires WebView — slow, laggy, can't integrate with Compose layout or animations | Each block maps to a Compose composable. A `paragraph` block becomes `Text()`. A `dialogue` block becomes `DialogueCard()`. No WebView. |
| **Database storage** | Stored as unqueryable text blob. Finding all stories with a dialogue by "Krishna" requires regex on raw HTML. | JSONB with GIN index. Query: `WHERE blocks @> '[{"type":"dialogue","speaker":"Krishna"}]'` |
| **Admin editor** | TipTap/BlockNote output is JSON natively. Converting to/from HTML adds a lossy round-trip layer. | The editor's native format IS the storage format. No conversion. No data loss. |
| **Inline links between stories** | `<a href="/stories/savitri">` is opaque. Backend can't validate target story exists. Slug renames break links silently. | `storyLink` carries `storySlug` as a typed field. Backend validates referential integrity on save. |
| **Extensibility** | Adding a new content type means inventing HTML class conventions and hoping every renderer handles them. | Add a new `type` to the registry. Old clients skip unknown types gracefully. |

**The decision is clear: JSON blocks.**

---

## 2. Story Object — Full Schema

Every story is one JSON document.

### Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `schemaVersion` | `integer` | Yes | Schema version number. Currently `1`. |
| `id` | `string (UUID)` | Yes | Unique identifier. Generated server-side. |
| `slug` | `string` | Yes | URL-safe ID. Lowercase letters, digits, hyphens only. Unique across all stories. |
| `title` | `string` | Yes | Story title. Max 200 characters. |
| `subtitle` | `string \| null` | No | Optional subtitle shown below the title. |
| `source` | `string` | Yes | Scripture and section, e.g. `"Mahabharata · Vana Parva"`. |
| `featuredImage` | `FeaturedImage` | Yes | Hero banner image object. |
| `heroMeta` | `string[]` | Yes | 1–4 short tag strings shown as chips in the hero header. |
| `readingTimeMinutes` | `integer` | Yes | Estimated reading time. Calculated server-side if not provided. |
| `moral` | `InlineNode[] \| null` | **No** | Lesson/moral card. Optional — not every story has one. If present, must have at least 1 node. |
| `teaser` | `Teaser \| null` | No | Optional teaser linking to the next story. |
| `metadata` | `Metadata` | Yes | Structured metadata: characters, theme, source, verification. |
| `blocks` | `Block[]` | Yes | The story body. Must contain at least 1 `paragraph` or `leadParagraph`. |
| `isPublished` | `boolean` | Yes | Whether the story is visible to readers. |
| `publishedAt` | `string (ISO 8601) \| null` | No | Timestamp of first publication. Null if never published. |
| `createdAt` | `string (ISO 8601)` | Yes | Set server-side. Not editable by clients. |
| `updatedAt` | `string (ISO 8601)` | Yes | Set server-side on every save. Not editable by clients. |

### Nested Object Types

**FeaturedImage:**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | CDN URL of the image. |
| `alt` | `string` | Yes | Alt text for accessibility. |
| `aspectRatio` | `string` | Yes | Always `"3:4"` for featured images. |
| `generationPrompt` | `string \| null` | No | AI prompt used to generate the image. Stored for regeneration. Never shown to readers. |

**Teaser:**

| Field | Type | Required | Description |
|---|---|---|---|
| `nextStorySlug` | `string` | Yes | Slug of the story this teaser links to. Must reference an existing story. |
| `content` | `InlineNode[]` | Yes | Rich text teaser body. |

**Metadata:**

| Field | Type | Required | Description |
|---|---|---|---|
| `characters` | `string` | Yes | Description of characters with roles and relationships. |
| `theme` | `string` | Yes | Virtue/theme description. |
| `source` | `string` | Yes | Full source citation with book, chapter, and translation references. |
| `verification` | `string \| null` | No | Cross-referencing notes. Null if not provided. |

### Full Example: "Hanuman and Bhima"

```json
{
  "schemaVersion": 1,
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "slug": "hanuman-and-bhima",
  "title": "Why Even Hanuman Could Not Show His True Size — And What He Told Bhima About the End of the World",
  "subtitle": null,
  "source": "Mahabharata · Vana Parva",
  "featuredImage": {
    "url": "https://cdn.mythly.app/stories/hanuman-and-bhima/featured.png",
    "alt": "Colossal golden-furred Hanuman towering over a Himalayan banana grove while tiny Bhima stands at his feet",
    "aspectRatio": "3:4",
    "generationPrompt": "A colossal golden-furred Hanuman towering over a Himalayan banana grove, his body as tall as the Vindhya mountain, eyes like copper suns, while tiny Bhima stands at his feet shielding his eyes from divine radiance, Indian mythological painting style inspired by Raja Ravi Varma, warm golden-hour lighting, dramatic scale contrast, 4K cinematic composition. Aspect ratio 3:4, portrait orientation."
  },
  "heroMeta": [
    "Bhima–Hanuman Samvada",
    "Chapters 146–150",
    "Time & Brotherhood"
  ],
  "readingTimeMinutes": 7,
  "moral": [
    {
      "type": "text",
      "text": "Even Hanuman — blessed by every god, immune to every weapon — looked at his body and said: "
    },
    {
      "type": "text",
      "text": "I too must conform to Time.",
      "marks": ["italic"]
    },
    {
      "type": "text",
      "text": " The question is not whether your age is perfect. The question is whether you give everything you have within the age you are given."
    }
  ],
  "teaser": {
    "nextStorySlug": "hanuman-flag-of-arjuna",
    "content": [
      {
        "type": "text",
        "text": "Hanuman's promise to Bhima — \"my voice shall join yours on the battlefield\" — was not an empty blessing. In the "
      },
      {
        "type": "text",
        "text": "Bhishma Parva",
        "marks": ["italic"]
      },
      {
        "type": "text",
        "text": ", Arjuna's chariot carries a flag with an ape emblem. At the war's end, after Krishna and Hanuman step off the chariot, the scripture says it immediately burst into flames — because only their presence had been protecting it from celestial weapons throughout the war."
      }
    ]
  },
  "metadata": {
    "characters": "Hanuman (son of Vayu, chiranjeevi from the Treta Yuga), Bhima (son of Vayu, Pandava warrior of the Dwapara Yuga), Draupadi (who asked for the Saugandhika flower)",
    "theme": "The Power of Time · Humility Before the Inevitable · Brotherhood Across Ages",
    "source": "Mahabharata, Vana Parva (Book 3), Chapters 146–150. Chapter 146 covers Bhima's quest for the Saugandhika flower and the tail-lifting episode. Chapter 148 covers Hanuman's teaching on the four Yugas. (Chapter numbers follow the Ganguli translation; BORI Critical Edition numbers may differ.)",
    "verification": null
  },
  "isPublished": true,
  "publishedAt": "2026-03-08T10:00:00Z",
  "createdAt": "2026-03-07T14:30:00Z",
  "updatedAt": "2026-03-10T09:15:00Z",
  "blocks": [
    {
      "type": "leadParagraph",
      "content": [
        {
          "type": "text",
          "text": "Most people know that Bhima once met Hanuman in a forest and could not lift his tail. That part is famous. But what happened after — the long conversation between two brothers — is one of the most extraordinary and forgotten teachings in the entire Mahabharata."
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "It began with a flower."
        }
      ]
    },
    {
      "type": "dialogue",
      "speaker": "The Old Monkey",
      "content": [
        {
          "type": "text",
          "text": "I am too old and weak to move. If you are in a hurry, simply move my tail aside and pass."
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Bhima"
        },
        {
          "type": "text",
          "text": ", who could uproot trees with one hand, bent down and tried to lift the tail. He could not move it even a hair's width. He failed."
        }
      ]
    },
    {
      "type": "dialogue",
      "speaker": "Hanuman",
      "content": [
        {
          "type": "text",
          "text": "I am "
        },
        {
          "type": "text",
          "text": "Hanuman"
        },
        {
          "type": "text",
          "text": ", the son of Vayu. You too are a son of Vayu. We are brothers."
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "What followed is the part most people have never heard."
        }
      ]
    },
    {
      "type": "sceneImage",
      "url": "https://cdn.mythly.app/stories/hanuman-and-bhima/img1.png",
      "alt": "Hanuman and Bhima sitting face to face on a flat rock in a Himalayan banana grove",
      "caption": "Two sons of Vayu — brothers from different ages — share a teaching on a Himalayan mountainside",
      "aspectRatio": "1:1",
      "generationPrompt": "Hanuman and Bhima sitting face to face on a flat rock in a Himalayan banana grove, Hanuman in his aged wise form teaching with one hand raised, Bhima listening with folded hands, warm golden afternoon light filtering through banana leaves, Indian mythological painting style, intimate composition, 4K detail."
    },
    {
      "type": "dialogue",
      "speaker": "Hanuman",
      "content": [
        {
          "type": "text",
          "text": "Even I, "
        },
        {
          "type": "text",
          "text": "Hanuman"
        },
        {
          "type": "text",
          "text": " — the one who leapt across the ocean, blessed by Brahma and Indra — cannot escape the power of Time. My body has shrunk. Not because I have grown weak. Because the age itself has diminished, and all beings, even gods and immortals, must conform."
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "sceneImage",
      "url": "https://cdn.mythly.app/stories/hanuman-and-bhima/img2.png",
      "alt": "Split image — young blazing Hanuman leaping across the ocean on the left, older silver-furred Hanuman meditating quietly on the right",
      "caption": "The same soul across two ages — diminished not by weakness, but by Time itself",
      "aspectRatio": "1:1",
      "generationPrompt": "Split image showing young blazing Hanuman leaping across the ocean on the left and older silver-furred Hanuman meditating quietly on the right, contrasting the Treta Yuga and Dwapara Yuga, Indian mythological painting style, warm vs cool color contrast, 4K cinematic composition."
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Then the two sons of the wind god parted. Two brothers from two different ages, meeting for one afternoon on a mountain — and sharing a truth about Time that applies to every age, including ours."
        }
      ]
    }
  ]
}
```

---

## 3. Block Types — Every Type With Full Example

The `blocks` array is an ordered list of content blocks. Each block has a `type` field that determines its structure and how it renders.

---

### 3.1 `paragraph`

A standard body text block.

**Renders as:** Justified serif text (Lora font). No special first letter.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"paragraph"` | Yes | Block type discriminator. |
| `content` | `InlineNode[]` | Yes | Rich text content. Must have at least 1 node. |

**Example:**

```json
{
  "type": "paragraph",
  "content": [
    {
      "type": "text",
      "text": "It began with a flower."
    }
  ]
}
```

**With inline formatting:**

```json
{
  "type": "paragraph",
  "content": [
    {
      "type": "text",
      "text": "This was not the first time "
    },
    {
      "type": "text",
      "text": "Bhima"
    },
    {
      "type": "text",
      "text": " had tested his strength against a divine being. But it was the first time he had "
    },
    {
      "type": "text",
      "text": "lost",
      "marks": ["bold"]
    },
    {
      "type": "text",
      "text": "."
    }
  ]
}
```

---

### 3.2 `leadParagraph`

The opening paragraph of a story. Visually identical to `paragraph` but the first letter is rendered as a large decorative initial (drop cap style) in Playfair Display font, colored gold (#C4963C).

**Renders as:** Same as `paragraph`, but with a large decorative first letter floating to the left, 3 lines tall, gold color.

**Rules:**
- There must be **exactly one** `leadParagraph` per story.
- It must be the **first block** in the `blocks` array.
- It cannot appear anywhere else.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"leadParagraph"` | Yes | Block type discriminator. |
| `content` | `InlineNode[]` | Yes | Rich text content. Must have at least 1 node. |

**Example:**

```json
{
  "type": "leadParagraph",
  "content": [
    {
      "type": "text",
      "text": "Most people know that Bhima once met Hanuman in a forest and could not lift his tail. That part is famous. But what happened after — the long conversation between two brothers — is one of the most extraordinary and forgotten teachings in the entire Mahabharata."
    }
  ]
}
```

**Why a separate block type instead of a boolean flag?**
A flag like `dropCap: true` on a `paragraph` block is invisible in the block registry — you only discover it by reading the `paragraph` spec. A dedicated `leadParagraph` type is self-documenting: the type name tells you exactly what it is, and its constraints (exactly one, always first) are enforced at the type level, not as a side-rule on another type.

---

### 3.3 `dialogue`

A character speaking. Renders as a styled blockquote card.

**Renders as:** A card with a 3px gold left border, parchment gradient background, speaker name in uppercase saffron Inter font, and italic body text.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"dialogue"` | Yes | Block type discriminator. |
| `speaker` | `string` | Yes | Character name. Stored as written. The UI applies uppercase styling — do not store in all caps. |
| `content` | `InlineNode[]` | Yes | The words spoken. |

**Example — Krishna speaking:**

```json
{
  "type": "dialogue",
  "speaker": "Krishna",
  "content": [
    {
      "type": "text",
      "text": "Whenever dharma declines and adharma rises, I manifest myself. For the protection of the good, for the destruction of the wicked, and for the establishment of dharma, I come into being age after age."
    }
  ]
}
```

**Example — speaker name with title:**

```json
{
  "type": "dialogue",
  "speaker": "The Old Monkey",
  "content": [
    {
      "type": "text",
      "text": "I am too old and weak to move. If you are in a hurry, simply move my tail aside and pass."
    }
  ]
}
```

**Edge cases:**
- `speaker` is stored as the author wrote it — "The Old Monkey", "Krishna", "Savitri". Never modify the casing in the data.
- Dialogue content can contain `storyLink`, `externalLink`, and inline marks for emphasis within speech.

---

### 3.4 `sceneImage`

An inline illustration placed within the story flow.

**Renders as:** A full-width image (constrained by aspect ratio) with rounded corners, subtle shadow, followed by italicized caption text.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"sceneImage"` | Yes | Block type discriminator. |
| `url` | `string` | Yes | CDN URL of the image file. |
| `alt` | `string` | Yes | Descriptive alt text for accessibility. |
| `caption` | `string` | Yes | Caption shown below the image. Plain text — no inline nodes. |
| `aspectRatio` | `"1:1" \| "3:4" \| "16:9"` | Yes | Determines container sizing. |
| `generationPrompt` | `string \| null` | No | AI prompt used to generate the image. Stored for regeneration. Never shown to readers. |

**Example — square (1:1):**

```json
{
  "type": "sceneImage",
  "url": "https://cdn.mythly.app/stories/hanuman-and-bhima/img1.png",
  "alt": "Hanuman and Bhima sitting face to face on a flat rock in a Himalayan banana grove",
  "caption": "Two sons of Vayu — brothers from different ages — share a teaching on a Himalayan mountainside",
  "aspectRatio": "1:1",
  "generationPrompt": "Hanuman and Bhima sitting face to face on a flat rock in a Himalayan banana grove, Indian mythological painting style, warm golden afternoon light, intimate composition, 4K detail."
}
```

**Example — portrait (3:4):**

```json
{
  "type": "sceneImage",
  "url": "https://cdn.mythly.app/stories/the-woman-who-outwitted-death/img2.png",
  "alt": "Savitri walking with calm determination behind Yama on a dark forest path at twilight",
  "caption": "She did not beg. She did not weep. She followed — and she spoke.",
  "aspectRatio": "3:4",
  "generationPrompt": "A determined young Indian woman (Savitri) walking barefoot on a dark forest path at twilight, her face showing calm resolve, walking steadily behind a towering dark figure (Yama), dim silver moonlight, Indian mythological oil painting style, muted earth tones. Aspect ratio 3:4."
}
```

**Rendering constraints:**

| Aspect Ratio | Max width | Alignment |
|---|---|---|
| `"1:1"` | 560px | Centered |
| `"3:4"` | 480px | Centered |
| `"16:9"` | Full content width | Full width |

If the image fails to load, show a placeholder preserving the aspect ratio with the alt text displayed.

---

### 3.5 `divider`

A decorative section break. Replaces the old `ornament` type.

**Renders as:** A centered line of three dots with wide spacing: `· · ·` in gold (#C4963C) at 60% opacity.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"divider"` | Yes | Block type discriminator. No other fields. |

**Example:**

```json
{
  "type": "divider"
}
```

**Validation rules:**
- Two consecutive `divider` blocks are collapsed to one during save normalization.
- A `divider` as the first or last block in `blocks[]` is stripped during save normalization.
- A `divider` directly adjacent to a `sceneImage` should be avoided (editor should warn).

---

### 3.6 `spacer`

An empty vertical gap between blocks. Use when you need breathing room without a visible divider.

**Renders as:** An empty block of the specified height. No visual content.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"spacer"` | Yes | Block type discriminator. |
| `size` | `"sm" \| "md" \| "lg"` | Yes | The height of the spacer. |

**Size reference:**

| Size | Web (px) | Android (dp) | Use case |
|---|---|---|---|
| `"sm"` | 8px | 8dp | Tight gap between related paragraphs |
| `"md"` | 24px | 24dp | Standard section breathing room |
| `"lg"` | 48px | 48dp | Major section break without a divider line |

**Example:**

```json
{
  "type": "spacer",
  "size": "md"
}
```

---

### 3.7 `moral` (on story root, not in `blocks[]`)

The moral does **not** live in `blocks[]`. It is a top-level field on the story object because when it exists, it always appears in a fixed position after the story body.

**Renders as:** A dark card (dark brown gradient background) with a "THE LESSON" label in gold uppercase text, followed by the moral text in cream-colored italic serif font.

**Structure:** `InlineNode[] | null`. Nullable — not every story has a moral.

**Example (present):**

```json
{
  "moral": [
    {
      "type": "text",
      "text": "Karna did not give blindly. He knew exactly what it would cost. He gave anyway — because his dharma of giving was more important to him than his own survival. The hardest kind of sacrifice is not the one made in ignorance. It is the one made with "
    },
    {
      "type": "text",
      "text": "open eyes",
      "marks": ["italic"]
    },
    {
      "type": "text",
      "text": "."
    }
  ]
}
```

**Example (absent):**

```json
{
  "moral": null
}
```

**Notes:**
- The label text "The Lesson" is not stored in the data. It is part of the rendering template.
- When `moral` is null, the moral card is simply not rendered.

---

### 3.8 `teaser` (on story root, not in `blocks[]`)

The teaser does **not** live in `blocks[]`. It is a top-level field — when present, it always appears after the moral card.

**Renders as:** A dashed-border card on parchment background with a "BUT WAIT..." label in saffron uppercase text, followed by the teaser body. The entire card is tappable and navigates to `nextStorySlug`.

**Structure:** `Teaser | null`.

**Example (present):**

```json
{
  "teaser": {
    "nextStorySlug": "hanuman-flag-of-arjuna",
    "content": [
      {
        "type": "text",
        "text": "Hanuman's promise to Bhima was not an empty blessing. In the "
      },
      {
        "type": "text",
        "text": "Bhishma Parva",
        "marks": ["italic"]
      },
      {
        "type": "text",
        "text": ", Arjuna's chariot carries a flag with an ape emblem. At the war's end, after "
      },
      {
        "type": "text",
        "text": "Krishna"
      },
      {
        "type": "text",
        "text": " and Hanuman step off the chariot, the scripture says it immediately burst into flames — because only their presence had been protecting it from celestial weapons throughout the war."
      }
    ]
  }
}
```

**Example (absent):**

```json
{
  "teaser": null
}
```

---

### 3.9 `metadata` (on story root, not in `blocks[]`)

Structured metadata always present at the bottom of every story.

**Renders as:** A 2-column grid (1-column on mobile) of parchment cards. Characters and Theme side by side. Source and Verification each full-width.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `characters` | `string` | Yes | Character descriptions with roles. |
| `theme` | `string` | Yes | Virtue/theme, separated by `·` or `-`. |
| `source` | `string` | Yes | Full scripture citation with chapter references and translation notes. |
| `verification` | `string \| null` | No | Cross-referencing notes for accuracy. |

**Example with verification:**

```json
{
  "metadata": {
    "characters": "Karna — son of Surya and Kunti, born with divine armor and earrings, the greatest giver in the Mahabharata. Surya — the sun god, Karna's birth father, who warned him in a dream. Indra — king of the gods, who came disguised as a brahmin to take Karna's armor.",
    "theme": "Dharma of Giving · Sacrifice with Eyes Open",
    "source": "Mahabharata, Vana Parva, Kundalaharana Parva, Chapters ~300–310 in the Ganguli translation. Also in the BORI Critical Edition, Aranyaka Parva.",
    "verification": "The Mahabharata describes five boons, not three. Available in K.M. Ganguli's English translation and Bibek Debroy's translation (Volume 3)."
  }
}
```

**Example without verification:**

```json
{
  "metadata": {
    "characters": "Hanuman (son of Vayu, chiranjeevi from the Treta Yuga), Bhima (son of Vayu, Pandava warrior of the Dwapara Yuga)",
    "theme": "Humility · Brotherhood Across Ages · Power of Time",
    "source": "Mahabharata, Vana Parva (Book 3), Chapters 146–150.",
    "verification": null
  }
}
```

---

### 3.10 Future Block Types (pre-planned, not built yet)

These types are reserved. Version 1 parsers skip unknown types gracefully.

| Type | Purpose |
|---|---|
| `verse` | Sanskrit verse with original text, transliteration, and English translation in three stacked lines |
| `pullQuote` | Large typographic callout quote, centered — pulled from the story for emphasis |
| `characterCard` | Profile card: character name, image, brief description, links to related stories |
| `comparisonBlock` | Side-by-side comparison (e.g. "two versions of this event from different Puranas") |
| `audioNarration` | Embedded audio player for a narrated passage or full story |
| `imageGallery` | Horizontal scrollable gallery of 2–6 images with captions |
| `callout` | Highlighted info box for editorial notes or historical context |

---

## 4. Inline Content Model — Every InlineNode Type

Inline nodes are the atoms of rich text. They appear inside the `content` array of `paragraph`, `leadParagraph`, `dialogue`, and the `moral`/`teaser` fields.

### Critical Rule: Inline Nodes Are Flat

There is **no nesting** of inline nodes. A bold word inside a story link is two separate adjacent nodes. This is a deliberate design choice:

1. **Parsing simplicity.** Every renderer (Compose, React, admin editor) walks a flat array and applies one style per node. No recursive descent.
2. **Database queryability.** Flat nodes are searchable with simple JSONB path queries.
3. **Editor compatibility.** TipTap and BlockNote represent marks as flat annotations on text runs — not as nested wrappers. The flat model matches the editor's internal representation exactly.

### On HTML Text Strings

> **Question:** Should text content be stored as HTML strings like `"This is <b>bold</b> and <i>italic</i> text"`?

**Answer: No.** HTML strings in JSON:
- Require an HTML parser on Android (or a WebView, which defeats the whole point)
- Are a security surface (XSS injection via the editor)
- Can't be queried in the database
- Can't be validated structurally
- Produce inconsistent output (different renderers may sanitize differently)

The `marks` array on the `text` node (see 4.1 below) provides all the same formatting with none of these problems. Use it.

---

### 4.1 `text`

The base inline node. Carries a string and an optional array of formatting marks.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"text"` | Yes | Node type discriminator. |
| `text` | `string` | Yes | The text content. |
| `marks` | `string[]` | No | Formatting marks applied to this text. Omit or pass `[]` for plain text. |

**Valid mark values:**

| Mark | Renders as |
|---|---|
| `"bold"` | Bold weight (font-weight 700 on web, `FontWeight.Bold` in Compose) |
| `"italic"` | Italic style |
| `"underline"` | Underlined text |

**Marks can be combined freely on the same node.**

**Examples:**

Plain text:
```json
{ "type": "text", "text": "It began with a flower." }
```

Bold:
```json
{ "type": "text", "text": "Kali Yuga", "marks": ["bold"] }
```

Italic:
```json
{ "type": "text", "text": "I too must conform to Time.", "marks": ["italic"] }
```

Bold + italic:
```json
{ "type": "text", "text": "Time is irresistible", "marks": ["bold", "italic"] }
```

Underline:
```json
{ "type": "text", "text": "This passage is contested", "marks": ["underline"] }
```

Bold + underline:
```json
{ "type": "text", "text": "Critical note", "marks": ["bold", "underline"] }
```

---

### 4.2 `storyLink`

A link that navigates to another story within Mythly.

**Renders as:** Gold-colored (#C4963C) underlined text. On tap/click, navigates to the referenced story within the app. Does **not** open a browser.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"storyLink"` | Yes | Node type discriminator. |
| `text` | `string` | Yes | Visible link text. |
| `storySlug` | `string` | Yes | Slug of the target story. Validated on save — must reference an existing story. |

**Example:**

```json
{
  "type": "storyLink",
  "text": "the story of Savitri and Satyavan",
  "storySlug": "the-woman-who-outwitted-death"
}
```

**Usage in context:**

```json
{
  "type": "paragraph",
  "content": [
    { "type": "text", "text": "This same moment is described in detail in " },
    { "type": "storyLink", "text": "the story of Karna's armor", "storySlug": "karna-and-the-armor" },
    { "type": "text", "text": "." }
  ]
}
```

---

### 4.3 `externalLink`

A link that opens an external URL in the system browser.

**Renders as:** Saffron-colored (#D4742C) underlined text with a small external-link indicator. On tap/click, opens the URL in Chrome Custom Tab (Android) or Safari (iOS).

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"externalLink"` | Yes | Node type discriminator. |
| `text` | `string` | Yes | Visible link text. |
| `url` | `string` | Yes | Full URL. Must start with `https://` or `http://`. |

**Example:**

```json
{
  "type": "externalLink",
  "text": "Ganguli's translation of the Vana Parva",
  "url": "https://www.sacred-texts.com/hin/m03/index.htm"
}
```

---

### 4.4 `sanskrit`

A Sanskrit term with optional transliteration and meaning. Forward-compatible for tooltip/pronunciation support.

**Renders as:** The text with a dotted gold underline. On long-press/hover, a tooltip shows the transliteration and English meaning.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"sanskrit"` | Yes | Node type discriminator. |
| `text` | `string` | Yes | The displayed Sanskrit term (in English transliteration or Devanagari). |
| `transliteration` | `string \| null` | No | IAST transliteration. |
| `meaning` | `string \| null` | No | English meaning or definition. |

**Example:**

```json
{
  "type": "sanskrit",
  "text": "dharma",
  "transliteration": "dharma",
  "meaning": "cosmic order, righteous duty, moral law"
}
```

**Minimal example (no transliteration available):**

```json
{
  "type": "sanskrit",
  "text": "Saugandhika",
  "transliteration": null,
  "meaning": "fragrant golden lotus"
}
```

---

### Complex Inline Example

A paragraph using multiple inline types together — `text` with marks, `storyLink`, `sanskrit`, and `externalLink`:

```json
{
  "type": "paragraph",
  "content": [
    {
      "type": "text",
      "text": "This teaching — known as the "
    },
    {
      "type": "sanskrit",
      "text": "Yuga Dharma",
      "transliteration": "yuga dharma",
      "meaning": "the righteous order specific to each cosmic age"
    },
    {
      "type": "text",
      "text": " — appears in the "
    },
    {
      "type": "text",
      "text": "Vana Parva",
      "marks": ["bold", "italic"]
    },
    {
      "type": "text",
      "text": " of the Mahabharata. It is the same conversation described in "
    },
    {
      "type": "storyLink",
      "text": "the meeting of Hanuman and Bhima",
      "storySlug": "hanuman-and-bhima"
    },
    {
      "type": "text",
      "text": ". The core message is stark: "
    },
    {
      "type": "text",
      "text": "even the immortals diminish",
      "marks": ["bold"]
    },
    {
      "type": "text",
      "text": ". See the "
    },
    {
      "type": "externalLink",
      "text": "Vishnu Purana's account of the Yugas",
      "url": "https://www.sacred-texts.com/hin/vp/index.htm"
    },
    {
      "type": "text",
      "text": " for parallel verses."
    }
  ]
}
```

This renders as:

> This teaching — known as the *Yuga Dharma* _(tooltip: "the righteous order specific to each cosmic age")_ — appears in the ***Vana Parva*** of the Mahabharata. It is the same conversation described in [the meeting of Hanuman and Bhima](#). The core message is stark: **even the immortals diminish**. See the [Vishnu Purana's account of the Yugas](https://...) for parallel verses.

---

## 5. Complete Full Story Example

A complete, realistic story JSON for "The Woman Who Outwitted Death" — abbreviated to the key sections but showing every block type and schema section in use.

```json
{
  "schemaVersion": 1,
  "id": "f7a8b9c0-d1e2-3456-789a-bcdef0123456",
  "slug": "the-woman-who-outwitted-death",
  "title": "The Woman Who Followed Death — and Out-Argued Him Five Times",
  "subtitle": null,
  "source": "Mahabharata · Vana Parva · Savitri Upakhyana",
  "featuredImage": {
    "url": "https://cdn.mythly.app/stories/the-woman-who-outwitted-death/featured.png",
    "alt": "Savitri walking with calm determination behind Yama, the god of death, on a dark forest path at twilight",
    "aspectRatio": "3:4",
    "generationPrompt": "A determined young Indian woman (Savitri) walking barefoot on a dark forest path at twilight, her face showing calm resolve and fierce intelligence, wearing a simple white cotton saree with no ornaments, walking steadily behind a towering dark figure (Yama) who carries a glowing soul-form in a noose, ancient sal trees with twisted roots, dim silver moonlight, Indian mythological oil painting style, muted earth tones with silver and deep blue accents, mood of quiet defiance. Aspect ratio 3:4."
  },
  "heroMeta": [
    "Savitri & Satyavan",
    "Chapters 293–299",
    "Intelligence & Devotion"
  ],
  "readingTimeMinutes": 8,
  "moral": [
    {
      "type": "text",
      "text": "Savitri"
    },
    {
      "type": "text",
      "text": " did not deny the truth. She did not run from it. She chose with full knowledge, prepared without complaint, and fought the impossible with "
    },
    {
      "type": "sanskrit",
      "text": "dharma",
      "transliteration": "dharma",
      "meaning": "cosmic order, righteous duty"
    },
    {
      "type": "text",
      "text": " rather than force. She listened so completely that she heard the one thing "
    },
    {
      "type": "text",
      "text": "Yama"
    },
    {
      "type": "text",
      "text": " forgot to say. The question is: when you know something hard is coming, do you avoid it? Or do you walk straight toward it, paying attention to every word?"
    }
  ],
  "teaser": {
    "nextStorySlug": "ashvapati-and-the-prayer",
    "content": [
      {
        "type": "text",
        "text": "Savitri"
      },
      {
        "type": "text",
        "text": "'s father, King Ashvapati, had his own extraordinary story. He performed eighteen years of daily worship to the goddess Savitri just to get a child. It was this goddess who blessed him with a daughter — whom he named Savitri after her. That story of a father's eighteen-year prayer is told in the same "
      },
      {
        "type": "text",
        "text": "Savitri Upakhyana",
        "marks": ["italic"]
      },
      {
        "type": "text",
        "text": ", in the chapters just before this one."
      }
    ]
  },
  "metadata": {
    "characters": "Savitri — princess of Madra, wife of Satyavan, whose intelligence defeated death. Satyavan — exiled prince, Savitri's chosen husband. Yama — the god of death and dharma. Narada — the sage who warned Savitri of Satyavan's fate.",
    "theme": "Intelligence & Devotion · Choosing with Full Knowledge · Fighting the Impossible with Wisdom",
    "source": "Mahabharata, Vana Parva, Savitri Upakhyana, Chapters approximately 293–299 (Ganguli edition). Narrated by sage Markandeya to Yudhishthira. BORI Critical Edition: Aranyaka Parva, chapters 277–283.",
    "verification": "The Mahabharata describes five boons, not three. Boon 5 was offered by Yama without his customary restriction 'except Satyavan's life' — Savitri immediately noticed the omission. Available in K.M. Ganguli's translation and Bibek Debroy's translation (Volume 3)."
  },
  "isPublished": true,
  "publishedAt": "2026-03-09T08:00:00Z",
  "createdAt": "2026-03-08T16:00:00Z",
  "updatedAt": "2026-03-10T09:30:00Z",
  "blocks": [
    {
      "type": "leadParagraph",
      "content": [
        {
          "type": "text",
          "text": "Everyone told her not to choose him. The sage "
        },
        {
          "type": "text",
          "text": "Narada"
        },
        {
          "type": "text",
          "text": " himself warned her. "
        },
        {
          "type": "text",
          "text": "Satyavan"
        },
        {
          "type": "text",
          "text": ", the prince she loved, was destined to die exactly one year from that day. Choose another husband, they said. But "
        },
        {
          "type": "text",
          "text": "Savitri"
        },
        {
          "type": "text",
          "text": " had already made her choice."
        }
      ]
    },
    {
      "type": "dialogue",
      "speaker": "Savitri",
      "content": [
        {
          "type": "text",
          "text": "Whether his life is long or short, whether he has virtues or not — I have chosen my husband once. I will not choose a second time."
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "She told no one about the prophecy. She carried it alone."
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "As the final day drew near, Savitri began a three-day fast — a vow called "
        },
        {
          "type": "sanskrit",
          "text": "triratra",
          "transliteration": "triratra",
          "meaning": "three-night vow of fasting and prayer"
        },
        {
          "type": "text",
          "text": ". She ate nothing. She stood in prayer."
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Deep in the forest, while chopping a tree, Satyavan suddenly felt a terrible pain in his head. He stumbled to Savitri and lay down with his head in her lap."
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Then she saw him."
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Yama"
        },
        {
          "type": "text",
          "text": " — the god of death himself. Not a messenger. "
        },
        {
          "type": "text",
          "text": "Yama had come personally.",
          "marks": ["bold"]
        },
        {
          "type": "text",
          "text": " Dark-skinned, wearing red garments, with a noose in his hand. He drew out from Satyavan's body a tiny being, the size of a thumb — the soul — and bound it in his noose."
        }
      ]
    },
    {
      "type": "sceneImage",
      "url": "https://cdn.mythly.app/stories/the-woman-who-outwitted-death/img1.png",
      "alt": "Yama drawing Satyavan's thumb-sized soul with his noose while Savitri holds her husband's fallen body in her lap",
      "caption": "Yama draws Satyavan's soul — and Savitri watches, unafraid",
      "aspectRatio": "1:1",
      "generationPrompt": "Yama, a powerfully built dark figure wearing a golden crown and red robes, standing over the fallen Satyavan who lies with his head in Savitri's lap under a sal tree, drawing out a tiny luminous thumb-sized soul-figure with a noose, Savitri looking up at Yama with no fear, dappled afternoon sunlight, Indian mythological painting style, Tanjore gold leaf accents, mood of dread and determination."
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Yama turned south and began to walk away. And Savitri stood up and followed him."
        }
      ]
    },
    {
      "type": "dialogue",
      "speaker": "Yama",
      "content": [
        {
          "type": "text",
          "text": "Your words are full of wisdom and bring comfort. Ask me any boon — except the life of "
        },
        {
          "type": "text",
          "text": "Satyavan"
        },
        {
          "type": "text",
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "A second boon, a third, a fourth — each time Savitri spoke wisdom so pure that Yama was moved to offer another gift. And then — the fifth boon."
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "He spoke the words — and this time, in his admiration, he did not add the restriction."
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "dialogue",
      "speaker": "Savitri",
      "content": [
        {
          "type": "text",
          "text": "Then grant me this: let "
        },
        {
          "type": "text",
          "text": "Satyavan"
        },
        {
          "type": "text",
          "text": " live, so that I may have those hundred sons you have promised me."
        }
      ]
    },
    {
      "type": "sceneImage",
      "url": "https://cdn.mythly.app/stories/the-woman-who-outwitted-death/img2.png",
      "alt": "Close-up of Savitri's face showing quiet triumph as Yama pauses, realizing he offered the fifth boon without his customary restriction",
      "caption": "The fifth boon — and the moment Savitri's sharp mind caught what Yama had left unsaid",
      "aspectRatio": "1:1",
      "generationPrompt": "Close-up of Savitri's face in the dark forest, her expression showing a quiet knowing half-smile of someone who has just won an impossible argument, her eyes steady and bright with intelligence, behind her slightly out of focus is the tall dark silhouette of Yama pausing mid-stride, warm golden light from the soul-figure, Indian mythological portrait painting style inspired by Raja Ravi Varma, mood of quiet triumph and fierce love."
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Yama"
        },
        {
          "type": "text",
          "text": " stopped. He had offered the boon without condition. He had given his word. And Savitri — who had been listening with complete attention — had caught the one unguarded moment in the god of death's speech."
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "He released Satyavan's soul from his noose."
        }
      ]
    },
    {
      "type": "dialogue",
      "speaker": "Satyavan",
      "content": [
        {
          "type": "text",
          "text": "I have slept for a long time. Why did you not wake me?"
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Savitri held him and said nothing about what she had done. They walked home together through the dark forest."
        }
      ]
    }
  ]
}
```

---

## 6. Validation Rules

Enforced on save by the backend. Displayed as errors in the admin editor.

| Rule | Field | Constraint |
|---|---|---|
| **Slug format** | `slug` | Must match `^[a-z0-9]+(-[a-z0-9]+)*$`. Lowercase, digits, hyphens only. No leading/trailing/consecutive hyphens. |
| **Slug uniqueness** | `slug` | Must be unique across all stories. Enforced by `UNIQUE` constraint in the database. |
| **Title required** | `title` | Non-empty string. Max 200 characters. |
| **Blocks minimum** | `blocks` | Must contain at least 1 block with `type: "paragraph"` or `type: "leadParagraph"`. |
| **leadParagraph position** | `blocks[0]` | If a `leadParagraph` exists, it must be the first block. A `leadParagraph` anywhere other than index 0 is rejected. |
| **leadParagraph count** | `blocks` | At most one `leadParagraph` per story. Two `leadParagraph` blocks is a validation error. |
| **Aspect ratio enum** | `sceneImage.aspectRatio` | Must be one of: `"1:1"`, `"3:4"`, `"16:9"`. |
| **storyLink integrity** | `storyLink.storySlug` | Must reference an existing story slug. Validated on save. Broken links reject the save with an error identifying the specific node. |
| **externalLink format** | `externalLink.url` | Must start with `https://` or `http://`. |
| **Moral nullable** | `moral` | May be `null`. If present (non-null), must contain at least 1 `InlineNode`. |
| **Teaser integrity** | `teaser.nextStorySlug` | If `teaser` is non-null, `nextStorySlug` must reference an existing story slug. |
| **Hero meta bounds** | `heroMeta` | Array of 1–4 strings. Each string max 80 characters. |
| **Featured image** | `featuredImage` | Required. Must have non-empty `url` and `alt`. |
| **divider position** | `blocks` | A `divider` as the first or last block is stripped during save normalization. |
| **Consecutive dividers** | `blocks` | Two adjacent `divider` blocks are collapsed to one during save normalization. |
| **spacer size enum** | `spacer.size` | Must be one of: `"sm"`, `"md"`, `"lg"`. |
| **Schema version** | `schemaVersion` | Must be a positive integer. Backend rejects documents with a version higher than its supported maximum. |
| **Reading time** | `readingTimeMinutes` | Positive integer. If not provided, calculated server-side from word count (~200 words per minute). |
| **Timestamps** | `createdAt`, `updatedAt` | Set server-side. Not accepted from clients. `updatedAt` is always the current server time on save. |

---

## 7. Schema Version & Extensibility

### The `schemaVersion` Field

```json
{ "schemaVersion": 1, ... }
```

- Every story document carries `schemaVersion` at the root.
- The backend knows its maximum supported version. Documents with a higher version are rejected with a clear error.
- The Android app and web renderer also declare their maximum supported version. If they receive a story with a higher version, they degrade gracefully (skip unknown blocks, render what they can).

### How to Add a New Block Type (Zero Breaking Changes)

1. Add the new block type name to the backend's block type enum.
2. Add a validation function for its specific fields.
3. Add a React component in the admin panel.
4. Add a Composable in the Android app.
5. Old clients that don't know about the new type skip it silently.
6. Bump `schemaVersion` only if you change the structure of an **existing** type (renaming a field, changing a field's type). Adding new types does not require a version bump.

### Migration Strategy for Schema Changes

When an existing field changes (not adding a new type):

1. Write a migration script that reads all stories with `schemaVersion: N` and outputs `schemaVersion: N+1` documents.
2. Run the migration in a transaction. If it fails, roll back.
3. Deploy the new backend version that supports both `N` and `N+1`.
4. After all clients (Android app, web) are updated to support `N+1`, remove support for `N` from the backend.

**Breaking changes require a version bump. Additions do not.**

