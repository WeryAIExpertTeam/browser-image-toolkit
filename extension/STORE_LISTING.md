# Chrome Web Store listing (copy)

**Name:** WeryAI Image Compressor
**Summary (≤132 chars):** Compress JPG, PNG and WebP in your browser. Batch files, target size, right-click any image. Nothing is uploaded.
**Category:** Tools (or Photos)
**Language:** English
**Website:** https://www.wery.ai/
**Privacy policy URL:** https://github.com/WeryAIExpertTeam/browser-image-toolkit/blob/main/extension/PRIVACY.md

## Description

Make images smaller without sending them anywhere.

WeryAI Image Compressor shrinks JPG, PNG and WebP files right in your browser. Drop in one photo or a few hundred, and download the results one by one or as a ZIP.

• Right-click any image on a web page and choose "Compress image"
• Three levels: High quality, Balanced, Smallest
• Smart format: PNG screenshots are tried as WebP and JPEG and the smallest wins; transparency is kept
• Target size: set a size in KB and the tool tries lower quality, then smaller dimensions, and marks files that still exceed your target
• Resize to a max width or height
• Never returns a bigger file: if an image is already optimized, you get the original back
• Batch compression with parallel workers
• Works offline. No account, no watermark, no limits

Privacy: images are processed on your device and never uploaded. The extension collects no data.

Need AI edits too? The right-click menu links to WeryAI's background remover and AI photo editor.

Open source (MIT): https://github.com/WeryAIExpertTeam/browser-image-toolkit

## Permission justifications (dashboard fields)

- **contextMenus:** adds a "Compress image" item to the right-click menu on images.
- **Optional host permissions (http://*/* and https://*/*):** requested at the moment the user compresses an image from a web page, for that site only, so the extension can fetch the image file the user clicked. Not requested at install time.
- **Remote code:** none. All scripts are packaged in the extension.
- **Data usage:** the extension does not collect or transmit user data.

## Screenshots to prepare (1280×800)

1. Compressor tab with a batch of results and the "−65%" summary.
2. Right-click menu on a web image showing "Compress image".
3. "More options" open (format, max size, target KB).
