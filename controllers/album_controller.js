import axios from "axios";
import { getCoverImageUrl } from "./coverImage_controller.js";

// Url of the MusicBrainz API
const MB_URL = "https://musicbrainz.org/ws/2";
// header included with MusicBrainz API requests
const headers = {
  "User-Agent": "MusicFinder/1.0 ( exchangegiftsnow@yahoo.com )",
};

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

    // creating object with needed info
    const albumData = {
      id: releaseGroupId,
      title: groupRes.data.title,
      release_date: response.data.date,
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
  }
}

/// Function to return albums by artist id, given limit and page
export async function getAlbumsByArtistId(artistId, limit, page = 1) {
  try {
    const offset = (page - 1) * limit;

    // Get release groups (albums) for the artist
    const response_albums = await axios.get(MB_URL + "/release-group", {
      params: {
        fmt: "json",
        artist: artistId,
        limit: limit,
        type: "album", // only albums
        offset: offset,
      },
      headers: headers,
    });

    // // Get detailed data for each release-group
    // // await promise.all means do all these functions in parallel and wait for all of them to finish
    const albums = await Promise.all(
      response_albums.data["release-groups"].map(async (album) => {
        try {
          console.log(album.title);
          // Wait for the full group data
          const groupRes = await getGroupResForGroup(album.id);
          const releases = groupRes.data.releases || [];

          // Get a release ID (your custom logic)
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

 

    // Build the response object
    const albums_data = {
      total_count_albums: response_albums.data["release-group-count"],
      count_albums: albums.length,
      albums: albums,
    };

    return albums_data;
  } catch (err) {
    console.error(
      `[getAlbumsByArtistId] Error for artist ${artistId}: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

// takes releases and picks first
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
  // fmt -> specify return type json or xml
  // inc parameter -> other information you would like to be included

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
