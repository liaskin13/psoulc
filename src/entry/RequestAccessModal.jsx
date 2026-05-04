import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSystem } from "../state/SystemContext";

// ── REQUEST ACCESS MODAL ───────────────────────────────────────────────────
// Two paths:
//   'listen'      — Request Listener Access: name + contact → auto-approved, code 0000 shown
//   'collaborate' — Collaborate with the Collective: vetting + file → L's queue → D's queue → personal code
//
// No actual email/SMS. All data stored in psc_listeners or psc_inbox_requests.

const VETTING_QUESTIONS = [
  {
    id: "q1",
    prompt: "TUPAC or BIGGIE?",
    type: "choice",
    options: ["TUPAC", "BIGGIE", "BOTH"],
  },
  {
    id: "q2",
    prompt: "EAST COAST or WEST COAST?",
    type: "choice",
    options: ["EAST", "WEST", "NEITHER"],
  },
  {
    id: "q3",
    prompt: "What does PSC mean to you?",
    type: "text",
    maxLength: 280,
  },
];

const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const MODAL_VARIANTS = {
  hidden: { scale: 0.88, opacity: 0, y: 24 },
  visible: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.88, opacity: 0, y: 24 },
};

function RequestAccessModal({ mode, onClose }) {
  const { addInboxRequest, addListener } = useSystem();

  // Shared fields
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  // Collaborate-only fields
  const [step, setStep] = useState(1); // 1=vetting, 2=contact, 3=file
  const [answers, setAnswers] = useState({});
  const [file, setFile] = useState(null);

  // Confirmation
  const [submitted, setSubmitted] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── LISTEN: auto-approve → addListener → show code 0000 immediately ──────
  const handleListenSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    addListener(name.trim(), contact.trim());
    setSubmitted(true);
  };

  // ── COLLABORATE: 3-step vetting → L's queue ───────────────────────────────
  const handleCollaborateNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      const allAnswered = VETTING_QUESTIONS.every((q) => answers[q.id]?.trim());
      if (!allAnswered) return;
      setStep(2);
    } else if (step === 2) {
      if (!name.trim() || !contact.trim()) return;
      setStep(3);
    } else if (step === 3) {
      addInboxRequest({
        type: "collaborate",
        name: name.trim(),
        contact: contact.trim(),
        answers,
        filename: file?.name || null,
      });
      setSubmitted(true);
    }
  };

  const setAnswer = (id, value) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  // ── CONFIRMATION SCREEN ─────────────────────────────────────────────────
  const renderConfirm = () => (
    <div className="access-modal-confirm">
      <div className="access-confirm-glyph">◉</div>
      <div className="access-confirm-title">SIGNAL RECEIVED</div>
      <div className="access-confirm-body">
        {mode === "listen" ? (
          <>
            <div
              style={{
                fontSize: "1.6rem",
                letterSpacing: "0.3em",
                marginBottom: "8px",
                color: "var(--studer-copper)",
              }}
            >
              YOUR CODE: 0000
            </div>
            <div>Enter this code at the gate to access all frequencies.</div>
          </>
        ) : (
          <>
            <div>Your frequency is under review.</div>
            <div style={{ marginTop: "8px", opacity: 0.7 }}>
              Use code <strong>0000</strong> for listening access while you
              wait. A personal code will be transmitted upon approval.
            </div>
          </>
        )}
      </div>
      <button className="access-btn access-btn-primary" onClick={onClose}>
        CLOSE CHANNEL
      </button>
    </div>
  );

  // ── LISTEN FORM ──────────────────────────────────────────────────────────
  const renderListenForm = () => (
    <form onSubmit={handleListenSubmit}>
      <div className="access-modal-header">
        <span className="access-modal-title">REQUEST LISTENER ACCESS</span>
        <span className="access-modal-sub">
          ALL FREQUENCIES · IMMEDIATE ACCESS
        </span>
      </div>

      <div className="access-field">
        <label className="access-field-label">NAME</label>
        <input
          className="access-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="your name"
          maxLength={64}
          autoComplete="name"
          required
        />
      </div>

      <div className="access-field">
        <label className="access-field-label">EMAIL OR PHONE</label>
        <input
          className="access-input"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="for your records"
          maxLength={128}
          required
        />
      </div>

      <div className="access-modal-note">
        Access code 0000 unlocks all listening frequencies. No review required.
      </div>

      <div className="access-modal-actions">
        <button
          type="button"
          className="access-btn access-btn-cancel"
          onClick={onClose}
        >
          CANCEL
        </button>
        <button
          type="submit"
          className="access-btn access-btn-primary"
          disabled={!name.trim() || !contact.trim()}
        >
          GRANT ACCESS
        </button>
      </div>
    </form>
  );

  // ── COLLABORATE FORM — step 1: vetting ──────────────────────────────────
  const renderVettingStep = () => (
    <form onSubmit={handleCollaborateNext}>
      <div className="access-modal-header">
        <span className="access-modal-title">
          COLLABORATE WITH THE COLLECTIVE
        </span>
        <span className="access-modal-sub">
          STEP 1 OF 3 · FREQUENCY VETTING
        </span>
      </div>

      {VETTING_QUESTIONS.map((q) => (
        <div key={q.id} className="access-field">
          <label className="access-field-label">{q.prompt}</label>
          {q.type === "choice" ? (
            <div className="access-choice-group">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`access-choice-btn ${answers[q.id] === opt ? "selected" : ""}`}
                  onClick={() => setAnswer(q.id, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="access-textarea"
              value={answers[q.id] || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="your answer..."
              maxLength={q.maxLength}
              rows={3}
            />
          )}
        </div>
      ))}

      <div className="access-modal-actions">
        <button
          type="button"
          className="access-btn access-btn-cancel"
          onClick={onClose}
        >
          CANCEL
        </button>
        <button
          type="submit"
          className="access-btn access-btn-primary"
          disabled={!VETTING_QUESTIONS.every((q) => answers[q.id]?.trim())}
        >
          NEXT →
        </button>
      </div>
    </form>
  );

  // ── COLLABORATE FORM — step 2: contact ──────────────────────────────────
  const renderContactStep = () => (
    <form onSubmit={handleCollaborateNext}>
      <div className="access-modal-header">
        <span className="access-modal-title">
          COLLABORATE WITH THE COLLECTIVE
        </span>
        <span className="access-modal-sub">STEP 2 OF 3 · YOUR FREQUENCY</span>
      </div>

      <div className="access-field">
        <label className="access-field-label">NAME</label>
        <input
          className="access-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="your name"
          maxLength={64}
          required
        />
      </div>

      <div className="access-field">
        <label className="access-field-label">EMAIL OR PHONE</label>
        <input
          className="access-input"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="where to reach you"
          maxLength={128}
          required
        />
      </div>

      <div className="access-modal-actions">
        <button
          type="button"
          className="access-btn access-btn-cancel"
          onClick={() => setStep(1)}
        >
          ← BACK
        </button>
        <button
          type="submit"
          className="access-btn access-btn-primary"
          disabled={!name.trim() || !contact.trim()}
        >
          NEXT →
        </button>
      </div>
    </form>
  );

  // ── COLLABORATE FORM — step 3: file upload ───────────────────────────────
  const renderFileStep = () => (
    <form onSubmit={handleCollaborateNext}>
      <div className="access-modal-header">
        <span className="access-modal-title">
          COLLABORATE WITH THE COLLECTIVE
        </span>
        <span className="access-modal-sub">
          STEP 3 OF 3 · UPLOAD FOR REVIEW
        </span>
      </div>

      <div className="access-field">
        <label className="access-field-label">MUSIC FILE (optional)</label>
        <div
          className="access-file-zone"
          onClick={() => document.getElementById("access-file-input").click()}
        >
          {file ? (
            <span className="access-file-name">{file.name}</span>
          ) : (
            <span className="access-file-placeholder">
              Click to select — MP3, WAV, or FLAC
            </span>
          )}
        </div>
        <input
          id="access-file-input"
          type="file"
          accept=".mp3,.wav,.flac,.aif,.aiff"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <div className="access-modal-note" style={{ marginTop: "8px" }}>
          Submission goes to L for vetting, then to D for final approval.
        </div>
      </div>

      <div className="access-modal-actions">
        <button
          type="button"
          className="access-btn access-btn-cancel"
          onClick={() => setStep(2)}
        >
          ← BACK
        </button>
        <button type="submit" className="access-btn access-btn-primary">
          TRANSMIT APPLICATION
        </button>
      </div>
    </form>
  );

  const renderContent = () => {
    if (submitted) return renderConfirm();
    if (mode === "listen") return renderListenForm();
    if (step === 1) return renderVettingStep();
    if (step === 2) return renderContactStep();
    return renderFileStep();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="access-modal-overlay"
        variants={OVERLAY_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ duration: 0.25 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="access-modal"
          variants={MODAL_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.12, 0, 0.2, 1] }}
        >
          {renderContent()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RequestAccessModal;
