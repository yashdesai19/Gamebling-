from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("input_png", type=Path)
    p.add_argument("output_ico", type=Path)
    args = p.parse_args()

    img = Image.open(args.input_png).convert("RGBA")
    args.output_ico.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.output_ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])


if __name__ == "__main__":
    main()

