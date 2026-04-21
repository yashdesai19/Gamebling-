from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageFilter


def chroma_key_blue(input_path: Path, output_path: Path, *, feather: float) -> None:
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    px = img.load()

    alpha = Image.new("L", (w, h), 255)
    a = alpha.load()

    # Heuristic: treat bluish pixels as background.
    # Keep warm/gold pixels (high R+G, relatively low B).
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]

            # Background tends to have blue channel dominant.
            blue_strength = b - max(r, g)
            warm_strength = (r + g) / 2 - b

            if blue_strength > 18 and warm_strength < 35:
                a[x, y] = 0
            else:
                # Soft edge for near-threshold pixels
                if blue_strength > 8 and warm_strength < 55:
                    # map into [0..255]
                    t = max(0.0, min(1.0, (blue_strength - 8) / 16.0))
                    a[x, y] = int(255 * (1.0 - t))

    if feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(radius=feather))

    img.putalpha(alpha)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "PNG")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("input", type=Path)
    p.add_argument("output", type=Path)
    p.add_argument("--feather", type=float, default=1.2)
    args = p.parse_args()
    chroma_key_blue(args.input, args.output, feather=args.feather)


if __name__ == "__main__":
    main()

