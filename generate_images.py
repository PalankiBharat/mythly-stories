#!/usr/bin/env python3
"""Generate images for Mythly Stories using Google Gemini native image generation."""

import json
import os
import sys
import base64
import requests

# Load OAuth credentials
CREDS_PATH = os.path.expanduser("~/.gemini/oauth_creds.json")

def refresh_access_token():
    """Get a fresh access token using the refresh token."""
    with open(CREDS_PATH) as f:
        creds = json.load(f)

    # Use refresh token to get fresh access token
    resp = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": "681255809395-oo8ft2oprdrn9e3aqf6av3hmdib135j.apps.googleusercontent.com",
        "refresh_token": creds["refresh_token"],
        "grant_type": "refresh_token",
    })
    if resp.status_code != 200:
        print(f"Error refreshing token: {resp.text}")
        sys.exit(1)

    token_data = resp.json()
    return token_data["access_token"]


def generate_image(prompt: str, output_path: str, access_token: str):
    """Generate an image using Gemini's native image generation."""

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "contents": [{
            "parts": [{"text": f"Generate this image: {prompt}"}]
        }],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
        }
    }

    print(f"  Generating: {os.path.basename(output_path)}...")
    resp = requests.post(url, headers=headers, json=payload, timeout=120)

    if resp.status_code != 200:
        print(f"  Error ({resp.status_code}): {resp.text[:200]}")
        return False

    data = resp.json()

    # Extract image from response
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "inlineData" in part:
                img_data = part["inlineData"]
                mime = img_data.get("mimeType", "image/png")
                ext = "png" if "png" in mime else "jpg" if "jpeg" in mime or "jpg" in mime else "webp"

                # Update extension if needed
                base, _ = os.path.splitext(output_path)
                final_path = f"{base}.{ext}"

                img_bytes = base64.b64decode(img_data["data"])
                with open(final_path, "wb") as f:
                    f.write(img_bytes)

                size_kb = len(img_bytes) / 1024
                print(f"  ✓ Saved: {final_path} ({size_kb:.0f} KB)")
                return True

    print(f"  ✗ No image in response")
    return False


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 generate_images.py <output_path> <prompt>")
        sys.exit(1)

    output_path = sys.argv[1]
    prompt = sys.argv[2]

    print("Refreshing access token...")
    token = refresh_access_token()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    success = generate_image(prompt, output_path, token)

    sys.exit(0 if success else 1)
