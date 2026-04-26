import { useRef, useState, useCallback } from 'react';

// HTML5 Audio playback hook — wires to StuderTransportBar callbacks.
// play(url) loads and plays a new src. pause/stop/rewind/fastForward
// operate on the same underlying HTMLAudioElement.
export function useAudioPlayer() {
  const audioRef  = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function getAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
    }
    return audioRef.current;
  }

  const play = useCallback((url) => {
    const audio = getAudio();
    if (url && audio.src !== url) {
      audio.src = url;
      audio.currentTime = 0;
    }
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {}); // Blocked by browser autoplay policy — silent fail
  }, []);

  const pause = useCallback(() => {
    getAudio().pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    const audio = getAudio();
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const rewind = useCallback(() => {
    const audio = getAudio();
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  }, []);

  const fastForward = useCallback(() => {
    const audio = getAudio();
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    getAudio().playbackRate = rate;
  }, []);

  return { isPlaying, play, pause, stop, rewind, fastForward, setPlaybackRate };
}
