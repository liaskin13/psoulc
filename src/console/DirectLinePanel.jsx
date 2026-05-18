import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./DirectLinePanel.css";

const DIRECT_LINE_KEY = "psc_direct_line";
const DIRECT_LINE_CHANNEL = "psc_direct_line_channel";

function loadDirectMessages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DIRECT_LINE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveDirectMessages(messages) {
  try {
    localStorage.setItem(DIRECT_LINE_KEY, JSON.stringify(messages));
  } catch (_) {}
}

export default function DirectLinePanel({ viewer, variant = "architect", externalOpen = 0, hideTrigger = false }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (externalOpen > 0) setOpen(true);
  }, [externalOpen]);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(loadDirectMessages);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const channelRef = useRef(null);

  const peer = viewer === "L" ? "D" : "L";

  const syncFromStorage = useCallback(() => {
    setMessages(loadDirectMessages());
  }, []);

  const persistMessages = useCallback((nextMessages) => {
    saveDirectMessages(nextMessages);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: "sync" });
    }
  }, []);

  useEffect(() => {
    syncFromStorage();

    if ("BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel(DIRECT_LINE_CHANNEL);
      channelRef.current.onmessage = (event) => {
        if (event?.data?.type === "sync") {
          syncFromStorage();
        }
      };
    }

    const onStorage = (e) => {
      if (e.key !== DIRECT_LINE_KEY) return;
      syncFromStorage();
    };

    window.addEventListener("storage", onStorage);

    // Polling provides a reliability floor when cross-tab events are dropped.
    const pollId = window.setInterval(syncFromStorage, 1500);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(pollId);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, [syncFromStorage]);

  useEffect(() => {
    if (!open) return;
    let changed = false;
    const next = messages.map((msg) => {
      if (msg.to !== viewer) return msg;
      if (Array.isArray(msg.readBy) && msg.readBy.includes(viewer)) return msg;
      changed = true;
      return { ...msg, readBy: [...(msg.readBy || []), viewer] };
    });

    if (changed) {
      setMessages(next);
      persistMessages(next);
    }
  }, [open, messages, persistMessages, viewer]);

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  const thread = useMemo(() => {
    return messages
      .filter(
        (m) =>
          (m.from === viewer && m.to === peer) ||
          (m.from === peer && m.to === viewer),
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }, [messages, peer, viewer]);

  const unreadCount = useMemo(() => {
    return messages.filter(
      (m) => m.to === viewer && !(m.readBy || []).includes(viewer),
    ).length;
  }, [messages, viewer]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const sendMessage = () => {
    const body = draft.trim();
    if (!body && !voiceDraft) return;
    const next = [
      ...messages,
      {
        id: `direct-${Date.now()}`,
        from: viewer,
        to: peer,
        body,
        audioData: voiceDraft,
        createdAt: new Date().toISOString(),
        readBy: [viewer],
      },
    ];
    setMessages(next);
    persistMessages(next);
    setDraft("");
    setVoiceDraft(null);
  };

  const startVoiceCapture = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) {
          const reader = new FileReader();
          reader.onloadend = () => setVoiceDraft(reader.result);
          reader.readAsDataURL(blob);
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (_) {
      setIsRecording(false);
    }
  };

  const stopVoiceCapture = () => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <>
      {!hideTrigger && (
        <button
          className={`direct-line-trigger ${variant === "architect" ? "architect" : "d-mode"}`}
          onClick={() => setOpen(true)}
          aria-expanded={open}
        >
          DIRECT LINE
          {unreadCount > 0 && (
            <span className="direct-line-badge">{unreadCount}</span>
          )}
        </button>
      )}

      {open && (
        <div
          className="direct-line-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Direct line"
          onClick={() => setOpen(false)}
        >
          <div
            className={`direct-line-panel ${variant === "architect" ? "architect" : "d-mode"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="direct-line-head">
              <span className="direct-line-title">
                DIRECT LINE · {viewer} ↔ {peer}
              </span>
              <button
                className="direct-line-close"
                onClick={() => setOpen(false)}
                aria-label="Close direct line"
              >
                ✕
              </button>
            </div>

            <div className="direct-line-thread">
              {thread.length === 0 ? (
                <div className="direct-line-empty">NO DIRECT MESSAGES YET</div>
              ) : (
                thread.map((msg) => (
                  <div
                    key={msg.id}
                    className={`direct-line-msg ${msg.from === viewer ? "outbound" : "inbound"}`}
                  >
                    <div className="direct-line-meta">
                      {msg.from} ·{" "}
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {msg.body && (
                      <div className="direct-line-body">{msg.body}</div>
                    )}
                    {msg.audioData && (
                      <audio
                        className="direct-line-audio"
                        controls
                        preload="none"
                        src={msg.audioData}
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="direct-line-compose">
              <textarea
                className="direct-line-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${peer}`}
                aria-label={`Message ${peer}`}
                maxLength={800}
              />
              <div className="direct-line-tools">
                <button
                  className="direct-line-rec"
                  onClick={isRecording ? stopVoiceCapture : startVoiceCapture}
                >
                  {isRecording ? "STOP" : "REC"}
                </button>
                {voiceDraft && (
                  <button
                    className="direct-line-clear-voice"
                    onClick={() => setVoiceDraft(null)}
                  >
                    CLEAR VOICE
                  </button>
                )}
                <button
                  className="direct-line-send"
                  onClick={sendMessage}
                  disabled={!draft.trim() && !voiceDraft}
                >
                  SEND
                </button>
              </div>
              {voiceDraft && (
                <audio
                  className="direct-line-audio direct-line-audio-draft"
                  controls
                  preload="none"
                  src={voiceDraft}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
