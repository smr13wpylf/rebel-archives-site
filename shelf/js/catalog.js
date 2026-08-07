/* The Complete Shelf — catalog of the nineteen-piece hardcover library.
   Pure data. Proportions are in shelf units where 1.0 ≈ a 24 cm tall book.
   `asset.kind` routes through assets.js: 'procedural' today, 'glb' when a
   generated model replaces a book (see the contract note in assets.js). */

export const SHELF_UNIT = 0.24; // world metres per catalog unit

export const BOOKS = [
  {
    id: 'bk-01', title: 'The Cartographer’s Fold', author: 'Ines Merrow',
    colophon: 'Clothbound · First impression, 1951',
    note: 'A survey of maps drawn from memory, and the coastlines they invented.',
    height: 1.02, width: 0.68, thickness: 0.16,
    cloth: '#5a4632', foil: '#d9b96b', accent: '#e7dcc3', motif: 'sunburst',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-02', title: 'Salt Meridian', author: 'T. E. Vance',
    colophon: 'Clothbound · Second printing, 1963',
    note: 'Notes from nine crossings of the same narrow sea.',
    height: 0.88, width: 0.60, thickness: 0.11,
    cloth: '#6e3b3a', foil: '#e3cd8f', accent: '#e9ddc6', motif: 'waves',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-03', title: 'A Grammar of Rooms', author: 'Odile Fenn',
    colophon: 'Clothbound · Library edition, 1948',
    note: 'On thresholds, corridors, and the sentences a house can say.',
    height: 1.08, width: 0.74, thickness: 0.20,
    cloth: '#4a5d4e', foil: '#d9b96b', accent: '#e4d9bf', motif: 'lozenge',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-04', title: 'The Quiet Almanac', author: 'H. Aldercott',
    colophon: 'Clothbound · First impression, 1957',
    note: 'Weather for people who stay indoors.',
    height: 0.84, width: 0.58, thickness: 0.10,
    cloth: '#5c6b7a', foil: '#cfc8bb', accent: '#e7dcc3', motif: 'rings',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-05', title: 'Litanies for Small Harbours', author: 'Marek Sorel',
    colophon: 'Clothbound · Third printing, 1960',
    note: 'Fifty-two prayers, one for each tide table of the year.',
    height: 0.94, width: 0.63, thickness: 0.13,
    cloth: '#8f5844', foil: '#e3cd8f', accent: '#ecdfc7', motif: 'orbits',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-06', title: 'The Index of Absent Things', author: 'Vera Quill',
    colophon: 'Clothbound · First impression, 1966',
    note: 'An alphabet of what the archive could not keep.',
    height: 1.00, width: 0.67, thickness: 0.18,
    cloth: '#4a453f', foil: '#c98d5f', accent: '#e2d7bd', motif: 'rules',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-07', title: 'Field Notes on Falling Light', author: 'J. B. Ostrander',
    colophon: 'Clothbound · Second printing, 1954',
    note: 'Dusk, measured in the only units that matter: pages left.',
    height: 0.90, width: 0.61, thickness: 0.12,
    cloth: '#7d8471', foil: '#d9b96b', accent: '#e9ddc6', motif: 'sunburst',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-08', title: 'The Winter Compositor', author: 'Agnes Roule',
    colophon: 'Clothbound · First impression, 1949',
    note: 'A printer sets one page a day until the thaw.',
    height: 1.05, width: 0.70, thickness: 0.15,
    cloth: '#4d5570', foil: '#cfc8bb', accent: '#e7dcc3', motif: 'lozenge',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-09', title: 'Provisions', author: 'Callum Dray',
    colophon: 'Clothbound · Fourth printing, 1971',
    note: 'Recipes remembered wrongly, and better for it.',
    height: 0.82, width: 0.57, thickness: 0.14,
    cloth: '#a67f7a', foil: '#c98d5f', accent: '#efe3cb', motif: 'rings',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-10', title: 'The Complete Shelf', author: 'Anonymous',
    colophon: 'Clothbound · Keeper’s copy, 1940',
    note: 'The catalogue that lists itself, shelved at its own centre.',
    height: 1.06, width: 0.71, thickness: 0.22,
    cloth: '#33291d', foil: '#d9b96b', accent: '#e4d9bf', motif: 'orbits',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-11', title: 'Chronicles of the Paper Sea', author: 'Liv Andersen',
    colophon: 'Clothbound · First impression, 1958',
    note: 'Every voyage begins as a crease and ends as a margin.',
    height: 0.96, width: 0.65, thickness: 0.13,
    cloth: '#5c6b7a', foil: '#e3cd8f', accent: '#e9ddc6', motif: 'waves',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-12', title: 'On the Keeping of Bees and Words', author: 'R. Halloway',
    colophon: 'Clothbound · Second printing, 1946',
    note: 'Two kinds of husbandry, one kind of patience.',
    height: 0.87, width: 0.59, thickness: 0.10,
    cloth: '#a5854e', foil: '#6e4f2a', accent: '#efe3cb', motif: 'rules',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-13', title: 'The Lantern Concordance', author: 'Petra Vey',
    colophon: 'Clothbound · Library edition, 1962',
    note: 'Cross-references for every light left burning in literature.',
    height: 1.04, width: 0.69, thickness: 0.19,
    cloth: '#6e3b3a', foil: '#d9b96b', accent: '#e7dcc3', motif: 'sunburst',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-14', title: 'Apiary of Hours', author: 'S. N. Corvel',
    colophon: 'Clothbound · First impression, 1955',
    note: 'Each hour kept like a cell: hexagonal, honeyed, brief.',
    height: 0.85, width: 0.58, thickness: 0.11,
    cloth: '#4a5d4e', foil: '#e3cd8f', accent: '#e2d7bd', motif: 'orbits',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-15', title: 'The Understory', author: 'Miriam Talbot',
    colophon: 'Clothbound · Third printing, 1968',
    note: 'What the forest files beneath its floor.',
    height: 0.98, width: 0.66, thickness: 0.16,
    cloth: '#7d8471', foil: '#c98d5f', accent: '#e9ddc6', motif: 'lozenge',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-16', title: 'Ledger of Borrowed Weather', author: 'E. Marchbanks',
    colophon: 'Clothbound · First impression, 1952',
    note: 'Debts of sunshine, repaid in rain.',
    height: 0.91, width: 0.62, thickness: 0.12,
    cloth: '#8f5844', foil: '#d9b96b', accent: '#ecdfc7', motif: 'rings',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-17', title: 'The Night Stacks', author: 'Corin Ashe',
    colophon: 'Clothbound · Second printing, 1964',
    note: 'A shift-worker’s guide to the library after closing.',
    height: 1.01, width: 0.68, thickness: 0.17,
    cloth: '#33324a', foil: '#cfc8bb', accent: '#e4d9bf', motif: 'rules',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-18', title: 'Marginalia for a Garden', author: 'Beatrice Lorn',
    colophon: 'Clothbound · First impression, 1959',
    note: 'Notes pencilled in the hedgerow’s own hand.',
    height: 0.86, width: 0.60, thickness: 0.09,
    cloth: '#a67f7a', foil: '#6e4f2a', accent: '#efe3cb', motif: 'waves',
    asset: { kind: 'procedural' }
  },
  {
    id: 'bk-19', title: 'The Last Colophon', author: 'D. Whitlock',
    colophon: 'Clothbound · Final impression, 1972',
    note: 'Here ends the shelf; the reader continues.',
    height: 0.95, width: 0.64, thickness: 0.14,
    cloth: '#5a4632', foil: '#e3cd8f', accent: '#e7dcc3', motif: 'sunburst',
    asset: { kind: 'procedural' }
  }
];
