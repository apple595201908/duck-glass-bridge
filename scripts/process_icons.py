import os
import shutil
from PIL import Image, ImageFilter
from collections import deque

def remove_outer_white_background(img_path, out_paths, threshold=238, edge_soften=True):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # 2D array for visited / background mask
    is_bg = [[False] * height for _ in range(width)]
    queue = deque()
    
    # Seed corners and borders if near white
    for x in range(width):
        for y in (0, height - 1):
            r, g, b, a = pixels[x, y]
            if min(r, g, b) >= threshold:
                queue.append((x, y))
                is_bg[x][y] = True
    for y in range(height):
        for x in (0, width - 1):
            if not is_bg[x][y]:
                r, g, b, a = pixels[x, y]
                if min(r, g, b) >= threshold:
                    queue.append((x, y))
                    is_bg[x][y] = True
                    
    # 4-direction BFS
    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    while queue:
        cx, cy = queue.popleft()
        for dx, dy in dirs:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height:
                if not is_bg[nx][ny]:
                    r, g, b, a = pixels[nx, ny]
                    # If this pixel is close to white, it belongs to background
                    if min(r, g, b) >= threshold:
                        is_bg[nx][ny] = True
                        queue.append((nx, ny))

    # Construct alpha mask
    # For soft edges, we can compute alpha for boundary
    for x in range(width):
        for y in range(height):
            if is_bg[x][y]:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                # Check if it has an adjacent bg pixel to do subtle defringe
                r, g, b, a = pixels[x, y]
                adj_bg = False
                for dx, dy in dirs:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height and is_bg[nx][ny]:
                        adj_bg = True
                        break
                if adj_bg and min(r, g, b) > 210:
                    # Calculate alpha transition
                    avg_v = (r + g + b) / 3.0
                    alpha = int(max(0, min(255, (255 - avg_v) * 3.5)))
                    pixels[x, y] = (r, g, b, alpha)

    # Save to all destination paths
    for p in out_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        img.save(p, "PNG")
        print(f"Saved: {p}")

items = [
    (
        r"C:\Users\user\.gemini\antigravity-ide\brain\372633ce-6860-4e65-86ac-6748921646aa\game_logo_badge_1789406154202.jpg",
        "game_logo_badge.png",
        240
    ),
    (
        r"C:\Users\user\.gemini\antigravity-ide\brain\372633ce-6860-4e65-86ac-6748921646aa\trophy_champion_1789406188598.jpg",
        "trophy_champion.png",
        240
    ),
    (
        r"C:\Users\user\.gemini\antigravity-ide\brain\372633ce-6860-4e65-86ac-6748921646aa\hazard_skull_emblem_1789406261335.jpg",
        "hazard_skull_emblem.png",
        238
    ),
]

src_dir = r"c:\Users\user\.gemini\antigravity-ide\scratch\iq-reasoning-lab-tw\duck-glass-bridge\src\assets"
pub_dir = r"c:\Users\user\.gemini\antigravity-ide\scratch\iq-reasoning-lab-tw\duck-glass-bridge\public\assets"

for src_path, fname, thresh in items:
    out_paths = [os.path.join(src_dir, fname), os.path.join(pub_dir, fname)]
    remove_outer_white_background(src_path, out_paths, threshold=thresh)

print("All icons cut out successfully!")
