


export function getPaginatedResults(list, page, limit) {
  const offset = (page - 1) * limit;
  try {

    return list.slice(offset, offset + limit);
  } catch (err) {
    console.error(`[getPaginatedResults] Error: ${err.message}`);
    return [];
  }
}