import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getStatusColor(status) {
  switch (status) {
    case "pending":
      return "rgba(90, 90, 90, 0.5)"; // muted gray
    case "uploading":
      return "rgba(0, 200, 255, 0.7)"; // cyan
    case "done":
      return "rgba(0, 200, 80, 0.7)"; // green
    case "error":
      return "rgba(255, 68, 68, 0.7)"; // red
    default:
      return "rgba(90, 90, 90, 0.5)";
  }
}

function StatusChip({ status }) {
  const pulseAnimation = status === "uploading" ? {
    opacity: [0.7, 1, 0.7],
    transition: { duration: 1.5, repeat: Infinity },
  } : {};

  return (
    <motion.span
      className="batch-status-chip"
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "2px",
        fontSize: "9px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        backgroundColor: getStatusColor(status),
        color: "rgba(230, 230, 230, 0.92)",
        textTransform: "uppercase",
      }}
      animate={pulseAnimation}
    >
      {status === "pending" && "PENDING"}
      {status === "uploading" && "UPLOADING"}
      {status === "done" && "DONE"}
      {status === "error" && "ERROR"}
    </motion.span>
  );
}

function QueueItem({ item, onRetry, onDismiss }) {
  return (
    <motion.div
      className="batch-queue-item"
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 80px 120px 100px 60px",
        gap: "16px",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(34, 34, 34, 0.5)",
        fontSize: "12px",
      }}
    >
      {/* Filename */}
      <div
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: "11px",
          letterSpacing: "0.02em",
          color: "rgba(160, 160, 160, 0.92)",
        }}
      >
        {item.file.name}
      </div>

      {/* File size */}
      <div
        style={{
          fontSize: "10px",
          color: "rgba(160, 160, 160, 0.72)",
          textAlign: "right",
        }}
      >
        {formatBytes(item.file.size)}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "relative",
          height: "4px",
          backgroundColor: "rgba(34, 34, 34, 0.8)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        {item.status !== "pending" && (
          <motion.div
            style={{
              height: "100%",
              backgroundColor: "rgba(0, 200, 255, 0.8)",
              width: `${item.progress || 0}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>

      {/* Status chip */}
      <div style={{ textAlign: "center" }}>
        <StatusChip status={item.status} />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        {item.status === "error" && (
          <button
            onClick={() => onRetry(item.id)}
            style={{
              padding: "4px 8px",
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              backgroundColor: "rgba(0, 120, 200, 0.3)",
              border: "1px solid rgba(0, 200, 255, 0.5)",
              color: "rgba(0, 200, 255, 0.9)",
              cursor: "pointer",
              textTransform: "uppercase",
              borderRadius: "2px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(0, 120, 200, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(0, 120, 200, 0.3)";
            }}
          >
            RETRY
          </button>
        )}
        <button
          onClick={() => onDismiss(item.id)}
          style={{
            padding: "4px 8px",
            fontSize: "9px",
            fontWeight: 600,
            backgroundColor: "rgba(34, 34, 34, 0.6)",
            border: "1px solid rgba(90, 90, 90, 0.4)",
            color: "rgba(160, 160, 160, 0.7)",
            cursor: "pointer",
            borderRadius: "2px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(34, 34, 34, 0.9)";
            e.target.style.color = "rgba(160, 160, 160, 0.9)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(34, 34, 34, 0.6)";
            e.target.style.color = "rgba(160, 160, 160, 0.7)";
          }}
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

export function BatchUploadQueue({ queue, onRetry, onDismiss }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (queue.length === 0) return null;

  const completedCount = queue.filter((i) => i.status === "done").length;
  const totalCount = queue.length;

  return (
    <motion.div
      className="batch-upload-queue"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        backgroundColor: "rgba(13, 13, 13, 0.6)",
        borderBottom: "1px solid rgba(34, 34, 34, 0.8)",
        borderTop: "1px solid rgba(34, 34, 34, 0.8)",
        marginBottom: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: isCollapsed ? "none" : "1px solid rgba(34, 34, 34, 0.5)",
          cursor: "pointer",
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(230, 230, 230, 0.92)",
            }}
          >
            UPLOAD QUEUE
          </span>
          <span
            style={{
              fontSize: "9px",
              color: "rgba(160, 160, 160, 0.72)",
            }}
          >
            {completedCount} of {totalCount}
          </span>
        </div>
        <span
          style={{
            fontSize: "14px",
            color: "rgba(160, 160, 160, 0.72)",
            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </div>

      {/* Queue items */}
      {!isCollapsed && (
        <AnimatePresence>
          <div style={{ maxHeight: "240px", overflowY: "auto" }}>
            {queue.map((item) => (
              <QueueItem
                key={item.id}
                item={item}
                onRetry={onRetry}
                onDismiss={onDismiss}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
