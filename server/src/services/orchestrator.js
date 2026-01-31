const { supabase } = require("../config/supabase");
const { logStep } = require("./utils/storyLogger");

const { buildCarContext } = require("./ingestion/ingestionService");
const { analyzeCar } = require("./ai/analystAgent");
const { planStory } = require("./ai/directorAgent");
const { writeScript } = require("./ai/scriptwriterAgent");
const { visualizeStory } = require("./media/visualizerAgent");
const { produceAudio } = require("./media/audioAgent");

async function runAutoSensePipeline(storyId, inputData) {
  const startTime = Date.now();
  console.log(`\n🎬 Orchestrator started for Story: ${storyId}`);

  try {
    await logStep(storyId, "SYSTEM", "Initializing AutoSense Core...");

    const dealerInput = {
      ...inputData,
      car_id: inputData.car_id,
    };

    await logStep(storyId, "INGESTION", "Connecting to Vehicle Database...");
    const carContext = await buildCarContext(dealerInput);

    await logStep(
      storyId,
      "BADGE_ORCHESTRATOR",
      `Verified ${carContext.certifications?.length || 0} certifications.`,
    );

    await logStep(storyId, "ANALYST", "Identifying buyer persona & USP...");
    const analystReport = await analyzeCar(carContext);

    await logStep(storyId, "DIRECTOR", "Structuring narrative arc...");
    const initialStoryboard = await planStory(
      carContext,
      analystReport,
      inputData.scenes || "automatic",
    );

    await logStep(storyId, "SCRIPTWRITER", "Composing scene narration...");
    const scriptedStoryboard = await writeScript(
      carContext,
      initialStoryboard,
      carContext.certifications || [],
    );

    await logStep(
      storyId,
      "IMAGE_GENERATOR",
      "Rendering cinematic assets (Flux)...",
    );

    const visualizedStoryboard = await visualizeStory(
      carContext,
      scriptedStoryboard,
    );

    await logStep(
      storyId,
      "VISION_SCANNER",
      "Scanning spatial coordinates & hotspots...",
    );

    await logStep(storyId, "AUDIO_ENGINE", "Synthesizing neural voiceover...");
    const finalStoryboard = await produceAudio(
      carContext,
      visualizedStoryboard,
    );

    await logStep(
      storyId,
      "QA_SYSTEM",
      "Validating assets & assembling story...",
    );

    const polishedStory = runQualityAssurance(
      finalStoryboard,
      carContext,
      dealerInput,
    );

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    const { error: saveError } = await supabase
      .from("stories")
      .update({
        generation_status: "complete",
        current_agent: "COMPLETE",
        content: polishedStory,
        progress_logs: [`Pipeline finished in ${totalTime}s`],
      })
      .eq("id", storyId);

    if (saveError) throw saveError;

    console.log(`✅ Pipeline Success! Story ${storyId} is ready.`);
  } catch (error) {
    console.error("❌ Pipeline Failed:", error);

    await supabase
      .from("stories")
      .update({
        generation_status: "failed",
        current_agent: "ERROR",
        progress_logs: [`Error: ${error.message}`],
      })
      .eq("id", storyId);
  }
}

