import React, { useEffect, useState } from "react";
import "../styles/star-rating.css";

export default function StarRating({ eventId, onRate }) {
  const storageKey = `ratings:${eventId}`;
  const userKey = `userRating:${eventId}`;

  const [userRating, setUserRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const ur = Number(localStorage.getItem(userKey) || 0);
    setUserRating(ur);
    updateStatsFromArray(stored);
  }, [eventId]);

  function updateStatsFromArray(arr) {
    if (!arr || arr.length === 0) {
      setAvg(0);
      setCount(0);
      return;
    }
    const sum = arr.reduce((s, v) => s + Number(v), 0);
    setCount(arr.length);
    setAvg(sum / arr.length);
  }

  function handleRate(value) {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const prev = Number(localStorage.getItem(userKey) || 0);

    if (prev && prev > 0) {
      // replace first occurrence of prev with new value
      const idx = stored.indexOf(prev);
      if (idx !== -1) stored[idx] = value;
      else stored.push(value);
    } else {
      stored.push(value);
    }

    localStorage.setItem(storageKey, JSON.stringify(stored));
    localStorage.setItem(userKey, String(value));
    setUserRating(value);
    updateStatsFromArray(stored);
    if (typeof onRate === "function") onRate(value);
  }

  return (
    <div className="star-rating" aria-label="Etkinlik Oylama">
      <div className="stars" role="radiogroup" aria-label="Yıldız oylama">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            className={`star-btn ${
              (hover || userRating) >= i || avg >= i - 0.5 ? "filled" : ""
            }`}
            onClick={() => handleRate(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-checked={userRating === i}
            role="radio"
            title={`${i} yıldız`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="rating-meta">
        <span className="avg">{avg ? avg.toFixed(1) : "—"} / 5</span>
        <span className="count">{count} oy</span>
        {userRating ? <span className="user">Senin oyun: {userRating} ⭐</span> : null}
      </div>
    </div>
  );
}
