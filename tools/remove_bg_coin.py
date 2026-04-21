from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageFilter


def _sample_bg(img: Image.Image) -> tuple[int, int, int]:
    """Sample background color from 4 corners (average)."""
    w, h = img.size
    pts = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    rs, gs, bs = 0, 0, 0
    for x, y in pts:
        r, g, b, _a = img.getpixel((x, y))
        rs += r
        gs += g
        bs += b
    n = len(pts)
    return rs // n, gs // n, bs // n


def _dist(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1, c2)))


def remove_background(
    input_path: Path,
    output_path: Path,
    *,
    tolerance: float,
    feather: float,
) -> None:
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    bg = _sample_bg(img)

    px = img.load()
    alpha = Image.new("L", (w, h), 255)
    a_px = alpha.load()

    # Create alpha mask based on distance from background color.
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            d = _dist((r, g, b), bg)
            if d <= tolerance:
                a_px[x, y] = 0
            else:
                # Soft transition in the band [tolerance, tolerance+feather]
                if feather > 0 and d < tolerance + feather:
                    t = (d - tolerance) / feather
                    a_px[x, y] = int(255 * t)

    if feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(radius=max(0.0, feather / 12.0)))

    img.putalpha(alpha)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "PNG")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("input", type=Path)
    p.add_argument("output", type=Path)
    p.add_argument("--tolerance", type=float, default=55.0)
    p.add_argument("--feather", type=float, default=45.0)
    args = p.parse_args()

    remove_background(args.input, args.output, tolerance=args.tolerance, feather=args.feather)


if __name__ == "__main__":
    main()

