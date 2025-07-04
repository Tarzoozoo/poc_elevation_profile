const { getElevationProfile } = require("./height_profile");
import { Point } from "./height_profile";
import path from "path";

async function main() {
  const startPoint_t: Point = { x: 12.9949254, y: 101.4433517 };
  const endPoint_t: Point = { x: 12.9939417, y: 101.4439043 };

  try {
    console.log("main function started");
    const filePath = path.resolve(__dirname, "../../", `dsm.tif`);
    const profile = await getElevationProfile(
      filePath,
      startPoint_t,
      endPoint_t,
      100000,
      "EPSG:4326"
    );
    console.log("Elevation Profile:", profile);
  } catch (error) {
    console.error("Error fetching elevation profile:", error);
  }
}

main();
