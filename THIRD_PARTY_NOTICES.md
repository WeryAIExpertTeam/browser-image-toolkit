# Third-party notices

The project's MIT license does not relicense third-party libraries.

## JSZip 3.10.1

`assets/jszip.min.js` is the unmodified JSZip browser distribution, used under its MIT option (upstream offers MIT or GPLv3).

- Source: https://github.com/Stuk/jszip/tree/v3.10.1
- Original license: [assets/JSZIP-LICENSE.txt](assets/JSZIP-LICENSE.txt)
- Distribution: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

The Chrome extension in `extension/` bundles a copy of JSZip (`extension/assets/jszip.min.js`) with the same license file. It does not include heic2any.

## heic2any 0.0.4 (loaded on demand, not bundled)

The HEIC conversion feature loads the pinned browser decoder from jsDelivr. The heic2any wrapper has an MIT license; its bundled libheif decoder has LGPL obligations and associated third-party components. The wrapper license alone does not cover the complete bundle.

- Wrapper source and license: https://github.com/alexcorvi/heic2any
- Upstream discussion of embedded decoder licensing: https://github.com/alexcorvi/heic2any/issues/59
- libheif source and license: https://github.com/strukturag/libheif
- Distribution: https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js

Before redistributing the HEIC decoder (for example in a browser extension), review and retain its complete corresponding source, version-specific notices and required licenses. It is not included as MIT-licensed project code here.
