# WeryAI Image Compressor (Chrome extension)

Compress JPG, PNG and WebP images without uploading them. Same engine as the [web version](https://weryaiexpertteam.github.io/browser-image-toolkit/).

- Click the toolbar icon to open the compressor in a tab.
- Right-click any image on a web page → **Compress image**.
- Right-click menu also links to WeryAI's online background remover and photo enhancer (opens their site; your image is not sent).

## Install from source

1. Run `scripts/build-extension.sh` from the repository root (copies the shared files in `assets/` into `extension/assets/`).
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the `extension/` folder.

## Permissions

| Permission | Why |
|---|---|
| `contextMenus` | Adds "Compress image" to the right-click menu on images. |
| optional host access | Asked only when you compress an image from a web page, and only for that site, so the extension can read the image file. |

No analytics, no remote code, no uploads. HEIC is not supported in the extension (the decoder would have to be bundled; see `THIRD_PARTY_NOTICES.md`). See [PRIVACY.md](PRIVACY.md).

## Publish

`scripts/build-extension.sh` writes `dist/weryai-image-compressor-<version>.zip`. Upload that file in the Chrome Web Store developer dashboard. Store copy: [STORE_LISTING.md](STORE_LISTING.md).
