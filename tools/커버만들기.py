# -*- coding: utf-8 -*-
"""
브랜드 색상에 맞춘 임시 커버 이미지를 한 번에 만든다.

실제 제품 사진이 준비되기 전까지 화면이 비어 보이지 않게 하는 용도다.
나중에 같은 파일명으로 실제 사진을 덮어쓰면 코드는 손댈 필요가 없다.

쓰는 법
    python3 tools/커버만들기.py

설정은 tools/커버목록.json 에서 바꾼다.
필요 패키지: pillow  (설치: pip install pillow)
"""
import json
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("pillow 가 없습니다.  pip install pillow  을 먼저 실행하세요.")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "public", "images")
CONF = os.path.join(HERE, "커버목록.json")

# 한글이 들어가므로 CJK 폰트가 필요하다. 없으면 첫 번째로 찾은 것을 쓴다.
FONT_CANDIDATES = [
    ("/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc", 1),
    ("/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf", 0),
    ("C:/Windows/Fonts/malgunbd.ttf", 0),
    ("/System/Library/Fonts/AppleSDGothicNeo.ttc", 0),
]
FONT_CANDIDATES_R = [
    ("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 1),
    ("/usr/share/fonts/truetype/nanum/NanumGothic.ttf", 0),
    ("C:/Windows/Fonts/malgun.ttf", 0),
    ("/System/Library/Fonts/AppleSDGothicNeo.ttc", 0),
]


def find_font(cands):
    for path, idx in cands:
        if os.path.exists(path):
            return path, idx
    sys.exit("한글 폰트를 찾지 못했습니다. FONT_CANDIDATES 에 폰트 경로를 추가하세요.")


FB, FBI = find_font(FONT_CANDIDATES)
FR, FRI = find_font(FONT_CANDIDATES_R)
bold = lambda s: ImageFont.truetype(FB, s, index=FBI)
reg = lambda s: ImageFont.truetype(FR, s, index=FRI)


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def gradient(w, h, c1, c2):
    img = Image.new("RGB", (w, h), c1)
    d = ImageDraw.Draw(img)
    steps = w + h
    for i in range(0, steps, 4):
        d.line([(i - h, 0), (i, h)], fill=mix(c1, c2, i / steps), width=5)
    return img


def blobs(img, seed):
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    w, h = img.size
    r = seed or 7
    for i in range(6):
        r = (r * 1103515245 + 12345) % (2 ** 31)
        cx = r % w
        r = (r * 1103515245 + 12345) % (2 ** 31)
        cy = r % h
        rad = int(min(w, h) * (0.18 + (i % 3) * 0.12))
        d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(255, 255, 255, 26))
    return Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")


def wrap(d, text, font, maxw):
    lines, cur = [], ""
    for ch in text:
        cur += ch
        if d.textlength(cur, font=font) > maxw:
            lines.append(cur[:-1])
            cur = ch
    if cur:
        lines.append(cur)
    return lines


def make_cover(path, title, sub, c1, c2, w=1200, h=675, tsize=62):
    img = blobs(gradient(w, h, c1, c2), sum(ord(x) for x in os.path.basename(path)))
    d = ImageDraw.Draw(img)
    ft, fs = bold(tsize), reg(30)
    lines = wrap(d, title, ft, w - 200)
    total = len(lines) * int(tsize * 1.35) + (46 if sub else 0)
    y = (h - total) // 2
    for ln in lines:
        d.text(((w - d.textlength(ln, font=ft)) // 2, y), ln, font=ft, fill=(255, 255, 255))
        y += int(tsize * 1.35)
    if sub:
        d.text(((w - d.textlength(sub, font=fs)) // 2, y + 6), sub, font=fs, fill=(236, 245, 242))
    img.save(path, quality=88)
    print("  ", os.path.basename(path))


def make_og(path, name, tagline, c1, c2):
    w, h = 1200, 630
    img = blobs(gradient(w, h, mix(c1, (0, 0, 0), 0.35), c1), 99)
    d = ImageDraw.Draw(img)
    d.rectangle([90, 208, 190, 214], fill=c2)
    d.text((90, 248), name, font=bold(70), fill=(255, 255, 255))
    d.text((94, 348), tagline, font=reg(32), fill=(226, 238, 234))
    img.save(path)
    print("  ", os.path.basename(path))


def make_hero(path, c1, c2):
    a, b = "#%02x%02x%02x" % mix(c1, (255, 255, 255), 0.88), "#%02x%02x%02x" % mix(c1, (255, 255, 255), 0.55)
    line = "#%02x%02x%02x" % c1
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" width="1600" height="600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{a}"/><stop offset="100%" stop-color="{b}"/>
    </linearGradient>
    <radialGradient id="s" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="600" fill="url(#g)"/>
  <circle cx="1240" cy="180" r="300" fill="url(#s)"/>
  <circle cx="1460" cy="440" r="220" fill="url(#s)"/>
  <g fill="none" stroke="{line}" stroke-opacity="0.16" stroke-width="2">
    <path d="M980 600 C1060 430 1180 470 1240 300 C1290 160 1420 190 1470 60"/>
    <path d="M1060 600 C1140 440 1260 480 1320 320 C1370 190 1500 215 1550 100"/>
    <path d="M900 600 C980 420 1100 460 1160 280 C1210 140 1340 165 1390 30"/>
  </g>
</svg>'''
    open(path, "w", encoding="utf-8").write(svg)
    print("  ", os.path.basename(path))


def main():
    conf = json.load(open(CONF, encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    c1 = hex2rgb(conf.get("brandColor", "#1f6f5c"))
    c2 = hex2rgb(conf.get("brandColor2", "#4fb094"))
    print("이미지를 만듭니다 →", OUT)
    for item in conf.get("covers", []):
        tone = item.get("tone", 0.0)  # 0~1, 커버마다 색을 조금씩 다르게
        a = mix(c1, c2, tone * 0.5)
        b = mix(c2, (255, 255, 255), tone * 0.25)
        make_cover(os.path.join(OUT, item["file"]), item["title"], item.get("sub", ""), a, b)
    make_og(os.path.join(OUT, "og-default.png"), conf.get("siteName", ""), conf.get("tagline", ""), c1, c2)
    make_hero(os.path.join(OUT, "hero.svg"), c1, c2)
    print("끝났습니다. 실제 사진이 준비되면 같은 파일명으로 덮어쓰세요.")


if __name__ == "__main__":
    main()
