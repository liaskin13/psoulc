import React from "react";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[PSC] BOUNDARY CAUGHT", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          background: "#050505",
          color: "#e5e5e5",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Chakra Petch, monospace",
          gap: 16,
        }}
      >
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.3em", opacity: 0.5 }}>
          PSC CONSOLE
        </div>
        <div style={{ fontSize: "1.1rem", letterSpacing: "0.2em" }}>
          SIGNAL INTERRUPTED
        </div>
        <button
          style={{
            marginTop: 24,
            padding: "8px 24px",
            border: "1px solid #333",
            background: "transparent",
            color: "#e5e5e5",
            fontFamily: "Chakra Petch, monospace",
            letterSpacing: "0.15em",
            cursor: "pointer",
          }}
          onClick={() => window.location.reload()}
        >
          RESTORE SIGNAL
        </button>
      </div>
    );
  }
}
