import sys
from PIL import Image
import collections

def get_dominant_colors(image_path, num_colors=5):
    try:
        img = Image.open(image_path)
        img = img.convert('RGBA')
        img.thumbnail((100, 100))
        
        # Filter out transparent pixels
        pixels = [p for p in img.getdata() if p[3] > 0]
        
        counts = collections.Counter(pixels)
        colors = counts.most_common(num_colors)
        
        print("Dominant colors in RGB:")
        for color, count in colors:
            hex_color = '#%02x%02x%02x' % color[:3]
            print(f"{hex_color} (Count: {count})")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_dominant_colors(sys.argv[1])
