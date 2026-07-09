# Rebel Archives — Writing Studio

A personal, Reedsy-style book writing app. No accounts, no server, no build
step — your manuscripts are stored privately in your browser's localStorage.

## Run it

Open `index.html` in any modern browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Use it offline / install as an app

Opening `index.html` straight from a local folder works fully offline — the
app has zero network dependencies.

The app is also a PWA: when served over HTTPS or localhost, a service worker
caches the whole app on first visit, so it keeps working with no internet
connection, and your browser will offer **Install app** (address bar icon on
desktop Chrome/Edge, "Add to Home Screen" on mobile), which gives it its own
window and launcher icon like a native app. If you ever make this repo
public, it can be hosted on GitHub Pages as-is to get that experience from
any device.

Note that manuscripts are stored per browser *and* per origin: the installed
GitHub Pages app and a local `file://` copy each have their own separate
library. Use **Backup all** / **Import backup** to move books between them.

## Features

- **Library** — multiple books with colored spines, chapter/word counts, delete with confirm
- **Chapter editor** — clean serif WYSIWYG page: headings, bold/italic/underline/strikethrough, quotes, lists, scene breaks (`✳︎ ✳︎ ✳︎`), undo/redo
- **Chapters sidebar** — add, rename, delete, and drag-and-drop to reorder
- **Autosave** — every change is saved automatically (Ctrl+S forces a save)
- **Word counts & daily goal** — per-chapter and manuscript totals, plus a configurable daily writing goal with a progress bar
- **Focus mode** — hides all chrome for distraction-free writing (Esc to exit)
- **Light & dark themes**
- **Export** — download the whole book as styled HTML, Markdown, or plain text, or open a print-ready copy to save as PDF
- **Backup / import** — download all books as JSON and restore them on another machine
- **Clean paste** — pasted text is converted to plain paragraphs so outside formatting never pollutes the manuscript

## Where the data lives

Everything is kept under the `rebelArchives.studio.v1` key in localStorage for
the site's origin. Use **Backup all** in the library header regularly if the
work matters to you — clearing browser data clears the manuscripts too.
