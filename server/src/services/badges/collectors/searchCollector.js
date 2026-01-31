const { tavily } = require("@tavily/core");
const { ChatGroq } = require("@langchain/groq");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require("@langchain/core/output_parsers");
const { z } = require("zod");
require("dotenv").config();

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const analystModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-120b",
  temperature: 0.1,
});

const SEARCH_TARGETS = `
1. IIHS Top Safety Pick / Plus (USA)
2. Euro NCAP / ANCAP / ASEAN NCAP / JNCAP / C-NCAP 5 Stars
3. MotorTrend Car/SUV of the Year
4. Car and Driver 10Best / Editors' Choice
5. Wards 10 Best Engines / Interiors
6. Red Dot Design Award
7. World Car of the Year (WCOTY)
8. Kelley Blue Book (KBB) Best Buy / Resale
9. What Car? Car of the Year
10. J.D. Power Quality / Dependability
11. Consumer Reports Recommended
12. Green NCAP 5 Stars
`;

const ExtractionSchema = z.object({
  found_badges: z.array(
    z.object({
      badge_id: z
        .string()
        .describe("The exact ID from the allowed list (e.g. SAFETY_IIHS_TSP)"),
      evidence_snippet: z
        .string()
        .describe("The exact quote from the text proving the award."),
      confidence: z
        .enum(["HIGH", "LOW"])
        .describe("HIGH if year/model match perfectly. LOW if ambiguous."),
    }),
  ),
});

const parser = StructuredOutputParser.fromZodSchema(ExtractionSchema);

const EXTRACTION_SYSTEM_PROMPT = `
You are an Automotive Data Verification Expert. 
Your job is to read search results and extract verifiable awards for a specific vehicle.

### THE VEHICLE:
**{car_identity}**

### THE TARGET AWARDS:
${SEARCH_TARGETS}

### MAPPING RULES (Strictly Follow):
- "IIHS Top Safety Pick+" -> SAFETY_IIHS_TSP_PLUS
- "IIHS Top Safety Pick" -> SAFETY_IIHS_TSP
- "Euro NCAP 5 Stars" -> SAFETY_EURONCAP_5
- "Euro NCAP Advanced" -> SAFETY_EURONCAP_ADV
- "Green NCAP 5 Stars" -> ENERGY_GREENNCAP_5
- "ANCAP 5 Stars" -> SAFETY_ANCAP_5
- "ASEAN NCAP 5 Stars" -> SAFETY_ASEANNCAP_5
- "JNCAP 5 Stars" -> SAFETY_JNCAP_5
- "Latin NCAP 5 Stars" -> SAFETY_LATINNCAP_5
- "C-NCAP 5 Stars" -> SAFETY_CNCAP_5
- "MotorTrend Car/SUV of the Year" -> AWARD_MOTORTREND_COTY or AWARD_MOTORTREND_SUV
- "Car and Driver 10Best" -> AWARD_CARANDDRIVER_10BEST
- "Car and Driver Editors Choice" -> AWARD_CARANDDRIVER_EDITORS
- "Wards 10 Best Engines" -> AWARD_WARDS_ENGINES
- "Wards 10 Best Interiors" -> AWARD_WARDS_INTERIORS
- "Red Dot Design Award" -> AWARD_RED_DOT
- "World Car of the Year" -> AWARD_WCOTY
- "KBB Best Buy" -> AWARD_KBB_BEST_BUY
- "KBB Best Resale" -> AWARD_KBB_RESALE
- "What Car? Car of the Year" -> AWARD_WHATCAR_COTY
- "J.D. Power Quality" -> TRUST_JDPOWER_QUALITY
- "J.D. Power Dependability" -> TRUST_JDPOWER_DEPENDABILITY
- "Consumer Reports Recommended" -> TRUST_CR_RECOMMENDED

### VERIFICATION LOGIC (CRITICAL):
1. **Year Match:** If the text says "The 2018 model won..." but our car is **2022**, IGNORE IT. 
   - *Exception:* If the car generation is the same (e.g., "Duster II"), assume the award applies to the whole generation.
2. **Model Match:** Ensure it is the correct model. Don't confuse "Duster" with "Sandero".
3. **No Hallucinations:** If you don't see explicit mention of an award in the text, return an empty array.

{format_instructions}
`;

