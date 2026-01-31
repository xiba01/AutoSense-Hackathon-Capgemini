function cleanNum(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;

  const str = String(value).trim();
  if (str === "N/A" || str === "null" || str === "") return null;

  const match = str.match(/[\d,]+(\.\d+)?/);

  if (match) {
    return parseFloat(match[0].replace(/,/g, ""));
  }

  return null;
}

function cleanInt(value) {
  const num = cleanNum(value);
  return num !== null ? Math.round(num) : null;
}

function normalizeDrivetrain(drive) {
  if (!drive) return "FWD";
  const d = drive.toLowerCase();
  if (d.includes("all") || d.includes("4x4") || d.includes("awd")) return "AWD";
  if (d.includes("rear")) return "RWD";
  return "FWD";
}

module.exports = { cleanNum, cleanInt, normalizeDrivetrain };
