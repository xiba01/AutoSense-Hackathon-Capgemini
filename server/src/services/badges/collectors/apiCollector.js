

const axios = require("axios");
const { BADGE_REGISTRY } = require("../badgeRegistry");

const TIMEOUT_MS = 4500; 

const badgeClient = axios.create({
  timeout: TIMEOUT_MS,
  headers: { Accept: "application/json" }, 
});

function isUSMarket(make) {
  const NON_US_MAKES = [
    "DACIA",
    "PEUGEOT",
    "CITROEN",
    "RENAULT",
    "SEAT",
    "SKODA",
    "OPEL",
    "VAUXHALL",
    "BYD",
    "MG",
    "ALPINE",
  ];
  return !NON_US_MAKES.includes(make.toUpperCase());
}

async function checkNHTSA(year, make, model) {
  if (!isUSMarket(make)) return [];

  const badges = [];

  try {
    const searchUrl = `https://api.nhtsa.gov/SafetyRatings/modelyear/${year}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}?format=json`;

    const searchRes = await badgeClient.get(searchUrl);

    const results = searchRes.data.Results;
    if (!results || results.length === 0) return [];

    const vehicleId = results[0].VehicleId;

    const ratingUrl = `https://api.nhtsa.gov/SafetyRatings/VehicleId/${vehicleId}?format=json`;
    const ratingRes = await badgeClient.get(ratingUrl);

    const ratingData = ratingRes.data.Results[0];

    if (!ratingData) return [];

    const stars = ratingData.OverallRating; 

    if (stars === "5") {
      badges.push("SAFETY_NHTSA_5");
    } else if (stars === "4") {
      badges.push("SAFETY_NHTSA_4");
    }
  } catch (error) {

  }

  return badges;
}

async function checkEPA(year, make, model) {
  // 1. Optimization: Skip if not a US brand/market
  if (!isUSMarket(make)) return [];

  const badges = [];

  try {
    const searchUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;

    const searchRes = await badgeClient.get(searchUrl, {
      headers: { Accept: "application/json" },
    });

    let options = searchRes.data?.menuItem;
    if (!options) return [];
    if (!Array.isArray(options)) options = [options];

    const vehicleId = options[0]?.value;
    if (!vehicleId) return [];

    const detailUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/${vehicleId}`;
    const detailRes = await badgeClient.get(detailUrl, {
      headers: { Accept: "application/json" },
    });

    const smartWayStatus = parseInt(detailRes.data?.smartWay || "-1");

    if (smartWayStatus === 2) {
      badges.push("ENERGY_EPA_SMARTWAY_ELITE");
    } else if (smartWayStatus === 1) {
      badges.push("ENERGY_EPA_SMARTWAY");
    }
  } catch (error) {
  }

  return badges;
}

async function collectApiBadges(context) {
  const { year, make, model } = context.identity;

  const results = await Promise.allSettled([
    checkNHTSA(year, make, model),
    checkEPA(year, make, model),
  ]);

  const foundBadgeIds = [];

  results.forEach((result) => {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      foundBadgeIds.push(...result.value);
    }
  });

  const validBadges = foundBadgeIds
    .filter((id) => BADGE_REGISTRY[id])
    .map((id) => BADGE_REGISTRY[id]);

  if (validBadges.length > 0) {
  }

  return validBadges;
}

module.exports = { collectApiBadges };
