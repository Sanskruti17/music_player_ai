import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [theme, setTheme] = useState("dark");

  const [userName, setUserName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);
  const [tempInput, setTempInput] = useState("");

  const askAI = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSongs([]);
    setErrorMsg("");

    try {
      const res = await axios.post("http://localhost:3000/api/recommend", {
        message: query,
      });

      const results = res.data.songs || [];

      if (results.length === 0) {
        setErrorMsg("No Spotify previews available for this mood 😢");
      }

      setSongs(results);
    } catch (err) {
      console.error("FRONTEND ERROR:", err);
      setErrorMsg("Server error. Try again later.");
    }

    setLoading(false);
  };

  const handleMoodSubmit = () => {
    if (!tempInput.trim()) return;

    setQuery(tempInput);
    askAI();
    setTempInput("");
    setShowMoodPrompt(false);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const skeletonArray = Array.from({ length: 6 });

  return (
    <div className={`app-container ${theme}`}>

      {/* ---------------- MODAL 1: ASK NAME ---------------- */}
      {showNamePrompt && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">Hey 👋</h2>
            <p className="modal-sub">What's your name?</p>

            <input
              type="text"
              className="modal-input"
              placeholder="Enter your name..."
              value={tempInput}
              onChange={(e) => setTempInput(e.target.value)}
            />

            <button
              className="modal-btn"
              onClick={() => {
                if (!tempInput.trim()) return;
                setUserName(tempInput.trim());
                setTempInput("");
                setShowNamePrompt(false);
                setShowMoodPrompt(true);
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: ASK MOOD ---------------- */}
      {showMoodPrompt && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">Nice to meet you, {userName} 😎</h2>
            <p className="modal-sub">What would you like to listen today?</p>

            <input
              type="text"
              className="modal-input"
              placeholder="Try: Arijit Singh, sad songs, 90s bollywood..."
              value={tempInput}
              onChange={(e) => setTempInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && tempInput.trim() && handleMoodSubmit()
              }
            />

            <button className="modal-btn" onClick={handleMoodSubmit}>
              Play Music →
            </button>
          </div>
        </div>
      )}

      {/* ---------- TOP LEFT BARS + TOP RIGHT THEME ---------- */}
      <div className="top-floating">
        <div className="top-left">
          <div className="music-bars">
            <span className="bar bar1" />
            <span className="bar bar2" />
            <span className="bar bar3" />
            <span className="bar bar4" />
          </div>
        </div>

        <div className="top-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </div>

      {/* ---------- HERO ---------- */}
      <div className="hero">
        <h1 className="main-title">
          🎧 {userName ? `${userName}'s Smart AI Music Player` : "AI Smart Music Player"}
        </h1>
        <p className="subtitle">
          Tell your mood / songs → AI picks the perfect Spotify tracks 🎵
        </p>
      </div>


      {/* ---------- SEARCH BAR ---------- */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Try: sad hindi songs, arijit singh, 90s bollywood..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !loading && askAI()
          }
        />

        <button className="search-btn" onClick={askAI} disabled={loading}>
          {loading ? "Searching..." : "Find Music"}
        </button>
      </div>

      {loading && <p className="loader">⏳ Finding the perfect vibe...</p>}
      {errorMsg && <p className="error-msg">{errorMsg}</p>}

      {/* ---------- SONG GRID ---------- */}
      <div className="song-grid">
        {loading
          ? skeletonArray.map((_, index) => (
            <div className="song-card skeleton" key={index}>
              <div className="thumbnail skeleton-thumb" />
              <div className="song-info">
                <div className="skeleton-line line-lg" />
                <div className="skeleton-line line-sm" />
                <div className="skeleton-line line-sm" />
              </div>
            </div>
          ))
          : songs.map((song, index) => (
            <div
              className="song-card"
              key={index}
              onClick={() => window.open(song.spotify_url, "_blank")}
              style={{ cursor: "pointer", animationDelay: `${index * 0.07}s` }}
            >
              <div className="thumbnail-wrapper">
                <img src={song.image} alt={song.title} className="thumbnail" />
                <div className="play-overlay">▶</div>
              </div>

              <div className="song-info">
                <h2 className="song-title">{song.title}</h2>
                <p className="song-artist">{song.artist}</p>

                {song.preview_url ? (
                  <audio controls className="audio-player">
                    <source src={song.preview_url} />
                  </audio>
                ) : (
                  <p className="no-preview">❌ No Preview Available</p>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default App;
