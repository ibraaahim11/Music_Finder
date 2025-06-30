import axios from "axios";

const COVER_ART_URL = "https://coverartarchive.org/release";
// cache between releaseId : coverUrl
const cache = new Map();

// function to get cover image using release id
export async function getCoverImageUrl(releaseId) {
  // check if inside cache
  if (cache.has(releaseId)) {
    console.log("Used cover-image cache");
    return cache.get(releaseId);
  }
  try {
    const res = await axios.get(`${COVER_ART_URL}/${releaseId}`);
    const frontImage = res.data.images.find((img) => img.front);
    const url = frontImage?.image || null;
    // add to cache
    cache.set(releaseId, url);
    return url;
  } catch (err) {
    console.error(`Error [getCoverImageUrl] for ${releaseId}: ${err.message}`);
    cache.set(releaseId, null); // Avoid retrying same failed ID
    return null;
  }
}
