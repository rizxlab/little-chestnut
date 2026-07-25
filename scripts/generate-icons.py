from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
FONT_PATH = "/System/Library/Fonts/Supplemental/Songti.ttc"


def create_icon(size: int) -> None:
    image = Image.new("RGB", (size, size), "#f6f1e7")
    draw = ImageDraw.Draw(image)

    padding = int(size * 0.11)
    draw.rounded_rectangle(
        (padding, padding, size - padding, size - padding),
        radius=int(size * 0.22),
        fill="#743b23",
    )

    font = ImageFont.truetype(FONT_PATH, int(size * 0.48))
    text = "栗"
    bounds = draw.textbbox((0, 0), text, font=font)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    draw.text(
        ((size - width) / 2, (size - height) / 2 - bounds[1] - size * 0.015),
        text,
        font=font,
        fill="#fff9ec",
    )

    image.save(ROOT / "public" / f"icon-{size}.png", optimize=True)


for icon_size in (192, 512):
    create_icon(icon_size)
