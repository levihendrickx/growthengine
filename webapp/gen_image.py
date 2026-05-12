"""
gen_image.py — called by server.js to generate images via DALL-E 3.
Usage: py gen_image.py "<prompt>" <OPENAI_API_KEY>
Outputs JSON: {"b64": "<base64>"}  or  {"error": "<message>"}
"""
import sys
import json
import base64
from urllib.request import urlopen
from openai import OpenAI

if len(sys.argv) < 3:
    print(json.dumps({"error": "Usage: gen_image.py <prompt> <api_key>"}))
    sys.exit(1)

prompt  = sys.argv[1]
api_key = sys.argv[2]

try:
    client = OpenAI(api_key=api_key)

    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        n=1,
    )

    image_url  = response.data[0].url
    image_data = urlopen(image_url, timeout=30).read()
    b64        = base64.b64encode(image_data).decode("ascii")

    print(json.dumps({"b64": b64}))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
