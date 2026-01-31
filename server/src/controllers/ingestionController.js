const { v4: uuidv4 } = require("uuid");
const { supabase } = require("../config/supabase");
const { runAutoSensePipeline } = require("../services/orchestrator");

const generateContext = async (req, res) => {
  try {
    const { car_id, template, scenes } = req.body;

    console.log(`🚀 Request Received for Car: ${car_id}`);

    if (!car_id) {
      return res.status(400).json({ error: "Missing car_id" });
    }

    const { data: carData, error: carError } = await supabase
      .from("cars")
      .select("dealer_id")
      .eq("id", car_id)
      .single();

    if (carError || !carData) {
      throw new Error(
        "Could not find car or dealer_id: " +
          (carError?.message || "Unknown error"),
      );
    }

    const dealerId = carData.dealer_id;

    const { data: existingStory } = await supabase
      .from("stories")
      .select("id")
      .eq("car_id", car_id)
      .is("deleted_at", null)
      .maybeSingle();

    let storyId;
    let dbError;

    const storyPayload = {
      car_id: car_id,
      dealer_id: dealerId,
      generation_status: "processing",
      current_agent: "SYSTEM",
      progress_percent: 0,
      progress_logs: ["Pipeline initialized"],
      deleted_at: null,
    };

    if (existingStory) {
      storyId = existingStory.id;
      console.log(`🔄 Overwriting existing story: ${storyId}`);

      const { error } = await supabase
        .from("stories")
        .update(storyPayload)
        .eq("id", storyId);
      dbError = error;
    } else {
      storyId = uuidv4();
      storyPayload.id = storyId;
      console.log(`✨ Creating new story: ${storyId}`);

      const { error } = await supabase.from("stories").insert(storyPayload);
      dbError = error;
    }

    if (dbError) {
      throw new Error("DB Operation Failed: " + dbError.message);
    }

    res.status(200).json({
      success: true,
      message: "Generation Started",
      storyId: storyId,
    });

    runAutoSensePipeline(storyId, req.body);
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = { generateContext };
