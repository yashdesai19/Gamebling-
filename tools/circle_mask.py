from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageFilter


def circle_mask(input_path: Path, output_path: Path, *, feather: float) -> None:
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    cx, cy = w / 2.0, h / 2.0
    radius = min(w, h) * 0.47

    alpha = Image.new("L", (w, h), 0)
    a = alpha.load()

    for y in range(h):
        for x in range(w):
            d = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            if d <= radius:
                a[x, y] = 255
            elif feather > 0 and d <= radius + feather:
                t = 1.0 - (d - radius) / feather
                a[x, y] = int(255 * max(0.0, min(1.0, t)))

    if feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(radius=max(0.0, feather / 6.0)))

    img.putalpha(alpha)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "PNG")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("input", type=Path)
    p.add_argument("output", type=Path)
    p.add_argument("--feather", type=float, default=18.0)
    args = p.parse_args()
    circle_mask(args.input, args.output, feather=args.feather)


if __name__ == "__main__":
    main()

