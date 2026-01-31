const { collectLogicBadges } = require("./collectors/logicCollector");
const { collectApiBadges } = require("./collectors/apiCollector");
const { collectSearchBadges } = require("./collectors/searchCollector");

async function collectAllBadges(context) {
  console.log(
    `\n🏅 Badge Orchestrator: Starting collection for [${context.identity.make} ${context.identity.model}]...`,
  );
  const startTime = Date.now();

  try {
    const collectorLabels = ["Logic", "API", "Search"];
    const results = await Promise.allSettled([
      collectLogicBadges(context),
      collectSearchBadges(context),
    ]);

    results.forEach((result, idx) => {
      if (result.status === "rejected") {
        const reason =
          result.reason?.message || result.reason || "unknown error";
        console.warn(`⚠️ ${collectorLabels[idx]} collector failed: ${reason}`);
      }
    });

    let allBadges = [];

    if (results[0].status === "fulfilled") {
      allBadges.push(...results[0].value);
    }

    if (results[1].status === "fulfilled") {
      allBadges.push(...results[1].value);
    }

    if (results[2].status === "fulfilled") {
      allBadges.push(...results[2].value);
    }

    const uniqueBadgesMap = new Map();

    allBadges.forEach((badge) => {
      const group = badge.logic_config.group;
      const rank = badge.logic_config.rank;

      if (
        !uniqueBadgesMap.has(group) ||
        rank > uniqueBadgesMap.get(group).logic_config.rank
      ) {
        uniqueBadgesMap.set(group, badge);
      }
    });

    const finalBadges = Array.from(uniqueBadgesMap.values());

    const categoryOrder = {
      Safety: 1,
      Eco: 2,
      Performance: 3,
      Technology: 4,
      Reliability: 5,
      Award: 6,
      Regulatory: 7,
    };

    finalBadges.sort((a, b) => {
      const catDiff =
        (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
      if (catDiff !== 0) return catDiff;
      return b.logic_config.rank - a.logic_config.rank;
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `🏅 Badge Orchestrator: Finished. ${finalBadges.length} unique badges found in ${duration}s.`,
    );

    return finalBadges;
  } catch (error) {
    console.error("❌ Badge Orchestrator Critical Failure:", error);
    return [];
  }
}

module.exports = { collectAllBadges };
