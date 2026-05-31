"""
DEPRECATED: logic ported to server.js (buildEditPrompt + direct Node OpenAI SDK call). This file is no longer invoked.

gen_image_edit.py — variation of an existing ad image via gpt-image-1 image edit.

Usage:
    py gen_image_edit.py "<prompt_json>" "<reference_image_path>" <OPENAI_API_KEY>

prompt_json fields: same as gen_image.py (scene, headline, sub, body, cta, caption, brand).

Outputs JSON: {"b64": "<base64>"} or {"error": "<message>"}
"""
import sys
import json
import time
import re
from openai import OpenAI, RateLimitError

if len(sys.argv) < 4:
    print(json.dumps({"error": "Usage: gen_image_edit.py <prompt_json> <ref_path> <api_key>"}))
    sys.exit(1)

raw_arg  = sys.argv[1]
ref_path = sys.argv[2]
api_key  = sys.argv[3]

try:
    p = json.loads(raw_arg)
    if not isinstance(p, dict):
        raise ValueError("prompt_json must be a JSON object")
except (json.JSONDecodeError, ValueError) as e:
    print(json.dumps({"error": f"Invalid prompt_json: {e}"}))
    sys.exit(1)


def build_prompt(p):
    brand = p.get("brand") or {}
    brand_name    = brand.get("name",    "")
    brand_tone    = brand.get("tone",    "premium, warm, masculine")
    brand_palette = brand.get("palette", "warm browns, beige, dark brown text")

    headline = (p.get("headline") or "").strip()
    sub      = (p.get("sub")      or "").strip()
    body     = (p.get("body")     or "").strip()
    cta      = (p.get("cta")      or "").strip()
    caption  = (p.get("caption")  or "").strip()

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

    brand_line = f"Brand: {brand_name} ({brand_tone})." if brand_name else f"Tone: {brand_tone}."

    return (
        "Create a variation of this advertisement. Keep the overall composition, "
        "product placement, and lighting of the source image. "
        f"Colour palette: {brand_palette}. "
        f"{brand_line}"
        f"{text_block}\n\n"
        "Style: editorial product photography, soft natural lighting, designed ad layout. "
        "NO watermarks."
    )


client = OpenAI(api_key=api_key)
MAX_RETRIES = 4
prompt = build_prompt(p)

for attempt in range(MAX_RETRIES):
    try:
        with open(ref_path, "rb") as f:
            response = client.images.edit(
                model="gpt-image-2",
                image=f,
                prompt=prompt,
                size="1024x1024",
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
