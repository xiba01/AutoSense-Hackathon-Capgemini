const { BADGE_REGISTRY } = require("../badgeRegistry");

// --- HELPER CONSTANTS ---
const FUEL = {
  EV: "EV",
  HYBRID: "HYBRID",
  GAS: "GAS",
  HYDROGEN: "HYDROGEN",
};

function determineFuelType(context) {
  const apiFuel =
    context.raw_api_dump?.fuelType || context.raw_api_dump?.engineType || "";
  const trimName = context.identity.trim || "";
  const normalized = apiFuel.toUpperCase();
  const trimUpper = trimName.toUpperCase();

  if (context.normalized_specs.efficiency.is_electric) return FUEL.EV;
  if (normalized.includes("ELECTRIC") || normalized.includes("BEV"))
    return FUEL.EV;

  if (
    normalized.includes("HYBRID") ||
    trimUpper.includes("PHEV") ||
    trimUpper.includes("HYBRID") ||
    trimUpper.includes("EQ BOOST")
  )
    return FUEL.HYBRID;

  if (normalized.includes("HYDROGEN") || normalized.includes("FCEV"))
    return FUEL.HYDROGEN;

  if (normalized.includes("DIESEL")) return FUEL.DIESEL;

  return FUEL.GAS;
}

function determineEuroStandard(context) {
  const apiStandard = context.raw_api_dump?.emissionStandards || "";
  const year = context.identity.year;

  if (apiStandard) {
    if (apiStandard.includes("Euro 6")) return 6;
    if (apiStandard.includes("Euro 5")) return 5;
    if (apiStandard.includes("Euro 4")) return 4;
    if (apiStandard.includes("Euro 3")) return 3;
  }

  if (year >= 2015) return 6;
  if (year >= 2011) return 5;
  if (year >= 2006) return 4;
  if (year >= 2001) return 3;

  return 2;
}

function hasKeyword(context, keywords) {
  const trim = (context.identity.trim || "").toUpperCase();
  const notes = (
    context.request_params?.dealer_color_input || ""
  ).toUpperCase();
  const series = (context.identity.series || "").toUpperCase();
  const rawDump = JSON.stringify(context.raw_api_dump).toUpperCase();

  return keywords.some(
    (k) =>
      trim.includes(k) ||
      notes.includes(k) ||
      series.includes(k) ||
      rawDump.includes(k),
  );
}

function checkEnvironmentalBadges(context, fuelType, euroLevel) {
  const foundBadges = [];

  if (fuelType === FUEL.EV || fuelType === FUEL.HYDROGEN) {
    foundBadges.push("ECO_CRITAIR_0");
  } else if (fuelType === FUEL.HYBRID) {
    foundBadges.push("ECO_CRITAIR_1");
  } else if (fuelType === FUEL.GAS) {
    if (euroLevel >= 5) foundBadges.push("ECO_CRITAIR_1");
    else if (euroLevel === 4) foundBadges.push("ECO_CRITAIR_2");
    else if (euroLevel >= 2) foundBadges.push("ECO_CRITAIR_3");
  } else if (fuelType === FUEL.DIESEL) {
    if (euroLevel >= 5) foundBadges.push("ECO_CRITAIR_2");
    else if (euroLevel === 4) foundBadges.push("ECO_CRITAIR_3");
  }

  if (fuelType === FUEL.EV || fuelType === FUEL.HYBRID) {
    foundBadges.push("ECO_DE_EKENNZEICHEN");
  }
  if (euroLevel >= 4) {
    foundBadges.push("ECO_DE_UMWELT_4");
  }

  if (fuelType === FUEL.EV) {
    foundBadges.push("ECO_ES_DGT_0");
  } else if (fuelType === FUEL.HYBRID) {
    foundBadges.push("ECO_ES_DGT_ECO");
  } else {
    if (
      (fuelType === FUEL.GAS && euroLevel >= 4) ||
      (fuelType === FUEL.DIESEL && euroLevel >= 6)
    ) {
      foundBadges.push("ECO_ES_DGT_C");
    }
  }

  const isGasCompliant =
    (fuelType === FUEL.GAS || fuelType === FUEL.HYBRID) && euroLevel >= 4;
  const isDieselCompliant = fuelType === FUEL.DIESEL && euroLevel >= 6;
  const isEvCompliant = fuelType === FUEL.EV || fuelType === FUEL.HYDROGEN;

  if (isGasCompliant || isDieselCompliant || isEvCompliant) {
    foundBadges.push("ECO_UK_ULEZ");
  }

  if (
    (fuelType === FUEL.DIESEL && euroLevel >= 5) ||
    (fuelType !== FUEL.DIESEL && euroLevel >= 2)
  ) {
    foundBadges.push("ECO_BE_LEZ");
  }

  return foundBadges;
}

