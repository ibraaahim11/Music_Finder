import axios from "axios";
import { getCoverImageUrl } from "./coverImage_controller.js";
// Url of the MusicBrainz, and lyrics.ovh api
const MB_URL = "https://musicbrainz.org/ws/2";
const LYRICS_OVH_URL = "https://api.lyrics.ovh/v1";

// header included with MusicBrainz API requests
const headers = {
  "User-Agent": "MusicFinder/1.0 ( exchangegiftsnow@yahoo.com )",
};

// cache for lyrics
const lyricsCache = new Map(); // key: artist::title

// function to get data of song from full id
export async function getSongData(songId) {
  try {
    // fmt -> specify return type json or xml
    // inc parameter -> other information you would like to be included
    const response = await axios.get(MB_URL + `/recording/${songId}`, {
      params: {
        fmt: "json",
        inc: "artist-credits+releases",
      },
      headers: headers,
    });

    // creating object with needed ids
    const songData = {
      id: response.data.id,
      title: response.data.title,
      releaseId: response.data.releases?.[0]?.id,
      cover_url: null,
      release_date: response.data["first-release-date"],
      artists: response.data["artist-credit"].map((artistObj) => {
        return { name: artistObj.name, id: artistObj.artist.id };
      }),
      lyrics: null,
    };
    // adding cover_url and lyrics in parallel using promise.allSettled
    const [cover, lyrics] = await Promise.allSettled([
      getCoverImageUrl(songData.releaseId),
      getLyrics(songData.artists[0]?.name || "", songData.title),
    ]);

    songData.cover_url = cover.status === "fulfilled" ? cover.value : null;
    songData.lyrics = lyrics.status === "fulfilled" ? lyrics.value : null;

    return songData;
  } catch (err) {
    console.log(`Error [getSongData] for ${songId}: ` + err.message);
  }
}

// get songs by artist id, provided limit and page
export async function getSongsByArtistId(artistId, limit, page = 1) {
  // calculate offset
  const offset = (page - 1) * limit;
  try {
    const response_songs = await axios.get(MB_URL + "/recording", {
      params: {
        fmt: "json",
        artist: artistId,
        limit: limit,
        offset: offset,
      },
      headers: headers,
    });

    // return total count of songs by artist, count of songs searched, and the actual songs gotten.
    const songs_data = {
      total_count_songs: response_songs.data["recording-count"],
      count_songs: 0,
      songs: response_songs.data.recordings.map((song) => ({
        id: song.id,
        title: song.title,
      })),
    };
    // add number of songs
    songs_data["count_songs"] = songs_data.songs.length;

    return songs_data;
  } catch (err) {
    console.log(`Error [getSongsByArtistId] for ${artistId}: ` + err.message);
  }
}

// function to get lyrics given artist, title using lyrics.ovh api
async function getLyrics(artist, title) {
  // see if lyrics cached
  const key = `${artist}::${title}`;
  if (lyricsCache.has(key)) {
    console.log("lyrics cached");
    return lyricsCache.get(key);
  } else {
    try {
      const response = await axios.get(
        `${LYRICS_OVH_URL}/${encodeURIComponent(artist)}/${encodeURIComponent(
          title
        )}`
      );
      // add lyrics to hash map
      lyricsCache.set(key, response.data.lyrics);
      return response.data.lyrics;
    } catch (err) {
      console.error(`[Lyrics Error] ${artist} - ${title}: ${err.message}`);
      return null;
    }
  }
}
