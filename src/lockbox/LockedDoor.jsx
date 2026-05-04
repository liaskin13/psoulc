import React from "react";
import { LOCKBOX_PREFIX } from "../config";
import "./LockedDoor.css";

const LOCKBOX_COLORS = {
  janet: "#cc3399",
  erikah: "#cc6633",
  larry: "#7aaa5a",
  drake: "#c4a428",
};

function LockedDoor({ lockboxId, onBack }) {
  const key = (lockboxId || "").replace(LOCKBOX_PREFIX, "");
  const name = key.toUpperCase();
  const color = LOCKBOX_COLORS[key] ?? "#888888";

  return (
    <div
      className="locked-door-overlay"
      style={{ "--locked-door-color": color }}
    >
      <div className="locked-door-rail" />
      <div className="locked-door-name">{name}</div>
      <div className="locked-door-sealed">SEALED</div>
      <div className="locked-door-rail" />
      <button className="locked-door-btn" onClick={onBack}>
        RETURN
      </button>
    </div>
  );
}

export default LockedDoor;
