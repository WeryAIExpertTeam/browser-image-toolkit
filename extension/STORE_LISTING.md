# Chrome Web Store listing (copy)

**Name:** WeryAI Image Compressor
**Summary (≤132 chars):** Compress JPG, PNG and WebP locally in batches. Optionally send a right-clicked image to WeryAI's AI photo editor.
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

Privacy: compression runs on your device without uploading images. Choosing "Edit photo with AI" passes that one image to WeryAI's website. No analytics or browsing history are collected.

Need AI edits too? Right-click an image and choose "Edit photo with AI" to open WeryAI's AI photo editor with the image ready to edit.

Open source (MIT): https://github.com/WeryAIExpertTeam/browser-image-toolkit

## Permission justifications (dashboard fields)

- **contextMenus:** adds a "Compress image" item to the right-click menu on images.
- **Optional host permissions (http://*/* and https://*/*):** requested when the user compresses a web image, or sends one to the AI editor and direct reading is blocked, for that source site only. Not requested at install time.
- **scripting + host permission for https://www.wery.ai/*:** when the user chooses "Edit photo with AI", puts that image into the upload box of WeryAI's photo editor page. Not used on any other site.
- **Remote code:** none. All scripts are packaged in the extension.
- **Data usage:** the extension does not collect user data. An image is passed to www.wery.ai only when the user explicitly chooses "Edit photo with AI".

## Screenshots to prepare (1280×800)

1. Compressor tab with a batch of results and the "−65%" summary.
2. Right-click menu on a web image showing "Compress image".
3. "More options" open (format, max size, target KB).
