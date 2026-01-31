const { deepgram } = require("../../config/deepgram");
const { supabase } = require("../../config/supabase");

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function generateAudio(text, sceneId) {
  if (!text || text.trim().length === 0) return null;

  try {
    console.log(`   🎧 Generating TTS for Scene ${sceneId}...`);

    const response = await deepgram.speak.request(
      { text },
      {
        model: "aura-2-zeus-en",
        encoding: "mp3",
      },
    );

    const stream = await response.getStream();
    if (!stream) throw new Error("Deepgram returned empty stream");

    const audioBuffer = await streamToBuffer(stream);

    const fileName = `${Date.now()}_${sceneId}.mp3`;
    const filePath = `generated/${fileName}`;

    const { error } = await supabase.storage
      .from("story_voiceover")
      .upload(filePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (error) throw new Error(`Supabase Upload Error: ${error.message}`);

    const { data: publicData } = supabase.storage
      .from("story_voiceover")
      .getPublicUrl(filePath);

    return {
      publicUrl: publicData.publicUrl,
      audioBuffer: audioBuffer,
    };
  } catch (error) {
    console.error(`❌ Audio Generation Failed [${sceneId}]:`, error.message);
    return null;
  }
}

module.exports = { generateAudio };
