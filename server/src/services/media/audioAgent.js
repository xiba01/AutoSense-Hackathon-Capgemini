const { generateAudio } = require("./audioGenerator");
const { getWordTimestamps } = require("./transcriptionService");
const { parseSubtitles } = require("./subtitleParser");

async function produceAudio(carContext, storyboard) {
  console.log(
    `🎧 Audio Agent: Processing audio for ${storyboard.scenes.length} scenes...`,
  );

  try {
    const scenePromises = storyboard.scenes.map(async (scene) => {
      return processSingleScene(scene);
    });

    const fullyProducedScenes = await Promise.all(scenePromises);
    console.log("🎧 Audio Agent: Done. All audio tracks ready.");

    return {
      ...storyboard,
      scenes: fullyProducedScenes,
    };
  } catch (error) {
    console.error("❌ Audio Agent Failed:", error);
    throw new Error("Failed to produce audio.");
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processSingleScene(scene) {
  if (!scene.raw_voiceover || scene.raw_voiceover.length === 0) {
    return scene;
  }

  try {
    const audioArtifacts = await generateAudio(
      scene.raw_voiceover,
      scene.scene_id,
    );

    if (!audioArtifacts) {
      return scene;
    }

    const rawWords = await getWordTimestamps(audioArtifacts.audioBuffer);

    const subtitles = parseSubtitles(rawWords);

    const updatedScene = {
      ...scene,
      audio_url: audioArtifacts.publicUrl,
      subtitles: subtitles,
    };

    return updatedScene;
  } catch (err) {
    console.error(
      `⚠️ Failed to produce audio for scene ${scene.scene_id}:`,
      err.message,
    );
    return scene;
  }
}

module.exports = { produceAudio };
