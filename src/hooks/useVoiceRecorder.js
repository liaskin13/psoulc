import { useState, useRef, useCallback } from 'react';

// Arms MediaRecorder on a per-cell basis.
// Returns { isRecording, startRecording, stopRecording, cancelRecording, error }
// onCommit(audioDataUrl, mimeType) is called when recording completes.

export function useVoiceRecorder({ onCommit } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [error,       setError]       = useState(null);
  const recorderRef   = useRef(null);
  const chunksRef     = useRef([]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          onCommit?.(reader.result, mimeType);
        };
        reader.readAsDataURL(blob);
        setIsRecording(false);
      };

      recorder.onerror = () => {
        setError('Recording failed');
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(200); // timeslice 200ms
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Mic access denied' : 'Mic unavailable');
    }
  }, [onCommit]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.ondataavailable = null;
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
      recorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    chunksRef.current = [];
    setIsRecording(false);
    setError(null);
  }, []);

  return { isRecording, startRecording, stopRecording, cancelRecording, error };
}
