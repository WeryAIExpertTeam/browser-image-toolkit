# WeryAI Image Compressor (Chrome extension)

Compress JPG, PNG and WebP images without uploading them. Same engine as the [web version](https://weryaiexpertteam.github.io/browser-image-toolkit/).

- Click the toolbar icon to open the compressor in a tab.
- Right-click any image on a web page → **Compress image**.
- Right-click menu also links to WeryAI's online background remover and photo enhancer (opens their site; your image is not sent).

## Install from source

1. Run `bash scripts/build-extension.sh` from the repository root (requires Bash, zip, unzip and shasum; copies shared files and the project license into the extension).
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the `extension/` folder.

## Install a ZIP locally

Unzip `weryai-image-compressor-1.0.0.zip` into a permanent folder first. In Chrome's **Load unpacked** picker, select the folder containing `manifest.json`, not the ZIP itself or its parent folder. This is an unpacked extension package, not a signed CRX or a Chrome Web Store installation.

Keep that folder in place. For an update, replace its contents with the new package and click **Reload** on the extension card. Files selected in the compressor are temporary; download any results you need before reloading.

The adjacent `.zip.sha256` file records the release checksum. On macOS or Linux, run `shasum -a 256 -c weryai-image-compressor-1.0.0.zip.sha256` in the directory containing both files.

中文：先解压 ZIP，再到 Chrome 的扩展程序页开启开发者模式，选择“加载已解压的扩展程序”，选中直接含有 `manifest.json` 的文件夹。保留这个文件夹；更新后在扩展卡片点“重新加载”。ZIP 本身不能直接拖入安装，也不是已上架版本。

## Permissions

| Permission | Why |
|---|---|
| `contextMenus` | Adds "Compress image" to the right-click menu on images. |
| optional host access | Asked only when you compress an image from a web page, and only for that site, so the extension can read the image file. |

Granted site access remains available until you revoke it in Chrome's extension details. Local files need no website permission. If a remote image is blocked, requires a login, or its format is unsupported, save a permitted copy and drop it into the compressor instead.

No analytics, no remote code, no uploads. HEIC is not supported in the extension (the decoder would have to be bundled; see `THIRD_PARTY_NOTICES.md`). See [PRIVACY.md](PRIVACY.md).

To prevent larger downloads, the original is returned if conversion or resizing would increase its byte size. In that case requested changes may be skipped and the result says **Original kept**. A target size is an attempt, not a guarantee; **Target not reached** means the result still exceeds it. GIF input is processed as a still image; use the original when you need to retain animation.

Project code is MIT-licensed; see [LICENSE](LICENSE). The packaged JSZip library retains its own MIT license and notice in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Publish

`bash scripts/build-extension.sh` writes the ZIP and SHA-256 checksum in `dist/`. Only runtime files, installation instructions, privacy policy and licenses are packaged. The repository's `STORE_LISTING.md` is authoring material and is excluded from the ZIP. Store submission is a separate manual step; this package is not a published store listing.
