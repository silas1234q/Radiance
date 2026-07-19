export interface FaceChecks {
  faceDetected: boolean;
  centered: boolean;
  distance: boolean;
  headPose: boolean;
  lighting: boolean;
  focus: boolean;
}

export interface CheckStatus {
  key: keyof FaceChecks;
  label: string;
  passed: boolean;
}

export type CaptureState =
  | 'scanning'
  | 'holding'
  | 'countdown'
  | 'capturing'
  | 'frozen'
  | 'analyzing';
