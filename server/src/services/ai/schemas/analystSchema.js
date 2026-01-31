const { z } = require("zod");

const AnalystReportSchema = z.object({
  marketing_persona: z
    .string()
    .describe(
      "A short, catchy marketing title for the car, e.g., 'The Weekend Warrior' or 'The City Slicker'",
    ),

  target_audience: z
    .string()
    .describe(
      "Who is the ideal buyer? e.g., 'Young families looking for value'",
    ),

  suggested_tone: z.enum([
    "Exciting",
    "Trustworthy",
    "Luxurious",
    "Eco-Conscious",
    "Rugged",
    "Playful",
    "Serious",
  ]),

  prioritized_features: z.array(
    z.object({
      feature_name: z.string(),
      benefit_description: z.string(),
      category: z
        .string()
        .describe(
          "Category such as Performance, Efficiency, Safety, Technology, Comfort, Design, Utility, Value, Eco, etc.",
        ),
      score: z
        .number()
        .min(1)
        .max(10)
        .describe("How strong is this feature for this specific car?"),
    }),
  ),

  narrative_angle: z
    .string()
    .describe(
      "One sentence guidance for the scriptwriter on the overall story arc.",
    ),

  highlight_badges: z
    .array(z.string())
    .describe("The IDs of the top 3 most impressive badges to show."),
});

module.exports = { AnalystReportSchema };
