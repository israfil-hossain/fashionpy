export const STUDIO_RAIL_IMAGE_PROMPT = `Create a standard Studio Rail image set for the garment in the reference photo.

Output three separate square (1:1) images, 1024x1024 or larger:
1. Hanging view - the garment on a slim hanger or hook, hook touching the very top center of the frame, slight three-quarter angle.
2. Front view - the same garment flat, facing the camera, centered.
3. Back view - the same garment flat, showing the back, centered.

Rules for every image:
- One garment only. No model, mannequin, hands, props, floor, background scene or extra items.
- Transparent background with alpha. If transparency is not available, use a pure white (#FFFFFF) background.
- No drop shadow, gradient, border, watermark or added text. Keep only the printing or embroidery that belongs to the garment.
- The garment fills about 80% of the frame height with even margins. The hanger hook sits within the top 5% of the image.
- Keep identical scale, centering, lighting and colors across all three views.
- Realistic fabric texture and the exact colors of the reference garment, soft even studio light, sharp edges.
- Do not crop the garment and do not change its design.`

export const STUDIO_RAIL_PROMPT_STEPS = [
  {
    title: "Generate",
    body:
      "Open Gemini (Create images) or ChatGPT (image generation), attach the product photo, paste the prompt above and ask for three separate square images.",
  },
  {
    title: "Download",
    body:
      "Save the three PNGs. A pure white background is acceptable - the storefront removes it automatically.",
  },
  {
    title: "Upload",
    body: "Upload all three images to Product media on the product.",
  },
  {
    title: "Assign",
    body:
      "Turn on Show in studio rail below, then select: thumbnail = hanging view, front image = front view, back image = back view. Click Save.",
  },
  {
    title: "Check",
    body: "Open the storefront studio rail on desktop and mobile to confirm the hook sits on the steel bar.",
  },
]
