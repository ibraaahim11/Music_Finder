import axios from "axios";
import { getCoverImageUrl } from "./coverImage_controller.js";
import { getPaginatedResults,filterDuplicateEntries } from "./utils_controller.js";
// Url of the MusicBrainz, and lyrics.ovh api
const MB_URL = "https://musicbrainz.org/ws/2";
const LYRICS_OVH_URL = "https://api.lyrics.ovh/v1";

// header included with MusicBrainz API requests.
const headers = {
  "User-Agent": "MusicFinder/1.0 ( exchangegiftsnow@yahoo.com )",
};

// cache for lyrics
const lyricsCache = new Map(); // key: artist::title
const artistSongsCache = new Map(); // key: artistId , value: list of song objects
const songsSearchCache = new Map(); // key:

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

  try {
    let filtered_songs;
    if (artistSongsCache.has(artistId)) {
      filtered_songs = artistSongsCache.get(artistId);
      console.log("used song search cache");
    } else {
      const response_songs = await axios.get(MB_URL + "/recording", {
        params: {
          fmt: "json",
          artist: artistId,
          limit: 100,
        },
        headers: headers,
      });

      filtered_songs = filterDuplicateEntries(response_songs.data.recordings);
      artistSongsCache.set(artistId, filtered_songs);
    }
    const chosen_songs = getPaginatedResults(filtered_songs, page, limit);

    const songs_data = {
      total_count_songs: filtered_songs.length,
      count_songs: chosen_songs.length,
      songs: chosen_songs.map((song) => ({
        id: song.id,
        title: song.title,
      })),
    };

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

export async function searchSongs(name, page, limit) {
  name = name.trim().toLowerCase();
  if (songsSearchCache.has(name)) {
   
    const paginated_songs = getPaginatedResults(
      songsSearchCache.get(name),
      page,
      limit
    );
    const data = {
      total_count_songs: songsSearchCache.get(name).length,
      count_songs: paginated_songs.length,
      paginated_songs: paginated_songs,
    };
    return data;
  } else {
    try {
      const response = await axios.get(`${MB_URL}/recording`, {
        params: {
          query: name,
          inc: "artist-credits",
          fmt: "json",
          limit: 100
        },
        headers: headers,
        limit:100
      });

      let sortedFiltered = response.data.recordings
        .sort((a, b) => b.score - a.score)
        .filter((recording) => recording.score >= 90);

  


      const result = sortedFiltered.map((song) => ({
        id: song.id,
        name: song.title,
        artists: song["artist-credit"].map((artistObj) => {
          return { name: artistObj.name, id: artistObj.artist.id };
        }),
        type: "song",
      }));
      songsSearchCache.set(name, result);
      const paginated_songs = getPaginatedResults(
        songsSearchCache.get(name),
        page,
        limit
      );
      const data = {
        total_count_songs: result.length,
        count_songs: paginated_songs.length,
        paginated_songs: paginated_songs,
      };
      return data;
    } catch (err) {
      console.error(`[searchSongs] Error: ${err.message}`);
      return [];
    }
  }
}
