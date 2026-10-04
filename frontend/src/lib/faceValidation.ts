import type {
  RNMLKitFace,
  RNMLKitFaceDetectionResult,
} from '@infinitered/react-native-mlkit-face-detection';

/**
 * Thresholds for accepting a face-scan photo. Tuned for a front-camera selfie
 * held at arm's length in portrait orientation.
 */
const FACE_MIN_WIDTH_RATIO = 0.18; // face must fill at least this fraction of image width
const FACE_MAX_WIDTH_RATIO = 0.9; // ...and no more than this (too close)
const CENTER_MAX_DX = 0.22; // max |center - 0.5| horizontally
const CENTER_MAX_DY = 0.25; // max |center - 0.5| vertically
const MAX_YAW_DEG = 20; // headEulerAngleY — turning left/right
const MAX_PITCH_DEG = 20; // headEulerAngleX — nodding up/down
const MAX_ROLL_DEG = 18; // headEulerAngleZ — tilting head sideways
const MIN_EYE_OPEN_PROB = 0.2;

export type FaceValidation = { ok: true; face: RNMLKitFace } | { ok: false; reason: string };

/**
 * Validate an MLKit detection result against a captured photo of the given
 * pixel dimensions. Returns the first failing reason so we can guide the user.
 */
export function validateFaceScan(
  result: RNMLKitFaceDetectionResult | undefined,
  imageWidth: number,
  imageHeight: number,
): FaceValidation {
  // Note: the native module does not reliably populate `result.success`
  // (it comes back undefined even on a good detection), so we key off `faces`.
  if (!result || !Array.isArray(result.faces)) {
    return { ok: false, reason: "Couldn't read that photo. Please try again." };
  }

  const faces = result.faces;
  if (faces.length === 0) {
    return { ok: false, reason: 'No face detected. Center your face in the space below.' };
  }
  if (faces.length > 1) {
    return { ok: false, reason: 'Multiple faces detected. Make sure only you are in frame.' };
  }

  const face = faces[0];
  const { origin, size } = face.frame;

  // Guard against non-finite values coming back from the native detector.
  if (
    !imageWidth ||
    !imageHeight ||
    !Number.isFinite(size.x) ||
    !Number.isFinite(size.y) ||
    !Number.isFinite(origin.x) ||
    !Number.isFinite(origin.y)
  ) {
    return { ok: false, reason: "Couldn't read that photo. Please try again." };
  }

  // --- Size: not too far, not too close ---
  const widthRatio = size.x / imageWidth;
  if (widthRatio < FACE_MIN_WIDTH_RATIO) {
    return { ok: false, reason: 'Move a little closer.' };
  }
  if (widthRatio > FACE_MAX_WIDTH_RATIO) {
    return { ok: false, reason: 'Move back slightly.' };
  }

  // --- Centering ---
  const centerX = (origin.x + size.x / 2) / imageWidth;
  const centerY = (origin.y + size.y / 2) / imageHeight;
  if (Math.abs(centerX - 0.5) > CENTER_MAX_DX) {
    return { ok: false, reason: 'Center your face horizontally.' };
  }
  if (Math.abs(centerY - 0.5) > CENTER_MAX_DY) {
    return { ok: false, reason: 'Center your face vertically.' };
  }

  // --- Head pose (only when the detector reported an angle) ---
  if (face.hasHeadEulerAngleY && face.headEulerAngleY != null && Math.abs(face.headEulerAngleY) > MAX_YAW_DEG) {
    return { ok: false, reason: 'Look straight at the camera.' };
  }
  if (face.hasHeadEulerAngleX && face.headEulerAngleX != null && Math.abs(face.headEulerAngleX) > MAX_PITCH_DEG) {
    return { ok: false, reason: "Keep your head level — don't tilt up or down." };
  }
  if (face.hasHeadEulerAngleZ && face.headEulerAngleZ != null && Math.abs(face.headEulerAngleZ) > MAX_ROLL_DEG) {
    return { ok: false, reason: 'Straighten your head.' };
  }

  // --- Eyes open (only when classification data is available) ---
  const leftClosed =
    face.hasLeftEyeOpenProbability &&
    face.leftEyeOpenProbability != null &&
    face.leftEyeOpenProbability < MIN_EYE_OPEN_PROB;
  const rightClosed =
    face.hasRightEyeOpenProbability &&
    face.rightEyeOpenProbability != null &&
    face.rightEyeOpenProbability < MIN_EYE_OPEN_PROB;
  if (leftClosed || rightClosed) {
    return { ok: false, reason: 'Keep both eyes open.' };
  }

  return { ok: true, face };
}
