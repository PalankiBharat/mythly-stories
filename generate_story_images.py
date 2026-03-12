#!/usr/bin/env python3
"""
Mythly Stories — Image Generator v2
Reads .txt prompt files (or HTML comment prompts) from each story's images/
folder and generates actual images using OpenRouter's Gemini 3.1 Flash Image
Preview model.

Usage:
    python3 generate_story_images.py              # generate all missing images
    python3 generate_story_images.py --force      # regenerate even existing ones
    python3 generate_story_images.py --story the-boy-who-refused-to-leave-deaths-house
    python3 generate_story_images.py --dry-run    # preview what would be generated
"""

import sys
import re
import json
import base64
import time
import argparse
from pathlib import Path

# ─────────────────────────────────────────────────────────────
# 🔑  OPENROUTER API KEY
OPENROUTER_API_KEY = "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"
# ─────────────────────────────────────────────────────────────

MODEL      = "google/gemini-3.1-flash-image-preview"
API_URL    = "https://openrouter.ai/api/v1/chat/completions"
STORIES_DIR = Path(__file__).parent / "stories"
RATE_LIMIT_DELAY = 3   # seconds between successful API calls
MAX_RETRIES      = 3   # attempts per image before giving up

# Per-slot config: output filename → aspect ratio for image_config
SLOT_CONFIG = {
    "featured": "3:4",
    "img1":     "1:1",
    "img2":     "1:1",
}


# ──────────────────────────── dependency check ───────────────────────────────

try:
    import requests
except ImportError:
    print("❌  Missing dependency: requests")
    print("    Install it with:  pip install requests")
    sys.exit(1)


# ──────────────────────────── prompt loading ─────────────────────────────────

def load_prompt_from_files(images_dir: Path, slot: str) -> str | None:
    """
    Load the generation prompt for a slot from .txt files.
    Prefers <slot>-prompt.txt (more detailed) over <slot>.txt.
    """
    for filename in [f"{slot}-prompt.txt", f"{slot}.txt"]:
        p = images_dir / filename
        if p.exists():
            text = p.read_text(encoding="utf-8").strip()
            if text:
                return text
    return None


def load_prompts_from_html(html_path: Path) -> dict[str, str]:
    """
    Fallback: extract image prompts embedded as HTML comments.
    Used for stories that have no .txt prompt files (hanuman-and-bhima,
    the-guru-who-taught).

    Matches comments like:
      <!-- FEATURE IMAGE PROMPT: ...text... -->
      <!-- IMAGE PROMPT 1: ...text... -->
      <!-- IMAGE PROMPT 2: ...text... -->
    """
    if not html_path.exists():
        return {}

    text = html_path.read_text(encoding="utf-8")
    patterns = {
        "featured": r"<!-- FEATURE IMAGE PROMPT:\s*(.*?)\s*-->",
        "img1":     r"<!-- IMAGE PROMPT 1:\s*(.*?)\s*-->",
        "img2":     r"<!-- IMAGE PROMPT 2:\s*(.*?)\s*-->",
    }
    result = {}
    for slot, pattern in patterns.items():
        m = re.search(pattern, text, re.DOTALL)
        if m:
            result[slot] = m.group(1).strip()
    return result


def collect_prompts(story_dir: Path) -> dict[str, str]:
    """
    Return a dict of {slot: prompt_text} for a story.
    Tries .txt files first; falls back to HTML comment extraction.
    """
    images_dir = story_dir / "images"
    prompts: dict[str, str] = {}

    for slot in SLOT_CONFIG:
        p = load_prompt_from_files(images_dir, slot)
        if p:
            prompts[slot] = p

    # If no .txt files at all, try HTML fallback
    if not prompts:
        html_path = story_dir / "index.html"
        prompts = load_prompts_from_html(html_path)

    return prompts


# ──────────────────────────── API call ───────────────────────────────────────

def call_api(prompt: str, aspect_ratio: str) -> bytes:
    """
    Call the OpenRouter image generation API.

    Key parameters:
      - modalities: ["text", "image"]  → required to get image output
      - image_config.aspect_ratio      → "3:4" or "1:1"

    Returns raw image bytes (PNG).
    Retries up to MAX_RETRIES times with exponential backoff.
    """
    payload = {
        "model": MODEL,
        "modalities": ["text", "image"],
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt}
                ],
            }
        ],
        "image_config": {
            "aspect_ratio": aspect_ratio,
        },
    }

    headers = {
        "Authorization":  f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":   "application/json",
        "HTTP-Referer":   "https://github.com/PalankiBharat/mythly-stories",
        "X-Title":        "Mythly Stories",
    }

    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=120)
            resp.raise_for_status()
            return _extract_image(resp.json())
        except Exception as exc:
            last_error = exc
            if attempt < MAX_RETRIES:
                wait = 2 ** attempt  # 2s, then 4s
                print(f"    ↩ Retry {attempt}/{MAX_RETRIES - 1} in {wait}s — {exc}")
                time.sleep(wait)

    raise RuntimeError(f"All {MAX_RETRIES} attempts failed") from last_error


