import axios from "axios";
import { getCoverImageUrl } from "./coverImage_controller.js";

// Url of the MusicBrainz API
const MB_URL = "https://musicbrainz.org/ws/2";
// header included with MusicBrainz API requests
const headers = {
  "User-Agent": "MusicFinder/1.0 ( exchangegiftsnow@yahoo.com )",
};

// function to get data of album from full id
export async function getAlbumData(releaseGroupId) {
  try {
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

    // get a specific release
    const releases = groupRes.data.releases || [];
    if (releases.length === 0) {
      throw new Error("No releases found for this release group.");
    }
    const chosenRelease = releases[0];
    const albumId = chosenRelease.id;

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

    console.log(albumData);
    return albumData;

    //  todo
  } catch (err) {
    console.error(err);
  }
}

// function to return albums by artist id , given limit and page
export async function getAlbumsByArtistId(artistId, limit, page = 1) {
  const offset = (page - 1) * limit;
  // offset and limit provided in parameters
  const response_albums = await axios.get(MB_URL + "/release-group", {
    params: {
      fmt: "json",
      artist: artistId,
      limit: limit,
      type: "album", // to get only albums, exclude singles/EPs/etc.
      offset: offset,
    },
    headers: headers,
  });

  // object returned consists of total count of albums by artist, count of albums gotten, and the albums gotten.
  const albums_data = {
    total_count_albums: response_albums.data["release-group-count"],
    count_albums: 0,
    albums: response_albums.data["release-groups"].map((album) => ({
      id: album.id,
      title: album.title,
    })),
  };
  albums_data["count_albums"] = albums_data.albums.length;
  return albums_data;
}
