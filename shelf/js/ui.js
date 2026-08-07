/* DOM overlay: the book card, the marker row, buttons, and state-driven
   chrome. Talks to ShelfInteractions through the two callbacks it hands
   over at construction, plus the public jump/step/open/close methods. */

const pad = (n) => String(n).padStart(2, '0');

export function createUI(bookDefs, reducedMotion) {
  const els = {
    scrim: document.getElementById('scrim'),
    stage: document.getElementById('stage'),
    card: document.getElementById('bookCard'),
    no: document.getElementById('bookNo'),
    title: document.getElementById('bookTitle'),
    author: document.getElementById('bookAuthor'),
    colophon: document.getElementById('bookColophon'),
    note: document.getElementById('bookNote'),
    browseBar: document.getElementById('browseBar'),
    inspectBar: document.getElementById('inspectBar'),
    markers: document.getElementById('markers'),
    prev: document.getElementById('prevBtn'),
    next: document.getElementById('nextBtn'),
    open: document.getElementById('openBtn'),
    close: document.getElementById('closeBtn')
  };

  let interactions = null;
  let swapTimer = 0;

  const markerButtons = bookDefs.map((def, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'marker';
    b.setAttribute('aria-label', `Book ${i + 1} of ${bookDefs.length}: ${def.title}`);
    b.addEventListener('click', () => interactions && interactions.jumpTo(i));
    els.markers.appendChild(b);
    return b;
  });

  function fillCard(i, def) {
    els.no.textContent = `No. ${pad(i + 1)} · of ${pad(bookDefs.length)}`;
    els.title.textContent = def.title;
    els.author.textContent = def.author;
    els.colophon.textContent = def.colophon;
    els.note.textContent = def.note;
  }

  function onSelectionChange(i, def) {
    markerButtons.forEach((b, j) => {
      if (j === i) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    if (reducedMotion) {
      fillCard(i, def);
      return;
    }
    clearTimeout(swapTimer);
    els.card.classList.add('swap');
    swapTimer = setTimeout(() => {
      fillCard(i, def);
      els.card.classList.remove('swap');
    }, 160);
  }

  function onStateChange(state) {
    const inspecting = state === 'to-inspect' || state === 'inspect';
    els.scrim.classList.toggle('on', inspecting);
    els.browseBar.classList.toggle('hidden', inspecting);
    els.inspectBar.hidden = !inspecting;
    els.note.hidden = !inspecting;
    els.stage.classList.toggle('inspecting', inspecting);
    if (state === 'inspect') els.close.focus({ preventScroll: true });
  }

  els.prev.addEventListener('click', () => interactions && interactions.step(-1));
  els.next.addEventListener('click', () => interactions && interactions.step(1));
  els.open.addEventListener('click', () => interactions && interactions.openInspect());
  els.close.addEventListener('click', () => interactions && interactions.closeInspect());

  return {
    onSelectionChange,
    onStateChange,
    bind(ix) {
      interactions = ix;
      fillCard(ix.selectedIndex, bookDefs[ix.selectedIndex]);
      onSelectionChange(ix.selectedIndex, bookDefs[ix.selectedIndex]);
    }
  };
}
