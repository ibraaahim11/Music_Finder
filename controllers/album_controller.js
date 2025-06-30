import axios from "axios";
import { getCoverImageUrl } from "./coverImage_controller.js";
import {
  getPaginatedResults,
  filterDuplicateEntries,
} from "./utils_controller.js";
// Url of the MusicBrainz API
const MB_URL = "https://musicbrainz.org/ws/2";
// header included with MusicBrainz API requests
const headers = {
  "User-Agent": "MusicFinder/1.0 ( exchangegiftsnow@yahoo.com )",
};

const albumSearchCache = new Map(); //
const artistAlbumsCache = new Map();

const albumsPageCache = new Map();
// function to get data of album from release group id
export async function getAlbumData(releaseGroupId) {
  try {
    // get result object
    const groupRes = await getGroupResForGroup(releaseGroupId);

    // get specific release id (an actual album not release-group)
    const albumId = getReleaseIdForGroup(groupRes.data.releases || []);

    // get info from specific release

    const response = await axios.get(MB_URL + `/release/${albumId}`, {
      params: {
        fmt: "json",
        inc: "artist-credits+recordings",
      },
      headers: headers,
    });
    const rawDate = response.data.date;

    let releaseDateFormatted = null;
    if (rawDate) {
      const date = new Date(rawDate);
      releaseDateFormatted = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(date);
    }
    // creating object with needed info
    const albumData = {
      id: releaseGroupId,
      title: groupRes.data.title,
      release_date: releaseDateFormatted,
      cover_url: await getCoverImageUrl(albumId),
      artists: response.data["artist-credit"].map((artistObj) => {
        return { name: artistObj.name, id: artistObj.artist.id };
      }),
      numSongs: 0,
      songs: [], // We'll add songs info here
    };

    // array called media -> bunch of mediums -> each medium bunch of trakcs -> each track bunch of songs
    // put all songs in albumData.songs
    const media = response.data.media || [];

    media.forEach((medium) => {
      if (medium.tracks) {
        const formattedTracks = medium.tracks.map((song) => ({
          id: song.recording.id,
          title: song.recording.title,
        }));
        albumData.songs = albumData.songs.concat(formattedTracks);
      }
    });
    albumData.numSongs = albumData.songs.length;

    return albumData;

    //  todo
  } catch (err) {
    console.error(
      `Error in getAlbumData for release group ${releaseGroupId}: ${err.message}`
    );
    throw err;
  }
}

/// Function to return albums by artist id, given limit and page
// export async function getAlbumsByArtistId(artistId, limit, page = 1) {
//   try {
//     const offset = (page - 1) * limit;

//     // Get release groups (albums) for the artist
//     const response_albums = await axios.get(MB_URL + "/release-group", {
//       params: {
//         fmt: "json",
//         artist: artistId,
//         limit: limit,
//         type: "album", // only albums
//         offset: offset,
//       },
//       headers: headers,
//     });

//     const filtered_data = filterDuplicateEntries(
//       response_albums.data["release-groups"]
//     );
//     // // Get detailed data for each release-group
//     // // await promise.all means do all these functions in parallel and wait for all of them to finish
//     const albums = await Promise.all(
//       filtered_data.map(async (album) => {
//         try {
//           // Wait for the full group data
//           const groupRes = await getGroupResForGroup(album.id);
//           const releases = groupRes.data.releases || [];

//           // Get a release ID (your custom logic)
//           const releaseId = getReleaseIdForGroup(releases);

//           // Get the cover image
//           const coverUrl = await getCoverImageUrl(releaseId);

//           return {
//             id: album.id,
//             title: album.title,
//             cover_url: coverUrl,
//           };
//         } catch (err) {
//           console.error(`[Album Cover Fetch] ${album.id}: ${err.message}`);
//           return null;
//         }
//       })
//     );

//     // Build the response object
//     const albums_data = {
//       total_count_albums: filtered_data.length,
//       count_albums: albums.length,
//       albums: albums,
//     };

//     return albums_data;
//   } catch (err) {
//     console.error(
//       `[getAlbumsByArtistId] Error for artist ${artistId}: ${
//         err?.message || "Unknown error"
//       }`
//     );
//     throw err;
//   }
// }

