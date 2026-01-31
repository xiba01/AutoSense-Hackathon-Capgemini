import { create } from "zustand";

export const useStoryStore = create((set, get) => ({
  story: null,
  storyData: null,
  scenes: [],
  currentSceneIndex: 0,

  playback: {
    isPlaying: false,
    isPaused: false,
    autoAdvance: true,
    currentTime: 0,
  },
  audioCurrentTime: 0,
  activeCameraView: "primary",
  isFreeRoam: false,

  loadStory: (storyData) => {
    set({
      story: storyData,
      storyData,
      scenes: storyData?.scenes || [],
      currentSceneIndex: 0,
      playback: {
        isPlaying: false,
        isPaused: false,
        autoAdvance: true,
        currentTime: 0,
      },
      audioCurrentTime: 0,
      activeHotspotId: null,
    });
  },

  getCurrentScene: () => {
    const { scenes, currentSceneIndex } = get();
    return scenes[currentSceneIndex] || null;
  },

  nextScene: () => {
    const { scenes, currentSceneIndex } = get();
    if (currentSceneIndex < scenes.length - 1) {
      set({
        currentSceneIndex: currentSceneIndex + 1,
        audioCurrentTime: 0,
      });
    }
  },

  prevScene: () => {
    const { currentSceneIndex } = get();
    if (currentSceneIndex > 0) {
      set({
        currentSceneIndex: currentSceneIndex - 1,
        audioCurrentTime: 0,
      });
    }
  },

  goToScene: (index) => {
    const { scenes } = get();
    if (index >= 0 && index < scenes.length) {
      set({
        currentSceneIndex: index,
        audioCurrentTime: 0,
      });
    }
  },

  play: () => {
    set((state) => ({
      playback: { ...state.playback, isPlaying: true, isPaused: false },
    }));
  },

  setIsPlaying: (value) => {
    set((state) => ({
      playback: {
        ...state.playback,
        isPlaying: value,
        isPaused: value ? false : state.playback.isPaused,
      },
    }));
  },

  pause: () => {
    set((state) => ({
      playback: { ...state.playback, isPaused: true },
    }));
  },

  setPaused: (value) => {
    set((state) => ({
      playback: { ...state.playback, isPaused: value },
    }));
  },

  togglePlayPause: () => {
    set((state) => ({
      playback: {
        ...state.playback,
        isPaused: !state.playback.isPaused,
      },
    }));
  },

  stop: () => {
    set((state) => ({
      playback: { ...state.playback, isPlaying: false, isPaused: false },
      currentSceneIndex: 0,
      audioCurrentTime: 0,
    }));
  },

  setAutoAdvance: (value) => {
    set((state) => ({
      playback: { ...state.playback, autoAdvance: value },
    }));
  },

  setAudioCurrentTime: (time) => {
    set((state) => ({
      audioCurrentTime: time,
      playback: { ...state.playback, currentTime: time },
    }));
  },

  setCameraView: (view) => set({ activeCameraView: view }),

  setFreeRoam: (enabled) =>
    set({
      isFreeRoam: enabled,
      activeCameraView: enabled ? "free" : "primary",
    }),

  activeHotspotId: null,
  setActiveHotspot: (id) => set({ activeHotspotId: id }),

  updateStoryData: (newStoryData) => {
    set({
      story: newStoryData,
      storyData: newStoryData,
      scenes: newStoryData?.scenes || [],
    });
  },

  updateCurrentScene: (updates) => {
    const { scenes, currentSceneIndex, storyData } = get();
    if (!scenes[currentSceneIndex]) return;

    const currentScene = scenes[currentSceneIndex];
    let updatedScene = { ...currentScene };

    Object.keys(updates).forEach((key) => {
      if (
        ["intro_content", "slide_content", "outro_content"].includes(key) &&
        typeof updates[key] === "object"
      ) {
        updatedScene[key] = {
          ...updatedScene[key],
          ...updates[key],
        };
      } else {
        updatedScene[key] = updates[key];
      }
    });

    const newScenes = [...scenes];
    newScenes[currentSceneIndex] = updatedScene;

    set({
      scenes: newScenes,
      storyData: storyData
        ? { ...storyData, scenes: newScenes }
        : { scenes: newScenes },
      story: storyData
        ? { ...storyData, scenes: newScenes }
        : { scenes: newScenes },
    });
  },

  startExperience: () => {
    const { scenes, currentSceneIndex } = get();
    const currentScene = scenes[currentSceneIndex];

    if (currentScene?.type === "intro_view") {
      set({
        currentSceneIndex: currentSceneIndex + 1,
        audioCurrentTime: 0,
        playback: {
          isPlaying: true,
          isPaused: false,
          autoAdvance: true,
          currentTime: 0,
        },
      });
    } else {
      set((state) => ({
        playback: { ...state.playback, isPlaying: true, isPaused: false },
      }));
    }
  },

  setScene: (index) => {
    const { storyData } = get();
    if (storyData && index >= 0 && index < (storyData.scenes?.length || 0)) {
      set({
        playback: {
          ...get().playback,
          currentSceneIndex: index,
          currentTime: 0,
        },
        activeCameraView: "primary",
        isFreeRoam: false,
        audioCurrentTime: 0,
      });
    }
  },
}));