const extractionPrompt = ChatPromptTemplate.fromMessages([
  ["system", EXTRACTION_SYSTEM_PROMPT],
  ["human", "Analyze these search results:\n\n{search_results}"],
]);

async function performDualSearch(year, make, model) {
  const querySafety = `${year} ${make} ${model} official crash test safety ratings Euro NCAP IIHS Green NCAP results`;
  const queryAwards = `${year} ${make} ${model} reviews awards accolades JD Power Kelley Blue Book MotorTrend`;

  try {
    const [safetyRes, awardsRes] = await Promise.all([
      tvly.search(querySafety, {
        search_depth: "basic",
        max_results: 3,
        include_answer: true,
      }),
      tvly.search(queryAwards, {
        search_depth: "basic",
        max_results: 3,
        include_answer: true,
      }),
    ]);

    let evidenceText = `
    --- SAFETY SEARCH SUMMARY ---
    ${safetyRes.answer}
    ${safetyRes.results.map((r) => `- ${r.content}`).join("\n")}

    --- AWARDS SEARCH SUMMARY ---
    ${awardsRes.answer}
    ${awardsRes.results.map((r) => `- ${r.content}`).join("\n")}
    `;

    const truncatedEvidence = evidenceText.substring(0, 3000);

    console.log(
      `   🔍 Tavily evidence (truncated ${truncatedEvidence.length}/3000 chars):\n${truncatedEvidence}`,
    );

    return truncatedEvidence;
  } catch (error) {
    console.warn("   ⚠️ Tavily Search failed:", error.message);
    return "";
  }
}

async function analyzeSearchResults(evidenceText, carIdentityStr) {
  if (!evidenceText || evidenceText.length < 50) return [];

  const chain = extractionPrompt.pipe(analystModel).pipe(parser);

  try {
    const result = await chain.invoke({
      car_identity: carIdentityStr,
      search_results: evidenceText,
      format_instructions: parser.getFormatInstructions(),
    });

    return result.found_badges || [];
  } catch (error) {
    console.warn("   ⚠️ Badge Extraction Parsing failed:", error.message);
    return [];
  }
}

const { BADGE_REGISTRY } = require("../badgeRegistry");

async function collectSearchBadges(context) {
  const missingKeys = [];
  if (!process.env.TAVILY_API_KEY) missingKeys.push("TAVILY_API_KEY");
  if (!process.env.GROQ_API_KEY) missingKeys.push("GROQ_API_KEY");
  if (missingKeys.length > 0) {
    console.warn(
      `   ⚠️ Search Collector skipped: missing ${missingKeys.join(", ")}. Configure env to enable award discovery.`,
    );
    return [];
  }

  const { year, make, model } = context.identity;
  const carIdentityStr = `${year} ${make} ${model}`;

  const evidence = await performDualSearch(year, make, model);

  if (!evidence) {
    console.warn(
      "   ⚠️ Search Collector skipped: no evidence returned from Tavily search.",
    );
    return [];
  }

  const extractedRaw = await analyzeSearchResults(evidence, carIdentityStr);

  const validBadges = [];

  for (const rawBadge of extractedRaw) {
    const registryEntry = BADGE_REGISTRY[rawBadge.badge_id];

    if (registryEntry && rawBadge.confidence === "HIGH") {
      const badgWithEvidence = {
        ...registryEntry,
        evidence: rawBadge.evidence_snippet,
      };

      validBadges.push(badgWithEvidence);
    }
  }

  return validBadges;
}

module.exports = { collectSearchBadges };
