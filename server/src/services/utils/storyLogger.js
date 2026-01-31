const { supabase } = require("../../config/supabase");

/**
 * @param {string} storyId
 * @param {string} message
 */
async function logStep(storyId, stepKey, message) {
  console.log(`🔹 [${stepKey}] ${message}`);

  if (!storyId) return;

  try {
    const { error } = await supabase
      .from("stories")
      .update({
        current_agent: stepKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storyId);

    if (error) {
      console.error("⚠️ Supabase Log Error:", error.message);
    }
  } catch (err) {
    console.error("⚠️ Logger Exception:", err.message);
  }
}

module.exports = { logStep };
