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

  var db = load();
  var currentBookId = null;
  var currentChapterId = null;
  var saveTimer = null;
  var dirty = false;

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.books)) return parsed;
      }
    } catch (e) { /* corrupted storage: start fresh */ }
    return { version: 1, settings: { theme: null }, books: [] };
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
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

  /* ---------------- Theme ---------------- */

  var ACCENTS = [
    { id: 'terracotta', dot: '#b3502d', label: 'Terracotta' },
    { id: 'ink',        dot: '#35597a', label: 'Ink blue' },
    { id: 'forest',     dot: '#3a6a4d', label: 'Forest green' },
    { id: 'charcoal',   dot: '#4a463f', label: 'Charcoal' },
    { id: 'plum',       dot: '#6b4470', label: 'Plum' }
  ];

  function applyTheme() {
    var theme = db.settings.theme;
    if (!theme) {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-accent', db.settings.accent || 'terracotta');
    renderAccentPickers();
  }

  function renderAccentPickers() {
    var current = db.settings.accent || 'terracotta';
    document.querySelectorAll('.accent-picker').forEach(function (picker) {
      if (!picker.childElementCount) {
        ACCENTS.forEach(function (a) {
          var dot = document.createElement('button');
          dot.className = 'accent-dot';
          dot.dataset.accent = a.id;
          dot.title = a.label + ' accent';
          dot.setAttribute('role', 'radio');
          dot.style.setProperty('--dot', a.dot);
          dot.addEventListener('click', function () {
            db.settings.accent = a.id;
            persist();
            applyTheme();
          });
          picker.appendChild(dot);
        });
      }
      picker.querySelectorAll('.accent-dot').forEach(function (dot) {
        var active = dot.dataset.accent === current;
        dot.classList.toggle('active', active);
        dot.setAttribute('aria-checked', active ? 'true' : 'false');
      });
    });
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

      var spine = document.createElement('div');
      spine.className = 'book-card-spine';
      spine.style.background = book.spine || SPINE_COLORS[0];
      card.appendChild(spine);

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
    renderChapterList();
    updateCounters();
    setSaveStatus('Saved');
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

  function setSaveStatus(text, saving) {
    saveStatus.textContent = text;
    saveStatus.classList.toggle('saving', !!saving);
  }

  function scheduleSave() {
    dirty = true;
    setSaveStatus('Saving…', true);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }

  function flushSave() {
    clearTimeout(saveTimer);
    if (!dirty) return;
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
    renderChapterList();
    updateCounters();
    setSaveStatus('Saved');
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

  // Paste as clean paragraphs — keeps outside markup out of the manuscript.
  editor.addEventListener('paste', function (e) {
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (!text) return;
    var paragraphs = text.split(/\n{2,}/).map(function (p) {
      return p.replace(/\n/g, ' ').trim();
    }).filter(Boolean);
    var html = paragraphs.map(function (p) {
      var div = document.createElement('div');
      div.textContent = p;
      return '<p>' + div.innerHTML + '</p>';
    }).join('');
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
    if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) setFocusMode(false);
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

  function compileBookHTML(book) {
    var parts = [];
    parts.push('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + escapeHtml(book.title) + '</title><style>');
    parts.push('body{font-family:"Iowan Old Style",Palatino,Georgia,serif;max-width:640px;margin:0 auto;padding:48px 24px;color:#222;line-height:1.7;font-size:18px}');
    parts.push('.title-page{text-align:center;margin:30vh 0 40vh}.title-page h1{font-size:34px;margin:0 0 12px}.title-page p{color:#666}');
    parts.push('h2.chapter{font-size:24px;margin-top:0;text-align:center}section{page-break-before:always;padding-top:15vh}');
    parts.push('p{margin:0 0 .3em;text-indent:1.6em}h2+p,hr+p{text-indent:0}');
    parts.push('hr{border:none;text-align:center;margin:1.6em 0}hr:after{content:"\\2733\\00a0\\00a0\\2733\\00a0\\00a0\\2733";color:#999;font-size:13px}');
    parts.push('blockquote{margin:1em 1.4em;padding-left:14px;border-left:3px solid #b3502d;color:#555;font-style:italic}');
    parts.push('@media print{section{padding-top:10vh}}');
    parts.push('</style></head><body>');
    parts.push('<div class="title-page"><h1>' + escapeHtml(book.title || 'Untitled') + '</h1>');
    if (book.author) parts.push('<p>by ' + escapeHtml(book.author) + '</p>');
    parts.push('</div>');
    book.chapters.forEach(function (ch, i) {
      parts.push('<section><h2 class="chapter">' + escapeHtml(ch.title || 'Chapter ' + (i + 1)) + '</h2>');
      parts.push(ch.content || '');
      parts.push('</section>');
    });
    parts.push('</body></html>');
    return parts.join('\n');
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
          default: out += inner;
        }
      });
      return out;
    }
    return walk(tmp).replace(/\n{3,}/g, '\n\n').trim();
  }

  function compileBookMarkdown(book) {
    var out = '# ' + (book.title || 'Untitled') + '\n\n';
    if (book.author) out += 'by ' + book.author + '\n\n';
    book.chapters.forEach(function (ch, i) {
      out += '\n## ' + (ch.title || 'Chapter ' + (i + 1)) + '\n\n';
      out += htmlToMarkdown(ch.content) + '\n';
    });
    return out;
  }

  function compileBookText(book) {
    var out = (book.title || 'Untitled').toUpperCase() + '\n';
    if (book.author) out += 'by ' + book.author + '\n';
    out += '\n';
    book.chapters.forEach(function (ch, i) {
      var tmp = document.createElement('div');
      tmp.innerHTML = ch.content || '';
      tmp.querySelectorAll('p,h1,h2,h3,blockquote,li,hr').forEach(function (el) {
        el.insertAdjacentText('beforeend', '\n\n');
      });
      out += '\n\n' + (ch.title || 'Chapter ' + (i + 1)) + '\n\n';
      out += tmp.textContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';
    });
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

  $('#import-file').addEventListener('change', function () {
    var file = this.files[0];
    this.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.books)) throw new Error('bad format');
        var existing = {};
        db.books.forEach(function (b) { existing[b.id] = true; });
        var added = 0;
        data.books.forEach(function (b) {
          if (existing[b.id]) b.id = uid(); // never clobber a current book
          db.books.push(b);
          added++;
        });
        persist();
        renderLibrary();
        alert('Imported ' + added + ' book' + (added === 1 ? '' : 's') + '.');
      } catch (e) {
        alert('That file is not a valid Rebel Archives backup.');
      }
    };
    reader.readAsText(file);
  });

  /* ---------------- Wiring ---------------- */

  $('#btn-add-chapter').addEventListener('click', addChapter);
  $('#btn-sidebar-toggle').addEventListener('click', function () {
    viewEditor.classList.toggle('sidebar-open');
  });
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

  applyTheme();
  route();
})();
