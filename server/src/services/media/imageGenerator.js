const axios = require("axios");
const { supabase } = require("../../config/supabase");
require("dotenv").config();

async function generateImage(prompt, seed = Math.floor(Math.random() * 10000)) {
  const apiKey = process.env.POLLINATIONS_API_KEY;

  if (!apiKey) {
    console.warn(
      "⚠️ No Pollinations API Key found. Falling back to public URL (Unstable).",
    );
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt,
    )}?model=flux&nologo=true`;
  }

  try {
    console.log(`   🎨 Generative Step: Fetching from Pollinations...`);

    const encodedPrompt = encodeURIComponent(prompt);
    const genUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?model=nanobanana&width=1920&height=1080&seed=${seed}&nologo=true`;

    const response = await axios.get(genUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "AutoSense-Backend/1.0",
      },
      responseType: "arraybuffer",
    });

    const fileName = `${Date.now()}_${seed}.jpg`;
    const filePath = `generated/${fileName}`;

    console.log(`   ☁️  Storage Step: Uploading ${fileName} to Supabase...`);

    const { data, error } = await supabase.storage
      .from("story_images")
      .upload(filePath, response.data, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase Upload Error: ${error.message}`);
    }

    const { data: publicData } = supabase.storage
      .from("story_images")
      .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;
    console.log(`   ✅ Image Asset Ready: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("❌ Image Pipeline Failed:", error.message);

    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt,
    )}?model=flux&nologo=true`;
  }
}

module.exports = { generateImage };
