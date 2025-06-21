import express from "express";
import {
  getSongData,
  getSongsByArtistId,
} from "./controllers/song_controller.js";
import {
  getAlbumData,
  getAlbumsByArtistId,
} from "./controllers/album_controller.js";
import { getArtistData } from "./controllers/artist_controller.js";

const app = express();
const PORT = 3000;

const PAGE_LIMIT = 12;
// Homepage
app.get("/", (req, res) => {
  res.send("homepage");
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
