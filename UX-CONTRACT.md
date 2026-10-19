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

## Processing and recovery

Files remain local. The extension fetches a selected remote image only after the user requests loading and grants site access; it does not automatically forward the image to WeryAI. Local settings use native controls, with platform-owned popup geometry and keyboard behavior.

The shared core compares output against the original input bytes. If conversion or resizing would make it larger, the original is returned and skipped constraints are explained. A result above the requested size says Target not reached. Errors remain distinct from successful downloads.

The comparison action is available only for a completed converted result. A modal dialog blocks background interaction, supports a labeled range control as an alternative to dragging, closes with Escape or Close, restores focus and releases the temporary output URL. Closing the view does not remove the file.

Removing a file or clearing the batch affects temporary browser state only. There is no permanent server deletion or paid action. Language switching remains confined to the other-tools page; compressor and extension controls are English.
