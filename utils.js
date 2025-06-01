/**
 * Calculates the Euclidean distance between two RGB colors.
 * @param {{r: number, g: number, b: number}} rgb1 - The first color.
 * @param {{r: number, g: number, b: number}} rgb2 - The second color.
 * @returns {number} The distance between the two colors.
 */
export function colorDistance(rgb1, rgb2) {
    const rDiff = rgb1.r - rgb2.r;
    const gDiff = rgb1.g - rgb2.g;
    const bDiff = rgb1.b - rgb2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * Converts an RGB color object to a CSS rgb string.
 * @param {{r: number, g: number, b: number}} rgb - The color object.
 * @returns {string} CSS rgb string (e.g., "rgb(255, 0, 128)").
 */
export function rgbToCssString(rgb) {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