def _extract_image(data: dict) -> bytes:
    """
    Parse the OpenRouter response and return raw image bytes.

    OpenRouter returns image data in one of these locations:
      1. choices[0].message.images[0].image_url.url  (primary — data URI)
      2. choices[0].message.content[]  where part.type == "image_url"  (fallback)
      3. choices[0].message.content[]  where part.type == "inline_data" (Gemini native)
    """
    choices = data.get("choices", [])
    if not choices:
        raise ValueError(f"No choices in response:\n{json.dumps(data, indent=2)}")

    message = choices[0].get("message", {})

    # ── Path 1: message.images[] ──────────────────────────────────────────────
    images = message.get("images", [])
    if images:
        url = images[0].get("image_url", {}).get("url", "")
        if url.startswith("data:"):
            return base64.b64decode(url.split(",", 1)[1])

    # ── Path 2 & 3: message.content as list of parts ─────────────────────────
    content = message.get("content", "")
    if isinstance(content, list):
        for part in content:
            if not isinstance(part, dict):
                continue
            ptype = part.get("type", "")

            if ptype == "image_url":
                url = part.get("image_url", {}).get("url", "")
                if url.startswith("data:"):
                    return base64.b64decode(url.split(",", 1)[1])

            if ptype == "inline_data":
                return base64.b64decode(part["inline_data"]["data"])

    # ── Path 4: content is a data-URI string ─────────────────────────────────
    if isinstance(content, str) and content.startswith("data:"):
        return base64.b64decode(content.split(",", 1)[1])

    raise ValueError(
        f"Could not find image data in response.\n"
        f"Full response:\n{json.dumps(data, indent=2)}"
    )


# ──────────────────────────── per-story processing ───────────────────────────

def process_story(
    story_dir: Path,
    story_index: int,
    total_stories: int,
    force: bool = False,
    dry_run: bool = False,
) -> tuple[int, int, int]:
    """
    Generate images for one story.
    Returns (generated_count, skipped_count, error_count).
    """
    name = story_dir.name
    images_dir = story_dir / "images"
    generated = skipped = errors = 0

    print(f"\n[{story_index}/{total_stories}] {name}")

    prompts = collect_prompts(story_dir)
    if not prompts:
        print("  ~ no prompts found — skipping")
        return 0, 0, 0

    for slot, aspect in SLOT_CONFIG.items():
        prompt = prompts.get(slot)
        if not prompt:
            print(f"  ~ {slot}.png — no prompt, skipping")
            skipped += 1
            continue

        out_png = images_dir / f"{slot}.png"
        if out_png.exists() and not force:
            print(f"  ~ {slot}.png — already exists, skipping")
            skipped += 1
            continue

        if dry_run:
            print(f"  [dry-run] would generate {slot}.png ({aspect})")
            continue

        print(f"  ⏳ {slot}.png ({aspect}) ...", end="", flush=True)

        try:
            image_bytes = call_api(prompt, aspect)
            out_png.write_bytes(image_bytes)
            size_kb = len(image_bytes) // 1024
            print(f"\r  ✓  {slot}.png saved — {size_kb:,} KB")
            generated += 1
            time.sleep(RATE_LIMIT_DELAY)
        except Exception as exc:
            print(f"\r  ✗  {slot}.png FAILED — {exc}")
            errors += 1

    return generated, skipped, errors


# ──────────────────────────── main ───────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Mythly Stories — generate images from .txt prompts via OpenRouter"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate images that already exist",
    )
    parser.add_argument(
        "--story",
        metavar="FOLDER_NAME",
        help="Process only this story folder (e.g. the-boy-who-refused-to-leave-deaths-house)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be generated without calling the API",
    )
    args = parser.parse_args()

    if not dry_run_mode(args):
        if OPENROUTER_API_KEY.startswith("YOUR_API"):
            print("❌  No API key set.")
            print("    Open generate_story_images.py and set OPENROUTER_API_KEY.")
            sys.exit(1)

    # Build list of story directories to process
    all_dirs = sorted(d for d in STORIES_DIR.iterdir() if d.is_dir() and not d.name.startswith("."))

    if args.story:
        story_dirs = [d for d in all_dirs if d.name == args.story]
        if not story_dirs:
            print(f"❌  Story not found: {args.story}")
            print(f"    Available stories: {', '.join(d.name for d in all_dirs)}")
            sys.exit(1)
    else:
        story_dirs = all_dirs

    # Count how many have prompts (to show accurate total)
    processable = [d for d in story_dirs if collect_prompts(d)]

    print("Mythly Stories — Image Generator v2")
    print(f"Model  : {MODEL}")
    print(f"Stories: {len(processable)} with prompts ({len(processable) * 3} images max)")
    if args.force:
        print("Mode   : force (regenerate existing)")
    elif args.dry_run:
        print("Mode   : dry-run (no API calls)")
    else:
        print("Mode   : generate missing only")
    print("═" * 60)

    total_gen = total_skip = total_err = 0

    for i, story_dir in enumerate(story_dirs, start=1):
        if not collect_prompts(story_dir):
            print(f"\n[{i}/{len(story_dirs)}] {story_dir.name} — no prompts, skipping")
            continue

        gen, skip, err = process_story(
            story_dir,
            story_index=i,
            total_stories=len(story_dirs),
            force=args.force,
            dry_run=args.dry_run,
        )
        total_gen  += gen
        total_skip += skip
        total_err  += err

    print("\n" + "═" * 60)
    if args.dry_run:
        print("Dry-run complete — no images were generated.")
    else:
        print(f"Done.  Generated: {total_gen}   Skipped: {total_skip}   Errors: {total_err}")
        if total_err:
            print(f"⚠  {total_err} image(s) failed. Re-run to retry them.")


def dry_run_mode(args: argparse.Namespace) -> bool:
    return getattr(args, "dry_run", False)


if __name__ == "__main__":
    main()
