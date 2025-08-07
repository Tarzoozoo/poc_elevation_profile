const { getElevationProfile } = require("./height_profile_new");
import { GeographicPoint } from "./height_profile_new";
import path from "path";

async function main() {
  // const startPoint_t: Point = { x: 12.9949254, y: 101.4433517 };
  // const endPoint_t: Point = { x: 12.9939417, y: 101.4439043 };

  // For height_profile_new
  const startPoint_t: GeographicPoint = { lon: 101.4433517, lat: 12.9949254 };
  const endPoint_t: GeographicPoint = { lon: 101.4439043, lat: 12.9939417 };

  try {
    console.log("main function started");
    const filePath = path.resolve(__dirname, "../../", `dsm.tif`);
    const profile = await getElevationProfile(
      filePath,
      startPoint_t,
      endPoint_t,
      10000,
      "EPSG:4326"
    );
    console.log("Elevation Profile:", profile);
  } catch (error) {
    console.error("Error fetching elevation profile:", error);
  }
}

main();
