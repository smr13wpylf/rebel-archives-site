/* ============================================================
   Rebel Archives — Writing Studio
   A personal, Reedsy-style book editor. All data stays in
   this browser via localStorage.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'rebelArchives.studio.v1';
  var SAVE_DEBOUNCE_MS = 700;

  var SPINE_COLORS = ['#b3502d', '#4a6d8c', '#4a8f5c', '#8c6d4a', '#7a5c8c', '#a8783c', '#5c8c8a', '#8c4a5e'];

  /* ---------------- State ---------------- */

  var db = blankDB();
  var currentBookId = null;
  var currentChapterId = null;
  var saveTimer = null;
  var dirty = false;

  /* ---------------- Storage ----------------
     Manuscripts (and now cover art and inline images) live in IndexedDB:
     localStorage caps out around 5 MB, and hitting that cap used to break
     saving. localStorage is still read once, to migrate older libraries. */

  var DB_NAME = 'rebelArchives';
  var STORE = 'state';
  var idb = null;
  var storageFailed = false;
  var writeChain = Promise.resolve();

  function openIDB() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('IndexedDB blocked')); };
    });
  }

  function idbGet(key) {
    return new Promise(function (resolve, reject) {
      var tx = idb.transaction(STORE, 'readonly');
      var req = tx.objectStore(STORE).get(key);
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbPut(key, value) {
    return new Promise(function (resolve, reject) {
      var tx = idb.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error || new Error('write aborted')); };
    });
  }

  function blankDB() {
    return { version: 1, settings: { theme: null }, books: [] };
  }

  function legacyLoad() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.books)) return parsed;
      }
    } catch (e) { /* corrupted or unavailable: start fresh */ }
    return null;
  }

  function load() {
    return openIDB().then(function (conn) {
      idb = conn;
      return idbGet('db');
    }).then(function (stored) {
      if (stored && Array.isArray(stored.books)) return stored;
      var legacy = legacyLoad();
      if (legacy) {
        // One-time migration; the old copy stays put as a safety net.
        return idbPut('db', legacy).then(function () { return legacy; })
          .catch(function () { return legacy; });
      }
      return blankDB();
    }).catch(function () {
      // No IndexedDB (private mode, locked-down browser): fall back to
      // localStorage so the app still works, just with less room.
      idb = null;
      return legacyLoad() || blankDB();
    });
  }

  function reportStorageFailure(err) {
    if (storageFailed) return;
    storageFailed = true;
    setSaveStatus('Not saved', false, true);
    alert('Your writing could not be saved to this device (' + (err && err.name ? err.name : 'storage error') + ').\n\n' +
      'Nothing typed so far is lost — it is still open here. Use "Backup all" in the library ' +
      'to download a copy right now, then reload the app.');
  }

  /* Writes are queued so a slow save can never overlap or clobber a newer one. */
  function persist() {
    var snapshot = JSON.parse(JSON.stringify(db));
    writeChain = writeChain.then(function () {
      if (idb) return idbPut('db', snapshot);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    }).then(function () {
      if (storageFailed) { storageFailed = false; setSaveStatus('Saved'); }
    }).catch(function (err) {
      reportStorageFailure(err);
    });
    return writeChain;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getBook(id) {
    for (var i = 0; i < db.books.length; i++) if (db.books[i].id === id) return db.books[i];
    return null;
  }

  function getChapter(book, id) {
    if (!book) return null;
    for (var i = 0; i < book.chapters.length; i++) if (book.chapters[i].id === id) return book.chapters[i];
    return null;
  }

  function newChapter(title) {
    return { id: uid(), title: title || '', content: '' };
  }

  function newBook() {
    var book = {
      id: uid(),
      title: 'Untitled book',
      author: '',
      spine: SPINE_COLORS[db.books.length % SPINE_COLORS.length],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      goalWords: 500,
      notePlacement: 'foot',
      dailyProgress: {},
      lastTotalWords: 0,
      chapters: [newChapter('Chapter 1')]
    };
    db.books.push(book);
    persist();
    return book;
  }

  /* ---------------- Word counting ---------------- */

  function countWordsInText(text) {
    var t = (text || '').trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
  }

  function countWordsInHTML(html) {
    if (!html) return 0;
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    // Block elements need separating whitespace so "…end</p><p>Start…" isn't one word.
    var blocks = tmp.querySelectorAll('p,h1,h2,h3,blockquote,li,br,div');
    for (var i = 0; i < blocks.length; i++) blocks[i].insertAdjacentText('beforeend', ' ');
    return countWordsInText(tmp.textContent);
  }

  function bookTotalWords(book) {
    var total = 0;
    for (var i = 0; i < book.chapters.length; i++) total += countWordsInHTML(book.chapters[i].content);
    return total;
  }

  /* ---------------- DOM handles ---------------- */

  var $ = function (sel) { return document.querySelector(sel); };

  var viewLibrary = $('#view-library');
  var viewEditor = $('#view-editor');
  var bookGrid = $('#book-grid');
  var chapterList = $('#chapter-list');
  var editor = $('#editor');
  var chapterTitleInput = $('#chapter-title-input');
  var bookTitleInput = $('#book-title-input');
  var bookAuthorInput = $('#book-author-input');
  var saveStatus = $('#save-status');
  var goalFill = $('#goal-fill');
  var goalText = $('#goal-text');
  var bookTotalEl = $('#book-total-words');
  var chapterWordsEl = $('#chapter-words');
  var sessionWordsEl = $('#session-words');
  var blockSelect = $('#block-select');
  var notesPanel = $('#notes-panel');
  var notePlacement = $('#note-placement');

  /* ---------------- Theme ---------------- */

  function applyTheme() {
    var theme = db.settings.theme;
    if (!theme) {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    db.settings.theme = (cur === 'dark') ? 'light' : 'dark';
    persist();
    applyTheme();
  }

  /* ---------------- Routing ---------------- */

  function route() {
    var hash = location.hash || '#/';
    var m = hash.match(/^#\/book\/([^/]+)/);
    if (m && getBook(m[1])) {
      showEditor(m[1]);
    } else {
      showLibrary();
    }
  }

  function showLibrary() {
    flushSave();
    currentBookId = null;
    currentChapterId = null;
    document.body.classList.remove('focus-mode');
    $('#btn-exit-focus').hidden = true;
    viewEditor.hidden = true;
    viewLibrary.hidden = false;
    renderLibrary();
  }

  function showEditor(bookId) {
    var book = getBook(bookId);
    currentBookId = bookId;
    viewLibrary.hidden = true;
    viewEditor.hidden = false;
    bookTitleInput.value = book.title;
    bookAuthorInput.value = book.author || '';
    notePlacement.value = notePlacementOf(book);
    if (!book.chapters.length) book.chapters.push(newChapter('Chapter 1'));
    selectChapter(book.chapters[0].id, true);
    renderChapterList();
    updateCounters();
  }

  /* ---------------- Library rendering ---------------- */

  function renderLibrary() {
    bookGrid.innerHTML = '';

    db.books.forEach(function (book) {
      var card = document.createElement('div');
      card.className = 'book-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');

      var cover = document.createElement('div');
      cover.className = 'book-cover' + (book.cover ? '' : ' book-cover-blank');
      if (book.cover) {
        var img = document.createElement('img');
        img.src = book.cover;
        img.alt = '';
        cover.appendChild(img);
      } else {
        var placeholder = document.createElement('span');
        placeholder.className = 'book-cover-letter';
        placeholder.textContent = (book.title || 'U').trim().charAt(0).toUpperCase();
        cover.appendChild(placeholder);
      }

      var coverBtn = document.createElement('button');
      coverBtn.className = 'book-cover-btn';
      coverBtn.textContent = book.cover ? 'Change cover' : 'Add cover';
      coverBtn.title = book.cover ? 'Replace or remove this cover' : 'Choose a cover image';
      coverBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        chooseCover(book);
      });
      cover.appendChild(coverBtn);
      card.appendChild(cover);

      var body = document.createElement('div');
      body.className = 'book-card-body';

      var title = document.createElement('h2');
      title.className = 'book-card-title';
      title.textContent = book.title || 'Untitled book';
      body.appendChild(title);

      var author = document.createElement('p');
      author.className = 'book-card-author';
      author.textContent = book.author ? 'by ' + book.author : ' ';
      body.appendChild(author);

      var meta = document.createElement('div');
      meta.className = 'book-card-meta';
      var words = bookTotalWords(book);
      meta.textContent = book.chapters.length + (book.chapters.length === 1 ? ' chapter · ' : ' chapters · ') +
        words.toLocaleString() + ' words';
      var updated = document.createElement('div');
      updated.textContent = 'Edited ' + new Date(book.updatedAt).toLocaleDateString();
      meta.appendChild(updated);
      body.appendChild(meta);

      card.appendChild(body);

      var del = document.createElement('button');
      del.className = 'book-card-delete';
      del.title = 'Delete book';
      del.textContent = '🗑';
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        var name = book.title || 'Untitled book';
        if (confirm('Delete "' + name + '" and all its chapters? This cannot be undone.')) {
          db.books = db.books.filter(function (b) { return b.id !== book.id; });
          persist();
          renderLibrary();
        }
      });
      card.appendChild(del);

      function open() { location.hash = '#/book/' + book.id; }
      card.addEventListener('click', open);
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

      bookGrid.appendChild(card);
    });

    var add = document.createElement('button');
    add.className = 'book-card book-card-new';
    add.innerHTML = '<span class="plus">＋</span><span>New book</span>';
    add.addEventListener('click', function () {
      var book = newBook();
      location.hash = '#/book/' + book.id;
    });
    bookGrid.appendChild(add);
  }

  /* ---------------- Notes (footnotes / endnotes) ----------------
     A note is a superscript marker carrying its own text, so the note can
     never drift away from the sentence it belongs to: cut, paste, reorder
     or delete the passage and the note goes with it. Numbers are display
     only and get recomputed, so they are always in reading order. */

  function noteMarkers(root) {
    return Array.prototype.slice.call((root || editor).querySelectorAll('sup.note-ref'));
  }

  function renumberNotes() {
    noteMarkers().forEach(function (el, i) {
      var n = String(i + 1);
      if (el.textContent !== n) el.textContent = n;
      el.setAttribute('contenteditable', 'false');
    });
  }

  function makeMarker(text) {
    var sup = document.createElement('sup');
    sup.className = 'note-ref';
    sup.setAttribute('contenteditable', 'false');
    sup.dataset.note = text;
    sup.textContent = '1';
    return sup;
  }

  /* Notes get a real editing panel rather than a one-line prompt: they run
     long, and punctuation is fiddly to fix in a box you cannot see. */
  var noteModal = $('#note-modal');
  var noteModalText = $('#note-modal-text');
  var noteModalTitle = $('#note-modal-title');
  var noteModalDelete = $('#note-modal-delete');
  var noteSession = null;

  function openNoteEditor(opts) {
    noteSession = opts;
    noteModalTitle.textContent = opts.title;
    noteModalText.value = opts.text || '';
    noteModalDelete.hidden = !opts.onDelete;
    noteModal.hidden = false;
    noteModalText.focus();
    // Caret at the end, so an existing note is ready to amend, not replace.
    var end = noteModalText.value.length;
    noteModalText.setSelectionRange(end, end);
  }

  function closeNoteEditor() {
    noteModal.hidden = true;
    noteSession = null;
    editor.focus();
  }

  function saveNoteEditor() {
    if (!noteSession) return;
    var text = noteModalText.value.trim();
    var session = noteSession;
    closeNoteEditor();
    if (!text) {
      if (session.onDelete) session.onDelete();
      return;
    }
    session.onSave(text);
  }

  $('#note-modal-save').addEventListener('click', saveNoteEditor);
  $('#note-modal-cancel').addEventListener('click', closeNoteEditor);
  noteModalDelete.addEventListener('click', function () {
    var session = noteSession;
    closeNoteEditor();
    if (session && session.onDelete) session.onDelete();
  });
  noteModal.addEventListener('mousedown', function (e) {
    if (e.target === noteModal) closeNoteEditor(); // click the backdrop
  });
  noteModalText.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); closeNoteEditor(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveNoteEditor(); }
  });

  function insertNote() {
    if (!noteModal.hidden) return;
    openNoteEditor({
      title: 'New note',
      text: '',
      onSave: placeNote
    });
  }

  function placeNote(text) {
    editor.focus();
    var sel = window.getSelection();
    var marker = makeMarker(text);
    if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
      var range = sel.getRangeAt(0);
      range.collapse(false); // notes attach after the selection, like a citation
      range.insertNode(marker);
      range.setStartAfter(marker);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editor.appendChild(marker);
    }
    afterNoteChange();
  }

  function editNote(marker) {
    openNoteEditor({
      title: 'Edit note',
      text: marker.dataset.note || '',
      onSave: function (text) {
        marker.dataset.note = text;
        afterNoteChange();
      },
      onDelete: function () {
        marker.remove();
        afterNoteChange();
      }
    });
  }

  function afterNoteChange() {
    renumberNotes();
    renderNotesPanel();
    scheduleSave();
    updateCounters();
  }

  /* The notes for the open chapter, shown under the page as they will read. */
  function renderNotesPanel() {
    var markers = noteMarkers();
    notesPanel.innerHTML = '';
    notesPanel.hidden = markers.length === 0;
    if (!markers.length) return;

    var heading = document.createElement('div');
    heading.className = 'notes-panel-title';
    heading.textContent = 'Notes';
    notesPanel.appendChild(heading);

    markers.forEach(function (marker, i) {
      var row = document.createElement('div');
      row.className = 'note-row';

      var num = document.createElement('span');
      num.className = 'note-num';
      num.textContent = (i + 1) + '.';
      row.appendChild(num);

      var body = document.createElement('button');
      body.className = 'note-text';
      body.type = 'button';
      body.textContent = marker.dataset.note || '';
      body.title = 'Edit this note';
      body.addEventListener('click', function () { editNote(marker); });
      row.appendChild(body);

      notesPanel.appendChild(row);
    });
  }

  /* Reduce pasted markup to the small set of tags this editor uses, so a
     round trip through the clipboard cannot inject anything unexpected. */
  var ALLOWED_TAGS = {
    P: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, STRIKE: 1, DEL: 1,
    H1: 1, H2: 1, H3: 1, BLOCKQUOTE: 1, UL: 1, OL: 1, LI: 1, HR: 1, SUP: 1, IMG: 1
  };

  function sanitizeEditorHTML(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('script,style,meta,link,iframe,object,embed').forEach(function (el) { el.remove(); });

    Array.prototype.slice.call(tmp.querySelectorAll('*')).forEach(function (el) {
      if (!ALLOWED_TAGS[el.tagName]) {
        // Keep the words, drop the wrapper.
        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
        el.remove();
        return;
      }
      var isNote = el.tagName === 'SUP' && el.classList.contains('note-ref');
      var src = el.tagName === 'IMG' ? el.getAttribute('src') : null;
      var note = isNote ? el.dataset.note : null;

      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        el.removeAttribute(attr.name);
      });
      if (isNote) {
        el.className = 'note-ref';
        el.setAttribute('contenteditable', 'false');
        el.dataset.note = note || '';
      }
      if (src && /^data:image\//.test(src)) el.setAttribute('src', src);
      else if (el.tagName === 'IMG') el.remove();
    });
    return tmp.innerHTML;
  }

  editor.addEventListener('click', function (e) {
    var marker = e.target.closest && e.target.closest('sup.note-ref');
    if (marker) {
      e.preventDefault();
      editNote(marker);
    }
  });

  /* ---------------- Narrow-screen sidebar ---------------- */

  function narrowLayout() {
    return window.matchMedia && window.matchMedia('(max-width: 860px)').matches;
  }

  function closeSidebar() {
    viewEditor.classList.remove('sidebar-open');
  }

  /* ---------------- Images ----------------
     Photos straight off a phone are several megabytes each, so everything is
     re-encoded down to a sane size before it is stored. */

  function readImageFile(file, maxW, maxH, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('not an image')); return; }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('could not read the file')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('that image could not be opened')); };
        img.onload = function () {
          var scale = Math.min(1, maxW / img.width, maxH / img.height);
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          // PNG transparency would turn black on a JPEG, so paint the page colour first.
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          try {
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (e) {
            reject(new Error('that image could not be converted'));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function pickImage() {
    return new Promise(function (resolve) {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        input.remove();
        resolve(file || null);
      });
      input.click();
    });
  }

  function chooseCover(book) {
    if (book.cover && !confirm('Replace the cover for "' + (book.title || 'this book') + '"?\n\n' +
        'Choose Cancel to remove the current cover instead.')) {
      delete book.cover;
      book.updatedAt = Date.now();
      persist();
      renderLibrary();
      return;
    }
    pickImage().then(function (file) {
      if (!file) return;
      return readImageFile(file, 600, 900, 0.82).then(function (dataUrl) {
        book.cover = dataUrl;
        book.updatedAt = Date.now();
        persist();
        renderLibrary();
      });
    }).catch(function (err) {
      alert('Could not use that image: ' + err.message);
    });
  }

  function insertImage() {
    pickImage().then(function (file) {
      if (!file) return;
      return readImageFile(file, 1400, 1400, 0.85).then(function (dataUrl) {
        editor.focus();
        document.execCommand('insertHTML', false, '<img src="' + dataUrl + '" alt="">');
        scheduleSave();
        updateCounters();
      });
    }).catch(function (err) {
      alert('Could not insert that image: ' + err.message);
    });
  }

  /* ---------------- Chapter list ---------------- */

  function renderChapterList() {
    var book = getBook(currentBookId);
    if (!book) return;
    chapterList.innerHTML = '';

    book.chapters.forEach(function (ch, index) {
      var item = document.createElement('div');
      item.className = 'chapter-item' + (ch.id === currentChapterId ? ' active' : '');
      item.draggable = true;
      item.dataset.id = ch.id;

      var grip = document.createElement('span');
      grip.className = 'chapter-grip';
      grip.textContent = '⠿';
      item.appendChild(grip);

      var name = document.createElement('span');
      name.className = 'chapter-name';
      name.textContent = ch.title || 'Chapter ' + (index + 1);
      item.appendChild(name);

      var words = document.createElement('span');
      words.className = 'chapter-words';
      words.textContent = countWordsInHTML(ch.content).toLocaleString();
      item.appendChild(words);

      var del = document.createElement('button');
      del.className = 'chapter-delete';
      del.title = 'Delete chapter';
      del.textContent = '✕';
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteChapter(ch.id);
      });
      item.appendChild(del);

      item.addEventListener('click', function () {
        if (ch.id !== currentChapterId) selectChapter(ch.id);
      });

      /* drag & drop reordering */
      item.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', ch.id);
        e.dataTransfer.effectAllowed = 'move';
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', function () { item.classList.remove('dragging'); });
      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', function () { item.classList.remove('drag-over'); });
      item.addEventListener('drop', function (e) {
        e.preventDefault();
        item.classList.remove('drag-over');
        var draggedId = e.dataTransfer.getData('text/plain');
        if (!draggedId || draggedId === ch.id) return;
        var from = book.chapters.findIndex(function (c) { return c.id === draggedId; });
        var to = book.chapters.findIndex(function (c) { return c.id === ch.id; });
        if (from < 0 || to < 0) return;
        var moved = book.chapters.splice(from, 1)[0];
        book.chapters.splice(to, 0, moved);
        book.updatedAt = Date.now();
        persist();
        renderChapterList();
      });

      chapterList.appendChild(item);
    });
  }

  function selectChapter(id, skipFlush) {
    if (!skipFlush) flushSave();
    var book = getBook(currentBookId);
    var ch = getChapter(book, id);
    if (!ch) return;
    currentChapterId = id;
    chapterTitleInput.value = ch.title;
    editor.innerHTML = ch.content || '';
    renumberNotes();
    renderNotesPanel();
    renderChapterList();
    updateCounters();
    setSaveStatus('Saved');
    // On a narrow screen the sidebar sits over the page: picking a chapter
    // means you want to read it, so get out of the way.
    if (narrowLayout()) closeSidebar();
  }

  function addChapter() {
    flushSave();
    var book = getBook(currentBookId);
    if (!book) return;
    var ch = newChapter('Chapter ' + (book.chapters.length + 1));
    book.chapters.push(ch);
    book.updatedAt = Date.now();
    persist();
    selectChapter(ch.id, true);
    chapterTitleInput.focus();
    chapterTitleInput.select();
  }

  function deleteChapter(id) {
    var book = getBook(currentBookId);
    if (!book) return;
    var ch = getChapter(book, id);
    var hasContent = ch && (countWordsInHTML(ch.content) > 0);
    if (hasContent && !confirm('Delete "' + (ch.title || 'this chapter') + '"? Its text will be lost.')) return;

    var idx = book.chapters.findIndex(function (c) { return c.id === id; });
    book.chapters.splice(idx, 1);
    if (!book.chapters.length) book.chapters.push(newChapter('Chapter 1'));
    book.updatedAt = Date.now();
    persist();

    if (id === currentChapterId) {
      var next = book.chapters[Math.min(idx, book.chapters.length - 1)];
      selectChapter(next.id, true);
    } else {
      renderChapterList();
    }
    updateCounters();
  }

  /* ---------------- Saving ---------------- */

  function setSaveStatus(text, saving, failed) {
    saveStatus.textContent = text;
    saveStatus.classList.toggle('saving', !!saving);
    saveStatus.classList.toggle('failed', !!failed);
  }

  function scheduleSave() {
    dirty = true;
    if (!storageFailed) setSaveStatus('Saving…', true);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }

  /* Nothing in here may leave the status stuck on "Saving…" or the sidebar
     stale, however the write itself turns out. */
  function flushSave() {
    try {
      commitEdits();
    } finally {
      renderChapterList();
      updateCounters();
      if (!storageFailed) setSaveStatus('Saved');
    }
  }

  function commitEdits() {
    clearTimeout(saveTimer);
    if (!dirty) return;
    renumberNotes();
    dirty = false;
    var book = getBook(currentBookId);
    if (!book) return;
    var ch = getChapter(book, currentChapterId);
    if (ch) {
      ch.title = chapterTitleInput.value;
      ch.content = editor.innerHTML;
    }
    book.title = bookTitleInput.value;
    book.author = bookAuthorInput.value;
    book.updatedAt = Date.now();

    /* daily progress: only additions count toward the goal */
    var total = bookTotalWords(book);
    var delta = total - (book.lastTotalWords || 0);
    if (delta > 0) {
      var key = todayKey();
      book.dailyProgress[key] = (book.dailyProgress[key] || 0) + delta;
    }
    book.lastTotalWords = total;

    persist();
  }

  function updateCounters() {
    var book = getBook(currentBookId);
    if (!book) return;

    var chapterWords = countWordsInHTML(editor.innerHTML);
    chapterWordsEl.textContent = chapterWords.toLocaleString() + ' words in chapter';

    var total = bookTotalWords(book);
    // While editing, the stored chapter lags the live editor; adjust with the live count.
    var storedCh = getChapter(book, currentChapterId);
    if (storedCh) total = total - countWordsInHTML(storedCh.content) + chapterWords;
    bookTotalEl.textContent = total.toLocaleString() + ' words in manuscript';

    var doneToday = book.dailyProgress[todayKey()] || 0;
    var liveDelta = total - (book.lastTotalWords || 0);
    if (liveDelta > 0) doneToday += liveDelta;
    var goal = book.goalWords || 500;
    var pct = Math.min(100, Math.round((doneToday / goal) * 100));
    goalFill.style.width = pct + '%';
    goalFill.classList.toggle('done', doneToday >= goal);
    goalText.textContent = doneToday.toLocaleString() + ' / ' + goal.toLocaleString() + ' words' + (doneToday >= goal ? ' — goal met! 🎉' : '');
    sessionWordsEl.textContent = doneToday.toLocaleString() + ' words today';
  }

  /* ---------------- Formatting toolbar ---------------- */

  function exec(cmd, value) {
    editor.focus();
    document.execCommand(cmd, false, value || null);
    scheduleSave();
    refreshToolbarState();
  }

  document.querySelectorAll('.tbtn[data-cmd]').forEach(function (btn) {
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep selection
    btn.addEventListener('click', function () { exec(btn.dataset.cmd); });
  });

  blockSelect.addEventListener('change', function () {
    exec('formatBlock', '<' + blockSelect.value + '>');
  });

  $('#btn-note').addEventListener('mousedown', function (e) { e.preventDefault(); });
  $('#btn-note').addEventListener('click', insertNote);

  notePlacement.addEventListener('change', function () {
    var book = getBook(currentBookId);
    if (!book) return;
    book.notePlacement = notePlacement.value;
    book.updatedAt = Date.now();
    persist();
  });

  $('#btn-image').addEventListener('mousedown', function (e) { e.preventDefault(); });
  $('#btn-image').addEventListener('click', insertImage);

  $('#btn-scene-break').addEventListener('mousedown', function (e) { e.preventDefault(); });
  $('#btn-scene-break').addEventListener('click', function () {
    exec('insertHorizontalRule');
  });

  function refreshToolbarState() {
    if (viewEditor.hidden) return;
    ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'].forEach(function (cmd) {
      var btn = document.querySelector('.tbtn[data-cmd="' + cmd + '"]');
      if (!btn) return;
      var on = false;
      try { on = document.queryCommandState(cmd); } catch (e) { /* unsupported */ }
      btn.classList.toggle('active', on);
    });
    var block = '';
    try { block = (document.queryCommandValue('formatBlock') || '').toUpperCase(); } catch (e) { /* unsupported */ }
    if (block === 'H1' || block === 'H2' || block === 'BLOCKQUOTE') blockSelect.value = block;
    else blockSelect.value = 'P';
  }

  document.addEventListener('selectionchange', function () {
    if (document.activeElement === editor) refreshToolbarState();
  });

  /* ---------------- Editor events ---------------- */

  editor.addEventListener('input', function () {
    scheduleSave();
    updateCounters();
  });

  /* ---- Markdown paste support ----
     Pasted Markdown is converted to the editor's rich formatting on the
     spot, so it lands already rendered instead of as raw #/** markup. */

  function looksLikeMarkdown(text) {
    return /(^|\n)\s{0,3}(#{1,6}\s|>\s|[-*+]\s\S|\d+[.)]\s\S)/.test(text) ||
      /\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~/.test(text) ||
      /(^|\n)\s*(-{3,}|_{3,}|(\*\s*){3,})\s*(\n|$)/.test(text);
  }

  function mdInline(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML
      .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
      .replace(/__([^_\n]+)__/g, '<b>$1</b>')
      .replace(/~~([^~\n]+)~~/g, '<s>$1</s>')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<i>$2</i>')
      .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<i>$2</i>');
  }

  function markdownToHtml(text) {
    var html = [], para = [], quote = [], listType = null, listItems = [];
    function flushPara() {
      if (para.length) { html.push('<p>' + mdInline(para.join(' ')) + '</p>'); para = []; }
    }
    function flushList() {
      if (listItems.length) {
        html.push('<' + listType + '>' + listItems.map(function (li) {
          return '<li>' + mdInline(li) + '</li>';
        }).join('') + '</' + listType + '>');
        listItems = [];
      }
      listType = null;
    }
    function flushQuote() {
      if (quote.length) { html.push('<blockquote>' + mdInline(quote.join(' ')) + '</blockquote>'); quote = []; }
    }
    function flushAll() { flushPara(); flushList(); flushQuote(); }

    text.split(/\r?\n/).forEach(function (line) {
      var t = line.trim(), m;
      if (!t) { flushAll(); return; }
      if (/^(-{3,}|_{3,}|(\*\s*){3,})$/.test(t)) { flushAll(); html.push('<hr>'); return; }
      if ((m = t.match(/^(#{1,6})\s+(.*)$/))) {
        flushAll();
        var tag = m[1].length === 1 ? 'h1' : 'h2';
        html.push('<' + tag + '>' + mdInline(m[2]) + '</' + tag + '>');
        return;
      }
      if ((m = t.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); return; }
      if ((m = t.match(/^[-*+]\s+(.*)$/))) {
        flushPara(); flushQuote();
        if (listType !== 'ul') flushList();
        listType = 'ul';
        listItems.push(m[1]);
        return;
      }
      if ((m = t.match(/^\d+[.)]\s+(.*)$/))) {
        flushPara(); flushQuote();
        if (listType !== 'ol') flushList();
        listType = 'ol';
        listItems.push(m[1]);
        return;
      }
      flushList(); flushQuote();
      para.push(t);
    });
    flushAll();
    return html.join('');
  }

  // Paste: images come in as pictures, Markdown renders as formatting,
  // anything else becomes clean paragraphs.
  editor.addEventListener('paste', function (e) {
    var clip = e.clipboardData || window.clipboardData;

    var imageFile = null;
    var items = clip && clip.items;
    for (var i = 0; items && i < items.length; i++) {
      if (items[i].kind === 'file' && /^image\//.test(items[i].type)) {
        imageFile = items[i].getAsFile();
        break;
      }
    }
    if (imageFile) {
      e.preventDefault();
      readImageFile(imageFile, 1400, 1400, 0.85).then(function (dataUrl) {
        editor.focus();
        document.execCommand('insertHTML', false, '<img src="' + dataUrl + '" alt="">');
        scheduleSave();
        updateCounters();
      }).catch(function (err) {
        alert('Could not paste that image: ' + err.message);
      });
      return;
    }

    e.preventDefault();

    // Moving a passage inside the book must carry its notes along, so keep
    // the markup in that one case (stripped back to what the editor uses).
    var asHtml = clip.getData && clip.getData('text/html');
    if (asHtml && /class="note-ref"|class='note-ref'/.test(asHtml)) {
      document.execCommand('insertHTML', false, sanitizeEditorHTML(asHtml));
      renumberNotes();
      renderNotesPanel();
      scheduleSave();
      updateCounters();
      return;
    }

    var text = clip.getData('text/plain');
    if (!text) return;
    var html;
    if (looksLikeMarkdown(text)) {
      html = markdownToHtml(text);
    } else {
      html = text.split(/\n{2,}/).map(function (p) {
        return p.replace(/\n/g, ' ').trim();
      }).filter(Boolean).map(function (p) {
        var div = document.createElement('div');
        div.textContent = p;
        return '<p>' + div.innerHTML + '</p>';
      }).join('');
    }
    document.execCommand('insertHTML', false, html || '');
    scheduleSave();
    updateCounters();
  });

  editor.addEventListener('keydown', function (e) {
    // Enter inside a heading/quote should return to a plain paragraph next line
    if (e.key === 'Enter' && !e.shiftKey) {
      var block = '';
      try { block = (document.queryCommandValue('formatBlock') || '').toUpperCase(); } catch (err) { /* ignore */ }
      if (block === 'H1' || block === 'H2') {
        setTimeout(function () { document.execCommand('formatBlock', false, '<P>'); }, 0);
      }
    }
  });

  chapterTitleInput.addEventListener('input', scheduleSave);
  bookTitleInput.addEventListener('input', scheduleSave);
  bookAuthorInput.addEventListener('input', scheduleSave);

  /* ---------------- Focus mode ---------------- */

  function setFocusMode(on) {
    document.body.classList.toggle('focus-mode', on);
    $('#btn-exit-focus').hidden = !on;
    if (on) editor.focus();
  }

  $('#btn-focus').addEventListener('click', function () { setFocusMode(true); });
  $('#btn-exit-focus').addEventListener('click', function () { setFocusMode(false); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !noteModal.hidden) { closeNoteEditor(); return; }
    if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) setFocusMode(false);
    else if (e.key === 'Escape' && viewEditor.classList.contains('sidebar-open')) closeSidebar();
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      if (!viewEditor.hidden) insertNote();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (!viewEditor.hidden) flushSave();
    }
  });

  /* ---------------- Goal editing ---------------- */

  $('#btn-edit-goal').addEventListener('click', function () {
    var book = getBook(currentBookId);
    if (!book) return;
    var input = prompt('Daily word goal:', String(book.goalWords || 500));
    if (input === null) return;
    var n = parseInt(input, 10);
    if (!isNaN(n) && n > 0) {
      book.goalWords = n;
      persist();
      updateCounters();
    }
  });

  /* ---------------- Export ---------------- */

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
  }

  /* Pull the notes out of a chapter, swapping each marker for whatever the
     target format uses to reference it. */
  function splitNotes(chapterHtml, startNum, markerFor) {
    var tmp = document.createElement('div');
    tmp.innerHTML = chapterHtml || '';
    var notes = [];
    noteMarkers(tmp).forEach(function (el) {
      var n = startNum + notes.length;
      notes.push(el.dataset.note || '');
      el.outerHTML = markerFor(n);
    });
    return { html: tmp.innerHTML, notes: notes };
  }

  function notePlacementOf(book) {
    return book.notePlacement === 'end' ? 'end' : 'foot';
  }

  function compileBookHTML(book) {
    var placement = notePlacementOf(book);
    var parts = [];
    parts.push('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + escapeHtml(book.title) + '</title><style>');
    parts.push('body{font-family:"Iowan Old Style",Palatino,Georgia,serif;max-width:640px;margin:0 auto;padding:48px 24px;color:#222;line-height:1.7;font-size:18px}');
    parts.push('.title-page{text-align:center;margin:30vh 0 40vh}.title-page h1{font-size:34px;margin:0 0 12px}.title-page p{color:#666}');
    parts.push('h2.chapter{font-size:24px;margin-top:0;text-align:center}section{page-break-before:always;padding-top:15vh}');
    parts.push('p{margin:0 0 .3em;text-indent:1.6em}h2+p,hr+p{text-indent:0}');
    parts.push('hr{border:none;text-align:center;margin:1.6em 0}hr:after{content:"\\2733\\00a0\\00a0\\2733\\00a0\\00a0\\2733";color:#999;font-size:13px}');
    parts.push('blockquote{margin:1em 1.4em;padding-left:14px;border-left:3px solid #3a6a4d;color:#555;font-style:italic}');
    parts.push('img{max-width:100%;height:auto;display:block;margin:1.2em auto;border-radius:4px}');
    parts.push('.cover{max-width:60%;margin:0 auto 2em;display:block;border-radius:6px}');
    parts.push('sup.fn a{text-decoration:none;color:#3a6a4d;font-size:.7em;padding:0 1px}');
    parts.push('.notes{margin-top:2.5em;padding-top:1em;border-top:1px solid #ccc;font-size:.82em;line-height:1.5;color:#444}');
    parts.push('.notes h3{font-size:1em;letter-spacing:.08em;text-transform:uppercase;color:#777;margin:0 0 .6em}');
    parts.push('.notes ol{margin:0;padding-left:1.4em}.notes li{margin-bottom:.35em}.notes li p{text-indent:0;margin:0}');
    parts.push('.notes a.back{text-decoration:none;color:#3a6a4d;margin-left:.3em}');
    parts.push('.endnotes h3{font-size:1em;margin:1.4em 0 .5em;text-align:left;color:#555}');
    parts.push('@media print{section{padding-top:10vh}.notes{page-break-inside:avoid}}');
    parts.push('</style></head><body>');
    parts.push('<div class="title-page">');
    if (book.cover) parts.push('<img class="cover" src="' + book.cover + '" alt="">');
    parts.push('<h1>' + escapeHtml(book.title || 'Untitled') + '</h1>');
    if (book.author) parts.push('<p>by ' + escapeHtml(book.author) + '</p>');
    parts.push('</div>');
    // Endnotes run in one sequence through the book; footnotes restart in
    // each chapter, as they do in print.
    var running = 1;
    var collected = [];

    book.chapters.forEach(function (ch, i) {
      var start = placement === 'end' ? running : 1;
      var split = splitNotes(ch.content, start, function (n) {
        return '<sup class="fn"><a id="fnref-' + i + '-' + n + '" href="#fn-' + i + '-' + n + '">' + n + '</a></sup>';
      });
      running += split.notes.length;

      parts.push('<section><h2 class="chapter">' + escapeHtml(ch.title || 'Chapter ' + (i + 1)) + '</h2>');
      parts.push(split.html);
      if (placement === 'foot' && split.notes.length) {
        parts.push(notesListHTML(split.notes, i, 1, true));
      }
      parts.push('</section>');
      collected.push({ title: ch.title || 'Chapter ' + (i + 1), notes: split.notes, start: start, index: i });
    });

    if (placement === 'end' && collected.some(function (c) { return c.notes.length; })) {
      parts.push('<section class="endnotes"><h2 class="chapter">Notes</h2>');
      collected.forEach(function (c) {
        if (!c.notes.length) return;
        parts.push('<h3>' + escapeHtml(c.title) + '</h3>');
        parts.push(notesListHTML(c.notes, c.index, c.start, false));
      });
      parts.push('</section>');
    }

    parts.push('</body></html>');
    return parts.join('\n');
  }

  function notesListHTML(notes, chapterIndex, start, withHeading) {
    var out = ['<div class="notes">'];
    if (withHeading) out.push('<h3>Notes</h3>');
    out.push('<ol start="' + start + '">');
    notes.forEach(function (text, k) {
      var n = start + k;
      out.push('<li id="fn-' + chapterIndex + '-' + n + '">' + escapeHtml(text).replace(/\n/g, '<br>') +
        '<a class="back" href="#fnref-' + chapterIndex + '-' + n + '" title="Back to the text">↩</a></li>');
    });
    out.push('</ol></div>');
    return out.join('');
  }

  function htmlToMarkdown(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';

    function walk(node) {
      var out = '';
      node.childNodes.forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) { out += child.textContent; return; }
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        var tag = child.tagName.toLowerCase();
        var inner = walk(child);
        switch (tag) {
          case 'p': case 'div': out += inner.trim() + '\n\n'; break;
          case 'h1': out += '# ' + inner.trim() + '\n\n'; break;
          case 'h2': out += '## ' + inner.trim() + '\n\n'; break;
          case 'h3': out += '### ' + inner.trim() + '\n\n'; break;
          case 'blockquote': out += '> ' + inner.trim().replace(/\n+/g, '\n> ') + '\n\n'; break;
          case 'b': case 'strong': out += '**' + inner + '**'; break;
          case 'i': case 'em': out += '*' + inner + '*'; break;
          case 'u': out += inner; break;
          case 's': case 'strike': case 'del': out += '~~' + inner + '~~'; break;
          case 'ul':
            child.querySelectorAll(':scope > li').forEach(function (li) { out += '- ' + walk(li).trim() + '\n'; });
            out += '\n';
            break;
          case 'ol':
            child.querySelectorAll(':scope > li').forEach(function (li, i) { out += (i + 1) + '. ' + walk(li).trim() + '\n'; });
            out += '\n';
            break;
          case 'hr': out += '* * *\n\n'; break;
          case 'br': out += '\n'; break;
          case 'img': out += '\n![' + (child.getAttribute('alt') || 'image') + '](' + child.getAttribute('src') + ')\n\n'; break;
          default: out += inner;
        }
      });
      return out;
    }
    return walk(tmp).replace(/\n{3,}/g, '\n\n').trim();
  }

  function compileBookMarkdown(book) {
    var placement = notePlacementOf(book);
    var out = '# ' + (book.title || 'Untitled') + '\n\n';
    if (book.author) out += 'by ' + book.author + '\n\n';

    // Markdown footnote labels have to be unique across the whole file, so
    // these stay in one sequence whichever way they are placed.
    var running = 1;
    var tail = [];

    book.chapters.forEach(function (ch, i) {
      var split = splitNotes(ch.content, running, function (n) { return '[^' + n + ']'; });
      var start = running;
      running += split.notes.length;

      out += '\n## ' + (ch.title || 'Chapter ' + (i + 1)) + '\n\n';
      out += htmlToMarkdown(split.html) + '\n';

      var defs = split.notes.map(function (text, k) {
        return '[^' + (start + k) + ']: ' + text.replace(/\n/g, '\n    ');
      });
      if (!defs.length) return;
      if (placement === 'foot') out += '\n' + defs.join('\n') + '\n';
      else tail.push('### ' + (ch.title || 'Chapter ' + (i + 1)) + '\n\n' + defs.join('\n'));
    });

    if (tail.length) out += '\n## Notes\n\n' + tail.join('\n\n') + '\n';
    return out;
  }

  function compileBookText(book) {
    var placement = notePlacementOf(book);
    var out = (book.title || 'Untitled').toUpperCase() + '\n';
    if (book.author) out += 'by ' + book.author + '\n';
    out += '\n';

    var running = 1;
    var tail = [];

    book.chapters.forEach(function (ch, i) {
      var split = splitNotes(ch.content, running, function (n) { return '[' + n + ']'; });
      var start = running;
      running += split.notes.length;

      var tmp = document.createElement('div');
      tmp.innerHTML = split.html;
      tmp.querySelectorAll('p,h1,h2,h3,blockquote,li,hr').forEach(function (el) {
        el.insertAdjacentText('beforeend', '\n\n');
      });
      out += '\n\n' + (ch.title || 'Chapter ' + (i + 1)) + '\n\n';
      out += tmp.textContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';

      var lines = split.notes.map(function (text, k) {
        return '[' + (start + k) + '] ' + text.replace(/\n/g, '\n    ');
      });
      if (!lines.length) return;
      if (placement === 'foot') out += '\nNOTES\n' + lines.join('\n') + '\n';
      else tail.push((ch.title || 'Chapter ' + (i + 1)) + '\n' + lines.join('\n'));
    });

    if (tail.length) out += '\n\nNOTES\n\n' + tail.join('\n\n') + '\n';
    return out;
  }

  function download(filename, mime, content) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function safeFilename(s) {
    return (s || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
  }

  document.querySelectorAll('[data-export]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      flushSave();
      var book = getBook(currentBookId);
      if (!book) return;
      var base = safeFilename(book.title);
      var kind = btn.dataset.export;
      if (kind === 'html') download(base + '.html', 'text/html;charset=utf-8', compileBookHTML(book));
      else if (kind === 'md') download(base + '.md', 'text/markdown;charset=utf-8', compileBookMarkdown(book));
      else if (kind === 'txt') download(base + '.txt', 'text/plain;charset=utf-8', compileBookText(book));
      else if (kind === 'print') {
        var w = window.open('', '_blank');
        if (!w) { alert('Please allow pop-ups to print.'); return; }
        w.document.write(compileBookHTML(book));
        w.document.close();
        w.focus();
        setTimeout(function () { w.print(); }, 300);
      }
    });
  });

  /* ---------------- Backup / import ---------------- */

  $('#btn-backup').addEventListener('click', function () {
    download('rebel-archives-backup-' + todayKey() + '.json', 'application/json', JSON.stringify(db, null, 2));
  });

  $('#btn-import').addEventListener('click', function () { $('#import-file').click(); });

  /* Rebuild a book from whatever an imported file happens to contain: fields
     may be missing, renamed, or of the wrong type. */
  function sanitizeBook(raw, index) {
    if (!raw || typeof raw !== 'object') return null;

    var chapters = (Array.isArray(raw.chapters) ? raw.chapters : []).map(function (ch) {
      if (typeof ch === 'string') return { id: uid(), title: '', content: ch };
      if (!ch || typeof ch !== 'object') return null;
      return {
        id: uid(),
        title: typeof ch.title === 'string' ? ch.title : '',
        content: typeof ch.content === 'string' ? ch.content : ''
      };
    }).filter(Boolean);
    if (!chapters.length) chapters.push(newChapter('Chapter 1'));

    var book = {
      id: uid(), // always fresh, so an import can never overwrite a current book
      title: (typeof raw.title === 'string' && raw.title.trim()) ? raw.title : 'Untitled book',
      author: typeof raw.author === 'string' ? raw.author : '',
      spine: typeof raw.spine === 'string' ? raw.spine : SPINE_COLORS[(db.books.length + index) % SPINE_COLORS.length],
      createdAt: Number(raw.createdAt) || Date.now(),
      updatedAt: Number(raw.updatedAt) || Date.now(),
      goalWords: Number(raw.goalWords) > 0 ? Number(raw.goalWords) : 500,
      notePlacement: raw.notePlacement === 'end' ? 'end' : 'foot',
      cover: typeof raw.cover === 'string' ? raw.cover : undefined,
      dailyProgress: (raw.dailyProgress && typeof raw.dailyProgress === 'object') ? raw.dailyProgress : {},
      lastTotalWords: 0,
      chapters: chapters
    };
    book.lastTotalWords = bookTotalWords(book);
    return book;
  }

  /* Accept a full backup, a bare array of books, or a single book object. */
  function booksFromJSON(data) {
    var list = null;
    if (Array.isArray(data)) list = data;
    else if (data && Array.isArray(data.books)) list = data.books;
    else if (data && Array.isArray(data.chapters)) list = [data];
    if (!list) return null;
    return list.map(sanitizeBook).filter(Boolean);
  }

  /* Turn a Markdown / plain-text document into a book, splitting chapters on
     headings: "# Title" plus "## Chapter" means the H1 names the book. */
  function bookFromText(text, fallbackTitle) {
    var lines = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
    var heads = [];
    lines.forEach(function (line, i) {
      var m = /^(#{1,2})\s+(.*\S)\s*$/.exec(line);
      if (m) heads.push({ line: i, level: m[1].length, title: m[2] });
    });

    var bookTitle = fallbackTitle;
    var splitLevel = 0;
    if (heads.length) {
      var hasH2 = heads.some(function (h) { return h.level === 2; });
      if (heads[0].level === 1 && hasH2) {
        bookTitle = heads[0].title;
        splitLevel = 2;
      } else {
        splitLevel = heads[0].level;
      }
    }
    var bounds = heads.filter(function (h) { return h.level === splitLevel; });

    function chapterFrom(title, from, to) {
      var body = lines.slice(from, to).join('\n').trim();
      if (!body) return null;
      var ch = newChapter(title);
      ch.content = markdownToHtml(body);
      return ch;
    }

    var chapters = [];
    if (!bounds.length) {
      chapters.push(chapterFrom(fallbackTitle, 0, lines.length) || newChapter(fallbackTitle));
    } else {
      var preambleFrom = (bookTitle !== fallbackTitle) ? heads[0].line + 1 : 0;
      var opening = chapterFrom('Opening', preambleFrom, bounds[0].line);
      if (opening) chapters.push(opening);
      bounds.forEach(function (h, i) {
        var end = (i + 1 < bounds.length) ? bounds[i + 1].line : lines.length;
        chapters.push(chapterFrom(h.title, h.line + 1, end) || newChapter(h.title));
      });
    }

    return sanitizeBook({ title: bookTitle, chapters: chapters }, 0);
  }

  $('#import-file').addEventListener('change', function () {
    var file = this.files[0];
    this.value = '';
    if (!file) return;
    var reader = new FileReader();

    reader.onerror = function () {
      alert('Could not read "' + file.name + '". Try copying it into the Files app first, then import it from there.');
    };

    reader.onload = function () {
      var raw = String(reader.result || '').replace(/^﻿/, '');
      var baseName = file.name.replace(/\.[^.]+$/, '') || 'Imported book';

      if (!raw.trim()) {
        alert('"' + file.name + '" is empty — there was nothing to import.');
        return;
      }

      // A file meant to be a backup should report damage rather than be
      // silently imported as prose.
      var claimsJSON = /\.json$/i.test(file.name) || /^[\[{]/.test(raw.trim());

      var books = null;
      try {
        books = booksFromJSON(JSON.parse(raw));
        if (!books && claimsJSON) {
          alert('"' + file.name + '" is valid JSON but contains no books.\n\n' +
            'Make sure you picked the file created by "Backup all".');
          return;
        }
      } catch (e) {
        if (claimsJSON) {
          alert('"' + file.name + '" looks like a backup but is damaged, so it could not be read ' +
            '(' + e.message + ').\n\nIf the download was interrupted, make a fresh backup and try again.');
          return;
        }
        books = null; // not JSON at all: fall through to the document importers
      }

      if (!books) {
        // An HTML export round-trips through the Markdown converter.
        var text = /<\s*(html|body|section|p|h[1-6]|div)\b/i.test(raw) ? htmlToMarkdown(raw) : raw;
        var book = bookFromText(text, baseName);
        books = book ? [book] : null;
      }

      if (!books || !books.length) {
        alert('Could not find any writing in "' + file.name + '".\n\n' +
          'To move books between devices, open the library on the device you wrote them on, ' +
          'tap "Backup all", and import the .json file it downloads. ' +
          'Markdown, text and HTML files can also be imported as a new book.');
        return;
      }

      books.forEach(function (b) { db.books.push(b); });
      persist();
      renderLibrary();
      alert('Imported ' + books.length + ' book' + (books.length === 1 ? '' : 's') + '.');
    };

    reader.readAsText(file);
  });

  /* ---------------- Wiring ---------------- */

  $('#btn-add-chapter').addEventListener('click', addChapter);
  $('#btn-sidebar-toggle').addEventListener('click', function () {
    viewEditor.classList.toggle('sidebar-open');
  });
  $('#btn-sidebar-close').addEventListener('click', closeSidebar);
  $('#sidebar-scrim').addEventListener('click', closeSidebar);
  $('#btn-back').addEventListener('click', function () { location.hash = '#/'; });
  $('#btn-theme').addEventListener('click', toggleTheme);
  $('#btn-theme-lib').addEventListener('click', toggleTheme);

  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', flushSave);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flushSave();
  });

  // Default paragraph separator so plain typing produces <p> blocks.
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { /* unsupported */ }

  // Offline support: service workers need http(s); file:// already works offline.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline install is best-effort */ });
  }

  // Storage is asynchronous now, so the first paint waits for the library.
  load().then(function (loaded) {
    db = loaded;
    applyTheme();
    route();
  });
})();
