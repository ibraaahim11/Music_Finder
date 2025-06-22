


export function getPaginatedResults(list, page, limit) {
  const offset = (page - 1) * limit;
  try {

    return list.slice(offset, offset + limit);
  } catch (err) {
    console.error(`[getPaginatedResults] Error: ${err.message}`);
    return [];
  }
}

// Takes list of  entities and returns filtered list with no duplicates or unofficial entities
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
  ];

  const isClean = (title) =>
    !unwantedWords.some((word) => title.toLowerCase().includes(word));

  const filtered_entries = [];

  entries.forEach((entry) => {
    if (isClean(entry.title) && !seenTitles.has(entry.title)) {
      seenTitles.add(entry.title);
      filtered_entries.push(entry);
    }
  });

  return filtered_entries;
}