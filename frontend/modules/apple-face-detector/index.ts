import { requireNativeModule } from "expo-modules-core";

export type AppleFace = { x: number; y: number; width: number; height: number };
export type AppleResult = { width: number; height: number; faces: AppleFace[] };

const Native = requireNativeModule("AppleFaceDetector");
export const detectFacesApple = (uri: string): Promise<AppleResult> =>
  Native.detectFaces(uri);