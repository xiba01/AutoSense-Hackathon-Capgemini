const { deepgram } = require("../../config/deepgram");

/**
 * @param {Buffer} audioBuffer
 * @returns {Promise<Array>}
 */
async function getWordTimestamps(audioBuffer) {
  if (!audioBuffer || audioBuffer.length === 0) return [];

  try {
    const response = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: "nova-3",
        language: "en",
        smart_format: true,
        punctuate: true,
        mimetype: "audio/mpeg",
      },
    );

    const result = response.result;

    if (result?.results?.channels?.[0]?.alternatives?.[0]?.words) {
      const words = result.results.channels[0].alternatives[0].words;
      return words;
    }

    console.warn("   ⚠️ Deepgram returned no words.");
    return [];
  } catch (error) {
    console.warn("   ⚠️ Timestamp calculation failed:", error.message);
    return [];
  }
}

module.exports = { getWordTimestamps };
