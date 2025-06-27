import express from "express";
import expressLayouts from "express-ejs-layouts";
import {
  getSongData,
  getSongsByArtistId,
  searchSongs,
} from "./controllers/song_controller.js";
import {
  getAlbumData,
  getAlbumsByArtistId,
  searchAlbums,
} from "./controllers/album_controller.js";
import {
  getArtistData,
  searchArtists,
} from "./controllers/artist_controller.js";

const PORT = 3000;
const PAGE_LIMIT = 12;

// create app
const app = express();

app.set("view engine", "ejs");
// activates layout middleware
app.use(expressLayouts);
// sets default layout file to be views/layout.ejs
app.set("layout", "layout");
// static files will be in public/
app.use(express.static("public"));

// Homepage
app.get("/", (req, res) => {
  res.render("pages/home", { title: "home" });
});

app.get("/search", async (req, res) => {
  let { query, type, page } = req.query;
  // perform search logic here
  let results;
  query = query.trim().toLowerCase();
  try {
    switch (type) {
      case "song":
        results = await searchSongs(query, page, PAGE_LIMIT);

        break;
      case "album":
        results = await searchAlbums(query, page, PAGE_LIMIT);
        break;
      // default or artist
      default:
        results = await searchArtists(query, page, PAGE_LIMIT);

        break;
    }
    res.send(results);
  } catch (err) {
    console.log(
      `Error [/search] (query = ${query}, page = ${page}): ` + err.message
    );
  }
});

// Page of full song
app.get("/song/:id", async (req, res) => {
  const songId = req.params.id;

  // full data
  try {
    const songData = await getSongData(songId);

    // console.log(songData);

    res.send(songData);
  } catch (err) {
    console.log(`Error [/song/${songId}]: ` + err.message);
  }
});

// Page of full album
app.get("/album/:id", async (req, res) => {
  const albumId = req.params.id;
  // full data
  try {
    const albumData = await getAlbumData(albumId);

    // console.log(albumData);

    res.send(albumData);
  } catch (err) {
    console.log(`Error [/artist/${albumId}]: ` + err.message);
  }
});

// Page of full artist
app.get("/artist/:id", async (req, res) => {
  const artistId = req.params.id;
  // full data
  try {
    const artistData = await getArtistData(artistId);

    // console.log(artistData);

    res.send(artistData);
  } catch (err) {
    console.log(`Error [/artist/${artistId}]: ` + err.message);
  }
});

// Page of full artist songs
app.get("/artist/:id/songs", async (req, res) => {
  const artistId = req.params.id;
  const page = parseInt(req.query.page) || 1;

  try {
    const songs = await getSongsByArtistId(artistId, PAGE_LIMIT, page);

    // console.log(songs);

    res.send(songs);
  } catch (err) {
    console.log(`Error [/artist/${artistId}/songs]: ` + err.message);
  }
});

// Page of full artist albums
app.get("/artist/:id/albums", async (req, res) => {
  const artistId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  try {
    const albums = await getAlbumsByArtistId(artistId, PAGE_LIMIT, page);

    // console.log(albums);
    res.send(albums);
  } catch (err) {
    console.log(`Error [/artist/${artistId}/albums]: ` + err.message);
  }
});

app.listen(PORT, () => {
  console.log("Listening to port " + PORT);
});
