// function to pass a list, page number, and limit of elements per page -> to return correct sublist
export function getPaginatedResults(list, page, limit) {
  const offset = (page - 1) * limit;
  try {
    return list.slice(offset, offset + limit);
  } catch (err) {
    console.error(`[getPaginatedResults] Error: ${err.message}`);
    return [];
  }
}

// Takes list of entities (songs) and returns filtered list with no duplicates or unofficial entities
export function filterDuplicateEntries(entries) {
  const seenTitles = new Set();

  const unwantedWords = [
    "live",
    "remix",
    "demo",
    "instrumental",
    "version",
    "edit",
    "music video",
    "behind the scenes",
    "karaoke",
    "session",
    "commentary",
    "mono",
    "rehearsal",
    "tv performance",
    "ep",
    "single",
    "soundtrack",
  ];

  const regexUnwanted =
    /\b(live|remix|demo|instrumental|edit|version|karaoke|ep|single|ost|soundtrack)\b/i;
  const punctuationPatterns = /[\[\(].*[\]\)]/g;

  const isClean = (title) => {
    const lower = title.toLowerCase();
    return (
      !regexUnwanted.test(lower) &&
      !punctuationPatterns.test(lower) &&
      !unwantedWords.some((word) => lower.includes(word))
    );
  };

  const filtered_entries = [];

  entries.forEach((entry) => {
    if (
      isClean(entry.title) &&
      !seenTitles.has(entry.title.toLowerCase().trim())
    ) {
      seenTitles.add(entry.title.toLowerCase().trim());
      filtered_entries.push(entry);
    }
  });

  return filtered_entries;
}