function checkEfficiencyBadges(context, fuelType) {
  const foundBadges = [];
  const co2 = context.raw_api_dump?.co2EmissionsGPerKm
    ? parseInt(context.raw_api_dump.co2EmissionsGPerKm)
    : null;

  if (fuelType === FUEL.EV || fuelType === FUEL.HYDROGEN) {
    foundBadges.push("ENERGY_ZERO_EMISSION");
  }

  if (co2 !== null) {
    if (co2 < 50)
      foundBadges.push("ENERGY_EU_A_PLUS"); // Very low (PHEV/EV)
    else if (co2 < 100) foundBadges.push("ENERGY_EU_A");
    else if (co2 < 120) foundBadges.push("ENERGY_EU_B");
  } else if (fuelType === FUEL.EV) {
    // If CO2 is missing but it's EV, assume A+
    foundBadges.push("ENERGY_EU_A_PLUS");
  }

  return foundBadges;
}

function checkTechBadges(context) {
  const foundBadges = [];

  if (hasKeyword(context, ["APPLE CARPLAY", "CARPLAY", "PHONE INTEGRATION"])) {
    foundBadges.push("TECH_APPLE_CARPLAY");
  } else if (context.identity.year >= 2019) {
    foundBadges.push("TECH_APPLE_CARPLAY");
  }

  if (hasKeyword(context, ["ANDROID AUTO", "ANDROID"])) {
    foundBadges.push("TECH_ANDROID_AUTO");
  } else if (context.identity.year >= 2019) {
    foundBadges.push("TECH_ANDROID_AUTO");
  }

  if (hasKeyword(context, ["BLUETOOTH", "WIRELESS", "HANDS-FREE"])) {
    foundBadges.push("TECH_BLUETOOTH");
  } else if (context.identity.year >= 2012) {
    foundBadges.push("TECH_BLUETOOTH");
  }

  if (hasKeyword(context, ["DOLBY", "ATMOS"])) {
    foundBadges.push("TECH_DOLBY_ATMOS");
  }

  if (
    hasKeyword(context, [
      "BOSE",
      "HARMAN",
      "KARDON",
      "BURMESTER",
      "MERIDIAN",
      "JBL",
      "BANG & OLUFSEN",
      "B&O",
    ])
  ) {
    foundBadges.push("TECH_PREMIUM_AUDIO");
  }

  return foundBadges;
}

function checkHistoryBadges(context) {
  const foundBadges = [];

  if (
    hasKeyword(context, ["1 OWNER", "ONE OWNER", "SINGLE OWNER", "1-OWNER"])
  ) {
    foundBadges.push("TRUST_CARFAX_1OWNER");
  }

  if (
    hasKeyword(context, [
      "ACCIDENT FREE",
      "CLEAN TITLE",
      "NO ACCIDENTS",
      "CLEAN CARFAX",
    ])
  ) {
    foundBadges.push("TRUST_CARFAX_CLEAN");
  }

  if (hasKeyword(context, ["BUYBACK PROTECTION", "AUTOCHECK CERTIFIED"])) {
    foundBadges.push("TRUST_AUTOCHECK_BUYBACK");
  }

  if (hasKeyword(context, ["TÜV", "TUV", "HU/AU", "INSPECTED"])) {
    foundBadges.push("TRUST_TUEV_SUED");
  }

  if (hasKeyword(context, ["DEKRA", "SEAL OF QUALITY"])) {
    foundBadges.push("TRUST_DEKRA");
  }

  return foundBadges;
}

function collectLogicBadges(context) {
  try {
    const fuelType = determineFuelType(context);
    const euroLevel = determineEuroStandard(context);

    const envBadges = checkEnvironmentalBadges(context, fuelType, euroLevel);
    const effBadges = checkEfficiencyBadges(context, fuelType);
    const techBadges = checkTechBadges(context);
    const histBadges = checkHistoryBadges(context);

    const allBadgeIds = [
      ...envBadges,
      ...effBadges,
      ...techBadges,
      ...histBadges,
    ];

    const validBadges = allBadgeIds
      .filter((id) => BADGE_REGISTRY[id])
      .map((id) => BADGE_REGISTRY[id]);

    return validBadges;
  } catch (error) {
    console.error("❌ Logic Collector Failed:", error.message);
    return [];
  }
}

module.exports = { collectLogicBadges };
