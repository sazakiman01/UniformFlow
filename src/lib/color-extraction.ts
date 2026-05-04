export interface ExtractedColor {
  hex: string;
  rgb: [number, number, number];
}

/**
 * Extract dominant colors from an image using Canvas API
 * @param imageElement - HTMLImageElement or HTMLCanvasElement
 * @param colorCount - Number of colors to extract (default: 5)
 * @returns Array of extracted colors with HEX and RGB values
 */
export async function extractColors(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  colorCount: number = 5
): Promise<ExtractedColor[]> {
  try {
    // Wait for image to load if it's an image element
    if (imageElement instanceof HTMLImageElement && !imageElement.complete) {
      await new Promise((resolve, reject) => {
        imageElement.onload = resolve;
        imageElement.onerror = reject;
      });
    }

    // Create canvas to analyze pixels
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("ไม่สามารถสร้าง canvas ได้");
    }

    // Set canvas size (resize for performance)
    const maxSize = 150;
    const scale = Math.min(maxSize / imageElement.width, maxSize / imageElement.height, 1);
    canvas.width = imageElement.width * scale;
    canvas.height = imageElement.height * scale;

    // Draw image to canvas
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Extract colors using quantization
    const colorMap = new Map<string, { rgb: [number, number, number]; count: number }>();

    // Sample pixels (every 5th pixel for performance)
    for (let i = 0; i < pixels.length; i += 20) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // Skip transparent or very light/dark pixels
      if (a < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) {
        continue;
      }

      // Quantize colors (round to nearest 10 to group similar colors)
      const qr = Math.round(r / 10) * 10;
      const qg = Math.round(g / 10) * 10;
      const qb = Math.round(b / 10) * 10;

      const key = `${qr},${qg},${qb}`;
      const existing = colorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, { rgb: [qr, qg, qb] as [number, number, number], count: 1 });
      }
    }

    // Sort by frequency and get top colors
    const sortedColors = Array.from(colorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, colorCount);

    // Convert to ExtractedColor format
    const colors: ExtractedColor[] = sortedColors.map((c) => ({
      hex: rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]),
      rgb: c.rgb,
    }));

    return colors;
  } catch (error) {
    console.error("Error extracting colors:", error);
    throw new Error("ไม่สามารถวิเคราะห์สีจากรูปได้ กรุณาลองรูปอื่น");
  }
}

/**
 * Extract dominant color (single color)
 */
export async function extractDominantColor(
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<ExtractedColor> {
  const colors = await extractColors(imageElement, 1);
  return colors[0];
}

/**
 * Convert RGB to HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

/**
 * Get color at a specific pixel position
 * @param imageElement - HTMLImageElement or HTMLCanvasElement
 * @param x - X coordinate relative to the displayed image
 * @param y - Y coordinate relative to the displayed image
 * @param displayWidth - Displayed width of the image
 * @param displayHeight - Displayed height of the image
 * @param canvasCache - Optional cached canvas for performance
 * @returns HEX color code at the specified position
 */
export function getColorAtPixel(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number,
  displayWidth: number,
  displayHeight: number,
  canvasCache?: HTMLCanvasElement
): string {
  const canvas = canvasCache || document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("ไม่สามารถสร้าง canvas ได้");
  }

  // Use actual image dimensions
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  ctx.drawImage(imageElement, 0, 0);

  // Calculate the actual rendered dimensions (accounting for object-contain)
  const imageAspect = imageElement.width / imageElement.height;
  const displayAspect = displayWidth / displayHeight;
  
  let renderedWidth, renderedHeight, offsetX, offsetY;
  
  if (imageAspect > displayAspect) {
    // Image is wider than display area - constrained by width
    renderedWidth = displayWidth;
    renderedHeight = displayWidth / imageAspect;
    offsetX = 0;
    offsetY = (displayHeight - renderedHeight) / 2;
  } else {
    // Image is taller than display area - constrained by height
    renderedHeight = displayHeight;
    renderedWidth = displayHeight * imageAspect;
    offsetX = (displayWidth - renderedWidth) / 2;
    offsetY = 0;
  }
  
  // Calculate actual position in the original image
  const relativeX = x - offsetX;
  const relativeY = y - offsetY;
  
  // Check if click is within the actual image area
  if (relativeX < 0 || relativeX > renderedWidth || relativeY < 0 || relativeY > renderedHeight) {
    // Return a default color or handle gracefully
    return "#000000";
  }
  
  const scaleX = imageElement.width / renderedWidth;
  const scaleY = imageElement.height / renderedHeight;
  const actualX = Math.floor(relativeX * scaleX);
  const actualY = Math.floor(relativeY * scaleY);

  // Get pixel data at the position
  const imageData = ctx.getImageData(actualX, actualY, 1, 1);
  const [r, g, b] = imageData.data;

  return rgbToHex(r, g, b);
}

/**
 * Load image from file
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
