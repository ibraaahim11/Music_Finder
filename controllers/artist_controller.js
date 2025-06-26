import axios from "axios";
import { getSongsByArtistId } from "./song_controller.js";
import { getAlbumsByArtistId } from "./album_controller.js";
import { getPaginatedResults } from "./utils_controller.js";

// Url of the MusicBrainz API
const MB_URL = "https://musicbrainz.org/ws/2";
// header included with MusicBrainz API requests
const headers = {
  "User-Agent": "MusicFinder/1.0 ( exchangegiftsnow@yahoo.com )",
};

const artistsSearchCache = new Map(); // key : value -> name : sortedFilter object

// function to get data of album from full id
export async function getArtistData(artistId) {
  try {
    const response_artist = await axios.get(MB_URL + `/artist/${artistId}`, {
      params: {
        fmt: "json",
      },
      headers: headers,
    });

    // get 5 songs and 5 albums from artist + run in parallel
    const [songs, albums] = await Promise.all([
      getSongsByArtistId(artistId, 5),
      getAlbumsByArtistId(artistId, 5),
    ]);

    // create object with data
    const artistData = {
      id: response_artist.data.id,
      name: response_artist.data.name,
      total_count_songs: songs["total_count_songs"],
      songs_5: { count_songs: songs["count_songs"], songs: songs["songs"] },
      total_count_albums: albums["total_count_albums"],
      albums_5: {
        count_albums: albums["count_albums"],
        albums: albums["albums"],
      },
    };

    return artistData;
  } catch (err) {
    console.log(`Error [getArtistData] for ${artistId}: ` + err.message);
    throw err;
  }
}

export async function searchArtists(name, page, limit) {
  name = name.trim().toLowerCase();
  if (artistsSearchCache.has(name)) {
    return getPaginatedResults(artistsSearchCache.get(name), page, limit);
  } else {
    try {
      const response = await axios.get(`${MB_URL}/artist`, {
        params: {
          query: name,
          fmt: "json",
          limit: 100,
        },
        headers: headers,
      });

      const sortedFiltered = response.data.artists
        .sort((a, b) => b.score - a.score)
        .filter((artist) => artist.score >= 90);

      const result = sortedFiltered.map((artist) => ({
        id: artist.id,
        name: artist.name,
        type: "artist",
      }));

      artistsSearchCache.set(name, result);
      const paginated_artists = getPaginatedResults(result, page, limit);
      const data = {
        total_count_artists: result.length,
        count_artists: paginated_artists.length,
        paginated_artists: paginated_artists,
      };
      return data;
    } catch (err) {
      console.error(`[searchArtists] Error: ${err.message}`);
      return [];
    }
  }
}
