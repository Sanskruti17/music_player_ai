import express from "express";
import axios from "axios";
import request from "request";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

import OpenAI from "openai";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


async function getKeywordFromLLM(userMsg) {
  try {
    const prompt = `
      Convert the user's text into a simple 5-6 word Spotify search keyword.
    ALWAYS return Bollywood / Indian music terms such as:
    "bollywood hits", "hindi romantic", "sad hindi song", "punjabi beats", 
    "lofi hindi", "arijit singh", "kishore kumar", "90s bollywood", etc.
    until and unless user mention english songs specifically or any songs from other language.
    Only return keyword, no explanation.
    User: ${userMsg}
    `;

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",   
      messages: [{ role: "user", content: prompt }],
      max_tokens: 20,
      temperature: 0.4
    });

    const keyword = response.choices[0].message.content.trim();
    console.log("LLM KEYWORD:", keyword);

    return keyword || "trending songs";
  } catch (err) {
    console.log("LLM ERROR:", err);
    return "trending songs";
  }
}

function cleanKeyword(raw) {
  if (!raw) return "popular songs";

  let cleaned = raw
    .toLowerCase()
    .replace(/vibes|ballad|ambient|melancholic|mellow/g, "")
    .trim();

  if (cleaned.length < 2) cleaned = "popular songs";

  return cleaned ;
}

async function getSpotifyToken() {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: { grant_type: "client_credentials" },
    json: true,
  };
  
  return new Promise((resolve, reject) => {
    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(body.access_token);
      } else {
        console.error("TOKEN ERROR:", body);
        reject("Spotify Authentication Failed");
      }
    });
  });
}


async function searchSpotify(keyword) {
  try {
    const token = await getSpotifyToken();

    const searchURL = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      keyword
    )}&type=track&market=IN&limit=20`;
    console.log("SPOTIFY SEARCH URL:", searchURL);

    const searchRes = await axios.get(searchURL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const items = searchRes.data.tracks.items;

    const results = [];

    for (const item of items) {
      if (!item.id) continue;

      const trackURL = `https://api.spotify.com/v1/tracks/${item.id}`;
      const trackRes = await axios.get(trackURL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const track = trackRes.data;

      results.push({
        id: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(", "),
        image: track.album.images?.[0]?.url, 
        album: track.album.name,
        popularity: track.popularity,
        spotify_url: track.external_urls.spotify
      });

      if (results.length >= 10) break;
    }

    console.log("FINAL TRACK RESULTS:", results);
    return results;
  } catch (err) {
    console.log("SPOTIFY SEARCH ERROR:", err);
    return [];
  }
}


router.post("/recommend", async (req, res) => {
  try {
    const { message } = req.body;

    const rawKeyword = await getKeywordFromLLM(message);

    const keyword = cleanKeyword(rawKeyword);

    const songs = await searchSpotify(keyword);

    res.json({ keyword, songs });
  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({ error: "Server failed" });
  }
});

export default router;
