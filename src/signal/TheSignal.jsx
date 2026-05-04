import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hls from "hls.js";
import { SIGNAL_HLS_URL, UPLOAD_WORKER_URL } from "../config";
import DPWallpaper from "../entry/DPWallpaper";

const WORKER_URL = UPLOAD_WORKER_URL;
const CHAT_POLL_MS = 3000;
const TIER_CAN_CHAT = new Set(["A", "B", "C", "D"]);

function formatChatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    return "";
  }
}

function SignalPlayer({ onError }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(SIGNAL_HLS_URL);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) onError?.("STREAM UNAVAILABLE");
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari)
      video.src = SIGNAL_HLS_URL;
      video.play().catch(() => {});
    } else {
      onError?.("BROWSER DOES NOT SUPPORT HLS");
    }
  }, [onError]);

  return (
    <video
      ref={videoRef}
      className="signal-video"
      playsInline
      controls
      autoPlay
      aria-label="The Signal live stream"
    />
  );
}

function ChatFeed({ messages, tier, author, onSend }) {
  const bottomRef = useRef(null);
  const [draft, setDraft] = useState("");
  const canPost = TIER_CAN_CHAT.has(tier);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim() || !canPost) return;
    onSend(draft.trim());
    setDraft("");
  };

  return (
    <div className="signal-chat">
      <div className="signal-chat-header">LIVE CHAT</div>
      <div
        className="signal-chat-feed"
        role="log"
        aria-live="polite"
        aria-label="Live chat"
      >
        {messages.length === 0 && (
          <div className="signal-chat-empty">— NO MESSAGES YET —</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="signal-chat-msg">
            <span className="signal-chat-author">{msg.author}</span>
            <span className="signal-chat-body">{msg.body}</span>
            <span className="signal-chat-time">
              {formatChatTime(msg.created_at)}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="signal-chat-form" onSubmit={handleSubmit}>
        {canPost ? (
          <>
            <input
              className="signal-chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="MESSAGE"
              maxLength={280}
              spellCheck={false}
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="signal-chat-send"
              disabled={!draft.trim()}
              aria-label="Send message"
            >
              ↑
            </button>
          </>
        ) : (
          <div className="signal-chat-locked">
            MASTERS · MEMBERS · MUSES ONLY
          </div>
        )}
      </form>
    </div>
  );
}

export default function TheSignal({ signalTitle, onBack, sessionMeta }) {
  const [messages, setMessages] = useState([]);
  const [streamError, setStreamError] = useState(null);
  const pollRef = useRef(null);

  const author = sessionMeta?.owner || "LISTENER";
  const tier = sessionMeta?.tier || "G";

  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch(`${WORKER_URL}/signal/chat`);
      if (res.ok) setMessages(await res.json());
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchChat();
    pollRef.current = setInterval(fetchChat, CHAT_POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchChat]);

  const handleSend = async (body) => {
    try {
      await fetch(`${WORKER_URL}/signal/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, tier, body }),
      });
      fetchChat();
    } catch (_) {}
  };

  return (
    <motion.div
      className="signal-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <DPWallpaper opacity={0.35} />

      <div className="signal-topbar">
        <button
          className="signal-back"
          onClick={onBack}
          aria-label="Leave stream"
        >
          ← LEAVE
        </button>
        <div className="signal-live-badge" aria-label="Live">
          <span className="signal-live-dot" aria-hidden="true" />
          LIVE
        </div>
        <div className="signal-title">{signalTitle || "THE SIGNAL"}</div>
      </div>

      <div className="signal-body">
        <div className="signal-player-wrap">
          {streamError ? (
            <div className="signal-stream-error">{streamError}</div>
          ) : (
            <SignalPlayer onError={setStreamError} />
          )}
        </div>
        <ChatFeed
          messages={messages}
          tier={tier}
          author={author}
          onSend={handleSend}
        />
      </div>
    </motion.div>
  );
}
