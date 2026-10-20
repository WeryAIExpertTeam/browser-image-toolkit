# Image-tool interaction contract

Visual identity and runtime theme ownership are defined in [DESIGN.md](DESIGN.md). The local-processing behavior is documented in README.md and extension/PRIVACY.md. These static tools have no account system, shared records, remote save or CRUD lifecycle.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Existing native select elements | DESIGN.md and tools.html | native platform popup | Keyboard selection and current value |
| Form | Compressor.build and existing tool fields | assets/compressor.js, assets/toolkit.js | file picker, drop, paste, numeric settings | File import, processing, invalid-file feedback |
| Scrollbar | Shared document styles | assets/compressor.css and tools shell styles | normal document, modal content | Narrow viewport and visible overflow |
| Toast | Existing compressor flash and per-file result rows | assets/compressor.js | routine message, persistent row result | Unsupported file and processing states |
| Comparison | Compressor.compare | assets/compressor.js | native modal dialog | Pointer drag, range keyboard, Escape, focus restoration |
| Send to editor | Right-click "Edit photo with AI (WeryAI)" | extension/background.js, extension/handoff.js, extension/app.js | readable image goes straight to the editor; blocked image shows a focused AI permission screen with local compressor controls hidden | Editor tab opens with the image in its upload box (blob preview appears); permission screen identifies the source and WeryAI destination |
| Theme | Extension theme button | extension/theme.js and shared CSS tokens | Auto follows the browser; Light / Dark override | Cycle Auto → Light → Dark; reload preserves the local choice |

## Processing and recovery

Compression files remain local. For right-click compression, the extension reads the selected remote image after the user requests loading and grants site access. The separate "Edit photo with AI" action reads that one selected image and places it in WeryAI's editor; blocked sources first show a site-access card. Other WeryAI links only navigate. Local settings use native controls, with platform-owned popup geometry and keyboard behavior.

The shared core compares output against the original input bytes. If conversion or resizing would make it larger, the original is returned and skipped constraints are explained. A result above the requested size says Target not reached. Errors remain distinct from successful downloads.

The comparison action is available only for a completed converted result. A modal dialog blocks background interaction, supports a labeled range control as an alternative to dragging, closes with Escape or Close, restores focus and releases the temporary output URL. Closing the view does not remove the file.

Removing a file or clearing the batch affects temporary browser state only. There is no permanent server deletion or paid action. Language switching remains confined to the other-tools page; compressor and extension controls are English.
