# make_small.py — 작업 흐름 카드용 작은 사진(-sm.webp) 만들기
# 사용법: 포트폴리오 폴더(C:\dev\portfolio)에서  py make_small.py
# - images/works 안의 모든 .webp에 대해 가로 960px 이하의 작은 사진을 만듦
# - 이미 있고 원본보다 최신이면 건너뜀 (사진을 새로 넣었을 때 다시 실행하면 됨)
# - 원본은 그대로 두고, 크게 보기(누르면 뜨는 화면)에서는 원본을 씀
# 처음 한 번 필요: py -m pip install pillow
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent / "images" / "works"
MAX_W = 960      # 카드에 보이는 폭(약 470px)의 2배 정도
QUALITY = 80

made = skipped = 0
saved = 0
for src in sorted(ROOT.rglob("*.webp")):
    if src.stem.endswith("-sm"):
        continue
    dst = src.with_name(src.stem + "-sm.webp")
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        skipped += 1
        continue
    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.width > MAX_W:
            h = round(im.height * MAX_W / im.width)
            im = im.resize((MAX_W, h), Image.LANCZOS)
        im.save(dst, "WEBP", quality=QUALITY, method=6)
    saved += src.stat().st_size - dst.stat().st_size
    made += 1
    print(f"만듦  {dst.relative_to(ROOT)}  ({src.stat().st_size // 1024} KB → {dst.stat().st_size // 1024} KB)")

print(f"\n완료: {made}개 만듦, {skipped}개 건너뜀, 줄어든 용량 약 {saved // 1024} KB")
