"""
gen_image.py — generate ad image with text via gpt-image-1.

Usage:
    py gen_image.py "<prompt_json>" <OPENAI_API_KEY>

prompt_json fields:
    scene    - photographic scene description WITHOUT any text instructions
    headline - top-left large text (e.g. "CHOOSE ANY 3.")
    sub      - below headline (e.g. "SAVE €20")
    body     - mid-left smaller text block
    cta      - CTA button label (e.g. "BUILD YOUR BUNDLE")
    caption  - small text below CTA button
    brand    - {name, tone, palette, logo}

Legacy fallback: if prompt_json is a plain string (not valid JSON), it is used
as the raw prompt directly (backward compatibility with old callers).

Outputs JSON: {"b64": "<base64>"} or {"error": "<message>"}
"""
import sys
import json
import time
import re
from openai import OpenAI, RateLimitError

if len(sys.argv) < 3:
    print(json.dumps({"error": "Usage: gen_image.py <prompt_json> <api_key>"}))
    sys.exit(1)

raw_arg = sys.argv[1]
api_key = sys.argv[2]

# Parse structured or legacy plain-string prompt
try:
    p = json.loads(raw_arg)
    if isinstance(p, dict):
        structured = True
    else:
        structured = False
        plain_prompt = raw_arg
except (json.JSONDecodeError, ValueError):
    structured = False
    plain_prompt = raw_arg


def build_prompt(p):
    brand = p.get("brand") or {}
    brand_name    = brand.get("name",    "")
    brand_tone    = brand.get("tone",    "premium, warm, masculine")
    brand_palette = brand.get("palette", "warm browns, beige, dark brown text")
    brand_logo    = brand.get("logo",    "")

    headline = (p.get("headline") or "").strip()
    sub      = (p.get("sub")      or "").strip()
    body     = (p.get("body")     or "").strip()
    cta      = (p.get("cta")      or "").strip()
    caption  = (p.get("caption")  or "").strip()
    scene    = (p.get("scene")    or p.get("image_prompt") or "studio product photograph").strip()

    text_instructions = []
    if headline:
        text_instructions.append(f'- Top-left, large bold serif, dark brown: "{headline}"')
    if sub:
        text_instructions.append(f'- Below headline, lighter brown, serif: "{sub}"')
    if body:
        text_instructions.append(f'- Mid-left, small caps, dark text: "{body}"')
    if cta:
        text_instructions.append(f'- Bottom-center, beige rounded-pill button, dark brown text: "{cta}"')
    if caption:
        text_instructions.append(f'- Below the button, small white text: "{caption}"')

    text_block = ""
    if text_instructions:
        text_block = (
            "\n\nRENDER THE FOLLOWING TEXT INTO THE IMAGE, exact spelling, "
            "designer-level typography:\n" + "\n".join(text_instructions) +
            "\n\nRender every word above verbatim. NO Lorem Ipsum. NO placeholder text."
        )

    parts = [f"Premium lifestyle advertisement."]
    if brand_name:
        parts[0] = f"Premium lifestyle advertisement for {brand_name}."
    parts.append(f"\nSCENE: {scene}.")
    if brand_tone:
        parts.append(f"Tone: {brand_tone}.")
    if brand_palette:
        parts.append(f"Colour palette: {brand_palette}.")
    if brand_logo:
        parts.append(brand_logo + ".")
    parts.append(text_block)
    parts.append(
        "\nStyle: editorial product photography, soft natural lighting, "
        "designed ad layout. NO watermarks."
    )

    return " ".join(filter(None, parts))


client = OpenAI(api_key=api_key)
MAX_RETRIES = 4

prompt = build_prompt(p) if structured else plain_prompt

for attempt in range(MAX_RETRIES):
    try:
        response = client.images.generate(
            model="gpt-image-2",
            prompt=prompt,
            size="1024x1024",
            quality="medium",
            n=1,
        )
        b64 = response.data[0].b64_json
        print(json.dumps({"b64": b64}))
        sys.exit(0)

    except RateLimitError as e:
        if attempt == MAX_RETRIES - 1:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)
        match = re.search(r'try again in (\d+(?:\.\d+)?)s', str(e))
        wait = float(match.group(1)) + 2 if match else 15
        time.sleep(wait)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
