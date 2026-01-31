const { analystModel } = require("../../config/aiConfig");
const { analystPromptTemplate } = require("./prompts/analystPrompt");
const { AnalystReportSchema } = require("./schemas/analystSchema");

async function analyzeCar(carContext) {
  console.log("🧠 Analyst Agent: Thinking...");

  try {
    const leanContext = {
      identity: carContext.identity,
      visuals: carContext.visual_directives,
      specs: carContext.normalized_specs,
      intelligence: carContext.derived_intelligence,
      available_badges: carContext.certifications,
    };

    const chain = analystPromptTemplate.pipe(
      analystModel.withStructuredOutput(AnalystReportSchema),
    );

    const report = await chain.invoke({
      car_context_json: JSON.stringify(leanContext, null, 2),
    });

    console.log(
      `🧠 Analyst Agent: Done. Persona identified as "${report.marketing_persona}"`,
    );
    return report;
  } catch (error) {
    console.error("❌ Analyst Agent Failed:", error);
    throw new Error("Failed to analyze car context.");
  }
}

module.exports = { analyzeCar };
