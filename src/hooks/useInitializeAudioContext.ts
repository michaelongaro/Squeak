import { useEffect } from "react";
import { useMainStore } from "~/stores/MainStore";

// An AudioContext is not allowed to be created before a user gesture
export function useInitializeAudioContext() {
  const {
    audioContext,
    setAudioContext,
    masterVolumeGainNode,
    setMasterVolumeGainNode,
  } = useMainStore((state) => ({
    audioContext: state.audioContext,
    setAudioContext: state.setAudioContext,
    masterVolumeGainNode: state.masterVolumeGainNode,
    setMasterVolumeGainNode: state.setMasterVolumeGainNode,
  }));

  useEffect(() => {
    if (audioContext && masterVolumeGainNode) return;

    const handleUserInteraction = () => {
      if (audioContext && masterVolumeGainNode) return;

      const newAudioContext = new AudioContext();

      const newMasterVolumeGainNode = newAudioContext.createGain();

      newMasterVolumeGainNode.connect(newAudioContext.destination);

      setAudioContext(newAudioContext);
      setMasterVolumeGainNode(newMasterVolumeGainNode);

      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };

    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, [
    audioContext,
    masterVolumeGainNode,
    setAudioContext,
    setMasterVolumeGainNode,
  ]);
}
