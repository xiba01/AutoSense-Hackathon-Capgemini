const { analystModel } = require("../../config/aiConfig");
const { scriptPromptTemplate } = require("./prompts/scriptPrompt");
const { ScriptOutputSchema } = require("./schemas/scriptSchema");

const { StructuredOutputParser } = require("@langchain/core/output_parsers");

const parser = StructuredOutputParser.fromZodSchema(ScriptOutputSchema);

async function writeScript(carContext, storyboard, badges = []) {
  console.log(
    `✍️ Scriptwriter Agent: Writing scripts for ${storyboard.scenes.length} scenes...`,
  );

  try {
    const scenePromises = storyboard.scenes.map(async (scene) => {
      return processSingleScene(scene, carContext, badges);
    });

    const fullyWrittenScenes = await Promise.all(scenePromises);
    console.log("✍️ Scriptwriter Agent: Done.");

    return {
      ...storyboard,
      scenes: fullyWrittenScenes,
    };
  } catch (error) {
    console.error("❌ Scriptwriter Agent Failed:", error);
    throw new Error("Failed to write scripts.");
  }
}

const THEME_TO_BADGE_CATEGORIES = {
  SAFETY: ["Safety"],
  PERFORMANCE: ["Performance"],
  TECHNOLOGY: ["Technology"],
  EFFICIENCY: ["Eco", "Regulatory"],
  ECO: ["Eco", "Regulatory"],
  UTILITY: ["Technology", "Award"],
  VALUE: ["Award", "Reliability"],
  LUXURY: ["Award", "Technology"],
  GENERAL: [],
};

async function processSingleScene(scene, carContext, badges = []) {
  const inputData = {
    car_identity: `${carContext.identity.year} ${carContext.identity.make} ${carContext.identity.model}`,
    scene_objective: scene.main_feature_slug || scene.scene_type,
    scene_theme: scene.theme_tag || "GENERAL",
    feature_data: JSON.stringify(carContext.normalized_specs),
    format_instructions: parser.getFormatInstructions(),
  };

  const chain = scriptPromptTemplate.pipe(analystModel).pipe(parser);

  try {
    const result = await chain.invoke(inputData);

    const updatedScene = { ...scene };

    if (scene.scene_type === "intro_view" && result.intro_content) {
      updatedScene.intro_content = {
        ...result.intro_content,
        background_image:
          scene.visual_direction?.setting || "default_intro.jpg",
        brand_logo: "/assets/logos/toyota_white.png",
      };
    }
    else if (scene.scene_type === "outro_view" && result.outro_content) {
      updatedScene.outro_content = {
        ...result.outro_content,
        cta_buttons: [
          {
            label: result.outro_content.cta_button_primary,
            action: "OPEN_LEAD_FORM",
            style: "primary",
          },
          {
            label: result.outro_content.cta_button_secondary,
            action: "REPLAY_STORY",
            style: "secondary",
          },
        ],
      };
    }
    else if (scene.scene_type === "tech_view" && result.slide_content) {
      const themeTag = scene.theme_tag || "GENERAL";
      const relevantCategories = THEME_TO_BADGE_CATEGORIES[themeTag] || [];
      const sceneBadges = badges
        .filter((badge) => relevantCategories.includes(badge.category))
        .slice(0, 2);

      updatedScene.slide_content = {
        ...result.slide_content,
        theme_tag: themeTag,
        badges: sceneBadges,
      };

      updatedScene.hotspots = [];

      updatedScene.subtitles = [];
      updatedScene.raw_voiceover = result.slide_content.voiceover_text;

    }
    else if (scene.scene_type === "slide_view" && result.slide_content) {
      const hotspots = (result.slide_content.suggested_hotspots || []).map(
        (h, i) => ({
          id: `hs_${scene.scene_id}_${i}`,
          label: h.label,
          icon: h.icon || "circle",
          x: 50,
          y: 50, 
          hover_content: {
            title: h.detail_title,
            body: h.detail_body,
          },
        }),
      );

      const themeTag = scene.theme_tag || "GENERAL";
      const relevantCategories = THEME_TO_BADGE_CATEGORIES[themeTag] || [];
      const sceneBadges = badges
        .filter((badge) => relevantCategories.includes(badge.category))
        .slice(0, 2);

      updatedScene.slide_content = {
        ...result.slide_content,
        theme_tag: themeTag,
        badges: sceneBadges,
      };

      updatedScene.hotspots = hotspots;

      updatedScene.subtitles = [];
      updatedScene.raw_voiceover = result.slide_content.voiceover_text;
    }

    return updatedScene;
  } catch (err) {
    console.error(`⚠️ Failed to write scene ${scene.scene_id}:`, err.message);
    return scene;
  }
}

module.exports = { writeScript };
