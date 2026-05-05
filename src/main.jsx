import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { SystemProvider } from "./state/SystemContext.jsx";
import "./variables.css";
import "./index.css";
import "./styles/identity.css";

// Block extension errors BEFORE anything else
window.addEventListener(
  "error",
  (e) => {
    if (
      e.filename?.includes("share-modal") ||
      e.message?.includes("addEventListener")
    ) {
      e.preventDefault();
      e.stopPropagation();
      console.warn("⚠️ Extension error suppressed");
      return false;
    }
  },
  true,
);

window.addEventListener(
  "unhandledrejection",
  (e) => {
    if (e.reason?.message?.includes("share-modal")) {
      e.preventDefault();
    }
  },
  true,
);

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <SystemProvider>
      <App />
    </SystemProvider>,
  );
} else {
  console.error("✗ Root element NOT found");
}
