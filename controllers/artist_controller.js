import axios from "axios";
import { getSongsByArtistId } from "./song_controller.js";
import { getAlbumsByArtistId } from "./album_controller.js";

// Url of the MusicBrainz API
const MB_URL = "https://musicbrainz.org/ws/2";
// header included with MusicBrainz API requests
const headers = {
  "User-Agent": "MusicFinder/1.0 ( exchangegiftsnow@yahoo.com )",
};

// function to get data of album from full id
export async function getArtistData(artistId) {
  try {
    // fmt -> specify return type json or xml
    const response_artist = await axios.get(MB_URL + `/artist/${artistId}`, {
      params: {
        fmt: "json",
      },
      headers: headers,
    });

    // creating object with needed info

    // get 5 songs from artist
    const songs = await getSongsByArtistId(artistId, 5);
    // get 5 albums from artist
    const albums = await getAlbumsByArtistId(artistId, 5);

    // songs alnd albums object provide total count and count inside object
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

    console.log(artistData);
    return artistData;

    //  todo
  } catch (err) {
    console.error(err);
  }
}
