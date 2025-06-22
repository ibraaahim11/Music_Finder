import express from "express";
import {
  getSongData,
  getSongsByArtistId,
  searchSongs,
} from "./controllers/song_controller.js";
import {
  getAlbumData,
  getAlbumsByArtistId,
  searchAlbums
} from "./controllers/album_controller.js";
import {
  getArtistData,
  searchArtists,
} from "./controllers/artist_controller.js";

const app = express();
const PORT = 3000;

const PAGE_LIMIT = 12;
// Homepage
app.get("/", (req, res) => {
  res.send("homepage");
});

app.get("/search", async (req, res) => {
  let { query, type, page } = req.query;
  // perform search logic here
  let results;
  query = query.trim().toLowerCase();
  switch (type) {
    case "artist":
      results = await searchArtists(query, page, PAGE_LIMIT);

      break;
    case "song":
      results = await searchSongs(query, page, PAGE_LIMIT);

      break;
    case "album":
            results = await searchAlbums(query, page, PAGE_LIMIT);
      break;
  }
  res.send(results);

  // 1) perform actual search requests with api
  // 2) return data that consists of

  /*
  - total num of results
  - the actual results 
  - maybe 12 per page
  - artists:
    - name
    - also say enohom artist (type)
    - id 
    -pic if possible
  -song:
    -id
    -name
    -also say enaha song (type)
    - artist
    - pic / cover

  -albums:
    -id
    -name
    -also say enaha album (type)
    - artist
    - pic / cover




  */
});

// Page of full song
app.get("/song/:id", async (req, res) => {
  const songId = req.params.id;

  // full data
  const songData = await getSongData(songId);

  // console.log(songData);

  res.send(songData);
});

// Page of full album
app.get("/album/:id", async (req, res) => {
  const albumId = req.params.id;
  // full data
  const albumData = await getAlbumData(albumId);

  // console.log(albumData);

  res.send(albumData);
});

// Page of full artist
app.get("/artist/:id", async (req, res) => {
  const artistId = req.params.id;
  // full data
  const artistData = await getArtistData(artistId);

  // console.log(artistData);

  res.send(artistData);
});

// Page of full artist songs
app.get("/artist/:id/songs", async (req, res) => {
  const artistId = req.params.id;
  const page = parseInt(req.query.page) || 1;

  const songs = await getSongsByArtistId(artistId, PAGE_LIMIT, page);

  // console.log(songs);

  res.send(songs);
});

// Page of full artist albums
app.get("/artist/:id/albums", async (req, res) => {
  const artistId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const albums = await getAlbumsByArtistId(artistId, PAGE_LIMIT, page);

  // console.log(albums);
  res.send(albums);
});

app.listen(PORT, () => {
  console.log("Listening to port " + PORT);
});
