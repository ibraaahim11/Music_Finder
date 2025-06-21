import axios from "axios";

// Url of the MusicBrainz API
const MB_URL = "https://musicbrainz.org/ws/2";
// header included with MusicBrainz API requests
const headers = {
  "User-Agent": "MusicFinder/1.0 ( exchangegiftsnow@yahoo.com )",
};

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
      release_date: response.data["first-release-date"],
      artists: response.data["artist-credit"].map((artistObj) => {
        return { name: artistObj.name, id: artistObj.artist.id };
      }),
    };

    console.log(response.data["artist-credit"]);
    //console.log(songData);

    return songData;

    //  todo
  } catch (err) {
    console.error(err);
  }
}
// get songs by artist id, provided limit and page of search
export async function getSongsByArtistId(artistId, limit, page = 1) {
  // provide offset and limit in parameters
  const offset = (page - 1) * limit;
  const response_songs = await axios.get(MB_URL + "/recording", {
    params: {
      fmt: "json",
      artist: artistId,
      limit: limit,
      offset: offset,
    },
    headers: headers,
  });

  // return total count of songs by artist, count of songs gotten, and the actual songs gotten
  const songs_data = {
    total_count_songs: response_songs.data["recording-count"],
    count_songs: 0,
    songs: response_songs.data.recordings.map((song) => ({
      id: song.id,
      title: song.title,
    })),
  };

  songs_data["count_songs"] = songs_data.songs.length;

  return songs_data;
}
