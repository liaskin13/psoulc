import { useState, useCallback, useRef, useEffect } from "react";
import { readId3Tags } from "../lib/readId3Tags";
import { uploadTrack } from "../lib/tracks";

const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "aif",
  "aiff",
  "flac",
  "m4a",
  "aac",
  "ogg",
]);

const CONCURRENT_UPLOADS = 2;

function isAudioFileCandidate(file) {
  if (!file) return false;
  if (typeof file.type === "string" && file.type.startsWith("audio/"))
    return true;
  const ext = file.name?.split(".").pop()?.toLowerCase();
  return Boolean(ext && AUDIO_EXTENSIONS.has(ext));
}

function getFilenameTitle(filename) {
  return filename
    .replace(/\.[^.]+$/, "") // remove extension
    .replace(/[-_]/g, " ") // replace dashes/underscores with spaces
    .toUpperCase();
}

export function useDragDropBatch(activeLibVault, consoleOwner) {
  const [queue, setQueue] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const uploadCounterRef = useRef(0);
  const processingRef = useRef(false);

  // Auto-process queue whenever it changes
  useEffect(() => {
    if (processingRef.current) return;

    const uploadingCount = queue.filter((i) => i.status === "uploading").length;
    if (uploadingCount >= CONCURRENT_UPLOADS) return;

    const nextPending = queue.find((i) => i.status === "pending");
    if (!nextPending) return;

    processingRef.current = true;

    // Mark this item as uploading
    setQueue((current) =>
      current.map((i) =>
        i.id === nextPending.id ? { ...i, status: "uploading" } : i,
      ),
    );

    // Start upload
    (async () => {
      try {
        await uploadTrack(
          nextPending.file,
          {
            vault: activeLibVault,
            title: nextPending.metadata.title,
            artist: nextPending.metadata.artist || null,
            bpm: String(nextPending.metadata.bpm),
            uploaded_by: consoleOwner,
          },
          ({ percent }) => {
            setQueue((current) =>
              current.map((item) =>
                item.id === nextPending.id
                  ? { ...item, progress: percent }
                  : item,
              ),
            );
          },
        );

        // tracks.js fires psc:track-uploaded internally — no need to re-dispatch here

        setQueue((current) =>
          current.map((item) =>
            item.id === nextPending.id ? { ...item, status: "done" } : item,
          ),
        );
      } catch (error) {
        setQueue((current) =>
          current.map((item) =>
            item.id === nextPending.id
              ? { ...item, status: "error", error: error.message }
              : item,
          ),
        );
      } finally {
        processingRef.current = false;
      }
    })();
  }, [queue, activeLibVault, consoleOwner]);

  const addFiles = useCallback(
    async (fileList) => {
      const validFiles = Array.from(fileList).filter(isAudioFileCandidate);
      if (validFiles.length === 0) return;

      const newItems = [];

      for (const file of validFiles) {
        const id = `batch-${uploadCounterRef.current++}`;
        const fallbackTitle = getFilenameTitle(file.name);

        try {
          const id3 = await readId3Tags(file);
          newItems.push({
            id,
            file,
            status: "pending",
            progress: 0,
            error: null,
            metadata: {
              title: id3.title ? id3.title.toUpperCase() : fallbackTitle,
              artist: id3.artist ? id3.artist.toUpperCase() : null,
              bpm: id3.bpm || 120,
            },
          });
        } catch {
          // Fallback if ID3 read fails
          newItems.push({
            id,
            file,
            status: "pending",
            progress: 0,
            error: null,
            metadata: {
              title: fallbackTitle,
              artist: null,
              bpm: 120,
            },
          });
        }
      }

      setQueue((current) => [...current, ...newItems]);
    },
    [],
  );

  const retry = useCallback((itemId) => {
    setQueue((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, status: "pending", progress: 0, error: null }
          : item,
      ),
    );
  }, []);

  const dismiss = useCallback((itemId) => {
    setQueue((current) => current.filter((item) => item.id !== itemId));
  }, []);

  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  return {
    queue,
    addFiles,
    retry,
    dismiss,
    isDraggingOver,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}
