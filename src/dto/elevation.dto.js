"use strict";
// import { IsNumber, IsObject, IsNotEmpty } from "class-validator";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalHeightResponseDto = exports.CalHeightRequestDto = exports.PointDto = void 0;
class PointDto {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
exports.PointDto = PointDto;
class CalHeightRequestDto {
    constructor(demName, startPoint, endPoint, numSample, coordinateCode) {
        this.demName = demName;
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.numSample = numSample;
        this.coordinateCode = coordinateCode || "EPSG:4326"; // Default value
    }
}
exports.CalHeightRequestDto = CalHeightRequestDto;
class CalHeightResponseDto {
    constructor(status, message, result) {
        this.status = status;
        this.message = message;
        this.result = result;
    }
}
exports.CalHeightResponseDto = CalHeightResponseDto;
