const COMMON_RULES = `Rules for the single image:
- Output exactly one image containing one single view.
- Square (1:1) PNG, 1024x1024 or larger, with an alpha channel. Every pixel outside the garment and hanger is empty and fully transparent (alpha = 0).
- Only the garment and its hanger are visible. Nothing is behind them.
- The garment fills about 80% of the frame height with even margins.
- Keep the exact colors, print, embroidery and design of the reference garment. Realistic fabric texture, soft even studio light, sharp edges.
- Keep the whole garment uncropped and unchanged.`

export const STUDIO_RAIL_IMAGE_PROMPTS = [
  {
    key: "side",
    title: "85-degree side image",
    prompt: `Create one standard Studio Rail hanging image of the garment in the reference photo.

View: exactly 85 degrees from straight-on, so the side of the garment is visible with a small part of the front. The garment hangs naturally with a relaxed drape.

Hardware: a plain wooden hanger with a straight top edge and a thin metal rod rising perfectly vertically from its center to the very top of the image. The rod is a straight line - no curved hook, no loop, no bend.

${COMMON_RULES}`,
  },
  {
    key: "front",
    title: "Front image",
    prompt: `Create one standard Studio Rail front image of the garment in the reference photo.

View: straight-on front, garment flat and facing the camera, centered, showing the full front print and pockets.

Hardware: the same plain wooden hanger with a straight top edge and a thin metal rod rising perfectly vertically from its center to the very top of the image. The rod is a straight line - no curved hook, no loop, no bend.

${COMMON_RULES}`,
  },
  {
    key: "back",
    title: "Back image",
    prompt: `Create one standard Studio Rail back image of the garment in the reference photo.

View: straight-on back, garment flat and centered, showing the entire back panel and seams.

Hardware: the same plain wooden hanger with a straight top edge and a thin metal rod rising perfectly vertically from its center to the very top of the image. The rod is a straight line - no curved hook, no loop, no bend.

${COMMON_RULES}`,
  },
] as const

export const STUDIO_RAIL_PROMPT_STEPS = [
  {
    title: "Generate",
    body:
      "Use the 85-degree, front and back prompts one at a time with the product photo. Generate three separate transparent PNG files - never one image containing all three views.",
  },
  {
    title: "Download",
    body:
      "Open each PNG in an image editor. A checkerboard shown by the editor is a normal transparency preview; a checkerboard saved inside the file is not. Place the image on a white page - if the grid stays visible or the background is white or solid, regenerate that image.",
  },
  {
    title: "Upload",
    body: "Upload the three PNG files to Product media on the product.",
  },
  {
    title: "Assign",
    body:
      "Turn on Show in studio rail, then select: thumbnail = 85-degree side, front image = front, back image = back. Click Save.",
  },
  {
    title: "Check",
    body:
      "Open the storefront studio rail on desktop and mobile to confirm the rod is straight, the background is gone and the garment hangs on the steel bar.",
  },
]
