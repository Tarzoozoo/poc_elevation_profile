// import { IsNumber, IsObject, IsNotEmpty } from "class-validator";

export class PointDto {
  x: number; // longitude/easting
  y: number; // latitude/northing
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class CalHeightRequestDto {
  demName: string; // Path to the DEM file
  startPoint: PointDto;
  endPoint: PointDto;
  numSample: number; // Number of samples for the height calculation
  coordinateCode?: string; // Coordinate reference system code (e.g., "EPSG:4326")

  constructor(
    demName: string,
    startPoint: PointDto,
    endPoint: PointDto,
    numSample: number,
    coordinateCode?: string
  ) {
    this.demName = demName;
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.numSample = numSample;
    this.coordinateCode = coordinateCode || "EPSG:4326"; // Default value
  }
}

export class CalHeightResponseDto {
  status: string;
  message: string;
  result: [number, number][];

  constructor(status: string, message: string, result: [number, number][]) {
    this.status = status;
    this.message = message;
    this.result = result;
  }
  
}