export async function searchAlbums(name, page, limit) {
  name = name.trim().toLowerCase();
  if (albumSearchCache.has(name)) {
    const paginated_albums = getPaginatedResults(
      albumSearchCache.get(name),
      page,
      limit
    );
    const data = {
      total_count_albums: albumSearchCache.get(name).length,
      count_albums: paginated_albums.length,
      paginated_albums: paginated_albums || [],
    };
    return data;
  } else {
    try {
      const response = await axios.get(`${MB_URL}/release-group`, {
        params: {
          query: name,
          fmt: "json",
          limit: 100,
        },
        headers: headers,
      });

      const sortedFiltered = response.data["release-groups"]
        .sort((a, b) => b.score - a.score)
        .filter((album) => album.score >= 90);

      const result = sortedFiltered.map((album) => ({
        id: album.id,
        name: album.title,
        artists: album["artist-credit"].map((artistObj) => {
          return { name: artistObj.name, id: artistObj.artist.id };
        }),
        type: "artist",
      }));

      albumSearchCache.set(name, result);
      const paginated_albums = getPaginatedResults(
        albumSearchCache.get(name),
        page,
        limit
      );
      const data = {
        total_count_albums: result.length,
        count_albums: paginated_albums.length,
        paginated_albums: paginated_albums || [],
      };
      return data;
    } catch (err) {
      console.error(`[searchAlbums] Error: ${err.message}`);
      return [];
    }
  }
}

// function that takes releases and picks first release
function getReleaseIdForGroup(releases) {
  // get a specific release
  if (releases.length === 0) {
    throw new Error("No releases found for this release group.");
  }
  const chosenRelease = releases[0];
  return chosenRelease.id;
}

// function to get result object from release group id
async function getGroupResForGroup(releaseGroupId) {
  // we get from release group
  const groupRes = await axios.get(
    MB_URL + `/release-group/${releaseGroupId}`,
    {
      params: {
        fmt: "json",
        inc: "releases",
      },
      headers: headers,
    }
  );
  return groupRes;
}

// Version 2 which gets all albums then does pagination

export async function getAlbumsByArtistId(artistId, limit, page = 1) {
  let filtered_albums;
  // see if cached
  if (artistAlbumsCache.has(artistId)) {
    filtered_albums = artistAlbumsCache.get(artistId);
  } else {
    try {
      // Get release groups (albums) for the artist
      const response_albums = await axios.get(MB_URL + "/release-group", {
        params: {
          fmt: "json",
          artist: artistId,
          limit: 100,
          type: "album", // only albums
        },
        headers: headers,
      });

      // filter duplicate entries 
      filtered_albums = filterDuplicateEntries(
        response_albums.data["release-groups"].filter(
          (group) =>
            group["primary-type"] === "Album" &&
            !group["secondary-types"]?.includes("Live") &&
            !group["secondary-types"]?.includes("Compilation") &&
            !group["secondary-types"]?.includes("Remix") &&
            !group["secondary-types"]?.includes("Soundtrack")
        )
      );

      artistAlbumsCache.set(artistId, filtered_albums);
    } catch (err) {
      console.error(
        `[getAlbumsByArtistId] Error for artist ${artistId}: ${
          err?.message || "Unknown error"
        }`
      );
      throw err;
    }
  }

  // pages will be cached to decrease number of cover_url requests
  let paginated_albums;
  // see if cached
  if (albumsPageCache.has(`${artistId} page ${page}`)) {
    paginated_albums = albumsPageCache.get(`${artistId} page ${page}`);
  }

  else{
    // if not -> paginate first
  const paginated_albums_all = getPaginatedResults(
    filtered_albums,
    page,
    limit
  );

// Get detailed data for each release-group
// await promise.all means do all these functions in parallel and wait for all of them to finish
   paginated_albums = await Promise.all(
    paginated_albums_all.map(async (album) => {
      try {
        // Wait for the full group data
        const groupRes = await getGroupResForGroup(album.id);
        const releases = groupRes.data.releases || [];

        // Get a release ID (
        const releaseId = getReleaseIdForGroup(releases);

        // Get the cover image
        const coverUrl = await getCoverImageUrl(releaseId);

        return {
          id: album.id,
          title: album.title,
          cover_url: coverUrl,
        };
      } catch (err) {
        console.error(`[Album Cover Fetch] ${album.id}: ${err.message}`);
        return null;
      }
    })
  );
}

  // Build the response object
  const albums_data = {
    total_count_albums: filtered_albums.length,
    count_albums: paginated_albums.length,
    paginated_albums: paginated_albums,
  };
  return albums_data;
}
