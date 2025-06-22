


export function getPaginatedResults(list, page, limit) {
  const offset = (page - 1) * limit;
  try {
    console.log(list.slice(offset, offset + limit))
    return list.slice(offset, offset + limit);
  } catch (err) {
    console.error(`[getPaginatedResults] Error: ${err.message}`);
    return [];
  }
}