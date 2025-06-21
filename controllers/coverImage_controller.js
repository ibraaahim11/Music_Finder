import axios from "axios";

// cache between releaseId : coverUrl
const cache = new Map();

export async function getCoverImageUrl(releaseId) {
    // check if inside cache
  if (cache.has(releaseId)) {
    console.log("Used cache");
    return cache.get(releaseId);
  }
  try {
    const res = await axios.get(
      `https://coverartarchive.org/release/${releaseId}`
    );
    const frontImage = res.data.images.find((img) => img.front);
    const url = frontImage?.image || null;
    // add to cache
    cache.set(releaseId,url);
    return url
  } catch (err) {
    console.log(`Error [getCoverImageUrl] for ${releaseId}: ` + err.message);
  }
}