function runQualityAssurance(storyboard, carContext, dealerInput) {
  const safeStory = {};

  safeStory.story_id = storyboard.story_id || uuidv4();
  safeStory.car_id = carContext.car_id || carContext.context_id;
  safeStory.title =
    storyboard.title ||
    `${carContext.identity.year} ${carContext.identity.model}`;
  safeStory.narrative_arc_summary = storyboard.narrative_arc_summary || "";

  safeStory.meta = {
    schema_version: "1.1.0",
    template: dealerInput.template || "Cinematic",
    language: "en",
    theme_color: "#007AFF",
    generated_at: new Date().toISOString(),
    features: {
      has_tech_views: storyboard.scenes.some(
        (s) => s.scene_type === "tech_view",
      ),
      tech_view_count: storyboard.scenes.filter(
        (s) => s.scene_type === "tech_view",
      ).length,
    },
  };

  safeStory.scenes = (storyboard.scenes || []).map((scene, index) => {
    const rawId = scene.scene_id || String(index).padStart(2, "0");

    const transformedScene = {
      id: rawId,
      type: scene.scene_type || "slide_view",
      theme_tag: scene.theme_tag || "GENERAL",
      order: index + 1,
      visual_direction: scene.visual_direction || {},
      layout: scene.layout || null,

      image_url:
        scene.scene_type === "tech_view"
          ? null
          : scene.image_url ||
            "https://placehold.co/1280x720?text=Generating...",

      audio_url: scene.audio_url || null,
      raw_voiceover: scene.raw_voiceover || "",
      subtitles: scene.subtitles || [],

      intro_content: scene.intro_content,
      slide_content: scene.slide_content,
      outro_content: scene.outro_content,

      hotspots: scene.hotspots || [],
    };

    if (scene.scene_type === "tech_view") {
      const specs = carContext.normalized_specs || {};
      const performance = specs.performance || {};
      const safety = specs.safety || {};
      const dimensions = specs.dimensions || {};
      const carYear = carContext.identity?.year || 0;

      let techConfig = scene.tech_config || {
        mode: scene.theme_tag || "PERFORMANCE",
      };

      if (techConfig.mode === "PERFORMANCE") {
        techConfig = {
          ...techConfig,
          drivetrain: techConfig.drivetrain || performance.drivetrain || "FWD",
          engine_hp: techConfig.engine_hp ?? performance.hp ?? null,
          torque_nm: techConfig.torque_nm ?? performance.torque_nm ?? null,
          zero_to_sixty_sec:
            techConfig.zero_to_sixty_sec ??
            performance.zero_to_sixty_sec ??
            null,
        };
      } else if (techConfig.mode === "SAFETY") {
        const assistSystems = safety.assist_systems || [];
        const rawDump = carContext.raw_api_dump || {};
        const assistText = assistSystems.join(" ").toLowerCase();
        const rawDumpText = JSON.stringify(rawDump).toLowerCase();
        const searchText = `${assistText} ${rawDumpText}`;

        const sensorKeywords = [
          "parking sensor",
          "collision",
          "camera",
          "radar",
          "blind spot",
          "parking assist",
          "surround view",
        ];
        const hasExplicitSensorData = sensorKeywords.some((kw) =>
          searchText.includes(kw),
        );

        let hasFrontSensors = techConfig.has_front_sensors;
        let hasRearSensors = techConfig.has_rear_sensors;

        if (hasFrontSensors === undefined || hasFrontSensors === null) {
          hasFrontSensors = hasExplicitSensorData || carYear > 2018;
        }
        if (hasRearSensors === undefined || hasRearSensors === null) {
          hasRearSensors = hasExplicitSensorData || carYear > 2018;
        }

        techConfig = {
          ...techConfig,
          airbag_count: techConfig.airbag_count ?? safety.airbags ?? 6,
          has_front_sensors: hasFrontSensors,
          has_rear_sensors: hasRearSensors,
          safety_rating: techConfig.safety_rating ?? safety.rating_text ?? null,
          assist_systems: techConfig.assist_systems ||
            safety.assist_systems || ["ABS", "Traction Control"],
        };
      } else if (techConfig.mode === "UTILITY") {
        const existingDimensions = techConfig.dimensions || {};
        const safeDimensions = {
          length_mm:
            existingDimensions.length_mm ?? dimensions.length_mm ?? 4500,
          width_mm: existingDimensions.width_mm ?? dimensions.width_mm ?? 1800,
          height_mm:
            existingDimensions.height_mm ?? dimensions.height_mm ?? 1500,
          wheelbase_mm:
            existingDimensions.wheelbase_mm ?? dimensions.wheelbase_mm ?? null,
        };

        techConfig = {
          ...techConfig,
          dimensions: safeDimensions,
          trunk_capacity_liters:
            techConfig.trunk_capacity_liters ??
            dimensions.trunk_capacity_l ??
            null,
          seat_count: techConfig.seat_count ?? dimensions.seats ?? 5,
        };
      }

      transformedScene.tech_config = techConfig;
    }

    return transformedScene;
  });

  safeStory.badges = carContext.certifications || [];

  safeStory.car = {
    make: carContext.identity.make,
    model: carContext.identity.model,
    year: carContext.identity.year,
    trim: carContext.identity.trim,
    body_type: carContext.identity.body_type,
    color: carContext.visual_directives?.image_prompt_color || null,
  };

  const specs = carContext.normalized_specs || {};
  const carYear = carContext.identity?.year || 0;

  const assistSystems = specs.safety?.assist_systems || [];
  const rawDump = carContext.raw_api_dump || {};
  const assistText = assistSystems.join(" ").toLowerCase();
  const rawDumpText = JSON.stringify(rawDump).toLowerCase();
  const searchText = `${assistText} ${rawDumpText}`;
  const sensorKeywords = [
    "parking sensor",
    "collision",
    "camera",
    "radar",
    "blind spot",
  ];
  const hasExplicitSensorData = sensorKeywords.some((kw) =>
    searchText.includes(kw),
  );
  const defaultSensors = hasExplicitSensorData || carYear > 2018;

  safeStory.car_specs = {
    performance: {
      hp: specs.performance?.hp ?? null,
      torque_nm: specs.performance?.torque_nm ?? null,
      zero_to_sixty_sec: specs.performance?.zero_to_sixty_sec ?? null,
      top_speed_kmh: specs.performance?.top_speed_kmh ?? null,
      drivetrain: specs.performance?.drivetrain || "FWD",
      transmission: specs.performance?.transmission ?? null,
    },
    safety: {
      airbags: specs.safety?.airbags ?? 6,
      rating_text: specs.safety?.rating_text ?? null,
      assist_systems: specs.safety?.assist_systems || [],
      has_front_sensors: defaultSensors,
      has_rear_sensors: defaultSensors,
    },
    dimensions: {
      length_mm: specs.dimensions?.length_mm ?? 4500,
      width_mm: specs.dimensions?.width_mm ?? 1800,
      height_mm: specs.dimensions?.height_mm ?? 1500,
      trunk_capacity_l: specs.dimensions?.trunk_capacity_l ?? null,
      seats: specs.dimensions?.seats ?? 5,
      weight_kg: specs.dimensions?.weight_kg ?? null,
      wheelbase_mm: specs.dimensions?.wheelbase_mm ?? null,
    },
    efficiency: {
      fuel_combined_l_100km: specs.efficiency?.fuel_combined_l_100km ?? null,
      range_km: specs.efficiency?.range_km ?? null,
      is_electric: specs.efficiency?.is_electric || false,
    },
  };

  return safeStory;
}

const { v4: uuidv4 } = require("uuid");
module.exports = { runAutoSensePipeline };
