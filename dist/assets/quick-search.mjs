// Exact multiword matching comes first. Fuse handles spelling mistakes in longer Latin words.
// Short queries and Chinese text stay exact, avoiding unrelated fuzzy matches.
export const normalizeQuery = value => String(value).normalize('NFKC').toLocaleLowerCase().trim();
const hasExactTerm = (text, term) => /^[a-z]{1,2}$/.test(term) ? new RegExp(`\\b${term}`).test(text) : text.includes(term);
export function createQuickSearch(records, Fuse) {
  const indexed = records.map(record => ({ ...record, searchable: normalizeQuery([record.title, record.description, record.aliases].join(' ')) }));
  const fuzzy = new Fuse(indexed, { keys: ['title', 'aliases', 'description'], threshold: 0.28, ignoreLocation: true, includeScore: true, minMatchCharLength: 2 });
  return query => {
    const terms = normalizeQuery(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return indexed.map(record => ({ id: record.id, approximate: false }));
    const approximations = terms.map(term => /^[a-z]{4,}$/.test(term)
      ? new Map(fuzzy.search(term).map(result => [result.item.id, result.score])) : new Map());
    return indexed.map((record, order) => {
      let score = 0, approximate = false;
      for (let i = 0; i < terms.length; i++) {
        if (hasExactTerm(record.searchable, terms[i])) continue;
        if (!approximations[i].has(record.id)) return null;
        approximate = true;
        score += 1 + approximations[i].get(record.id);
      }
      return { id: record.id, score, approximate, order };
    }).filter(Boolean).sort((a, b) => a.score - b.score || a.order - b.order);
  };
}
