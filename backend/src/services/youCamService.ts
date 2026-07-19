import aiConfig from '../config/ai.config';

// --- Real API types ---

interface YouCamMetricResult {
  ui_score: number;
  raw_score: number;
  mask_urls: string[];
  type: string;
  url: string | null;
}

interface YouCamSkinTypeResult {
  mask_urls: string[];
  type: 'skin_type';
  region: 'whole' | 't_zone' | 'u_zone';
  skin_type: string;
  url: string | null;
}

interface YouCamOverallResult {
  score: number;
  type: 'all' | 'skin_age';
  url: string | null;
}

type YouCamOutputItem = YouCamMetricResult | YouCamSkinTypeResult | YouCamOverallResult;

interface YouCamTaskResponse {
  status: number;
  data: {
    task_id?: string;
    task_status?: string;
    error: string | null;
    results?: { output: YouCamOutputItem[] };
  };
}

// --- Normalized internal type ---

export interface YouCamScanResult {
  overall: { score: number };
  skinAge: { score: number };
  skinType: { whole: string; tZone: string; uZone: string };
  metrics: {
    acne: { rawScore: number; uiScore: number };
    wrinkle: { rawScore: number; uiScore: number };
    ageSpot: { rawScore: number; uiScore: number };
    redness: { rawScore: number; uiScore: number };
    pore: { rawScore: number; uiScore: number };
    oiliness: { rawScore: number; uiScore: number };
    texture: { rawScore: number; uiScore: number };
    moisture: { rawScore: number; uiScore: number };
  };
}

// --- Response parser ---

export function parseScanResponse(output: YouCamOutputItem[]): YouCamScanResult {
  const result: YouCamScanResult = {
    overall: { score: 0 },
    skinAge: { score: 0 },
    skinType: { whole: 'normal', tZone: 'normal', uZone: 'normal' },
    metrics: {
      acne: { rawScore: 0, uiScore: 0 },
      wrinkle: { rawScore: 0, uiScore: 0 },
      ageSpot: { rawScore: 0, uiScore: 0 },
      redness: { rawScore: 0, uiScore: 0 },
      pore: { rawScore: 0, uiScore: 0 },
      oiliness: { rawScore: 0, uiScore: 0 },
      texture: { rawScore: 0, uiScore: 0 },
      moisture: { rawScore: 0, uiScore: 0 },
    },
  };

  const metricTypeMap: Record<string, keyof YouCamScanResult['metrics']> = {
    acne: 'acne',
    wrinkle: 'wrinkle',
    age_spot: 'ageSpot',
    redness: 'redness',
    pore: 'pore',
    oiliness: 'oiliness',
    texture: 'texture',
    moisture: 'moisture',
  };

  for (const item of output) {
    if (item.type === 'all' && 'score' in item) {
      result.overall.score = item.score;
    } else if (item.type === 'skin_age' && 'score' in item) {
      result.skinAge.score = item.score;
    } else if (item.type === 'skin_type' && 'skin_type' in item) {
      const st = item as YouCamSkinTypeResult;
      if (st.region === 'whole') result.skinType.whole = st.skin_type;
      else if (st.region === 't_zone') result.skinType.tZone = st.skin_type;
      else if (st.region === 'u_zone') result.skinType.uZone = st.skin_type;
    } else if (item.type in metricTypeMap && 'raw_score' in item) {
      const m = item as YouCamMetricResult;
      const key = metricTypeMap[item.type];
      result.metrics[key] = { rawScore: m.raw_score, uiScore: m.ui_score };
    }
  }

  return result;
}

// --- Mock data (based on real API response) ---

const MOCK_SCAN_RESULT: YouCamScanResult = {
  overall: { score: 72 },
  skinAge: { score: 27 },
  skinType: { whole: 'combination', tZone: 'oily', uZone: 'normal' },
  metrics: {
    acne: { rawScore: 35, uiScore: 65 },
    wrinkle: { rawScore: 15, uiScore: 85 },
    ageSpot: { rawScore: 20, uiScore: 80 },
    redness: { rawScore: 40, uiScore: 60 },
    pore: { rawScore: 45, uiScore: 55 },
    oiliness: { rawScore: 50, uiScore: 50 },
    texture: { rawScore: 30, uiScore: 70 },
    moisture: { rawScore: 55, uiScore: 55 },
  },
};

// --- Helpers ---

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startTask(photoUrl: string): Promise<string> {
  const res = await fetch(aiConfig.youCam.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiConfig.youCam.apiKey}`,
    },
    body: JSON.stringify({
      src_file_url: photoUrl,
      dst_actions: [
        'skin_type',
        'moisture',
        'oiliness',
        'texture',
        'pore',
        'redness',
        'age_spot',
        'wrinkle',
        'radiance',
        'acne',
      ],
      miniserver_args: { enable_mask_overlay: false },
      format: 'json',
      pf_camera_kit: false,
    }),
  });

  const body: YouCamTaskResponse = await res.json().catch(() => ({ status: res.status, data: { error: 'Failed to parse response' } }));

  if (!res.ok) {
    console.error('[YouCam] Start task failed:', JSON.stringify(body));
    throw new Error(`YouCam API error starting task: ${res.status} — ${JSON.stringify(body)}`);
  }
  if (body.data.error) {
    throw new Error(`YouCam API error: ${body.data.error}`);
  }
  if (!body.data.task_id) {
    throw new Error('YouCam API did not return a task_id');
  }

  console.log(`[YouCam] Task started: ${body.data.task_id}`);
  return body.data.task_id;
}

async function pollTask(taskId: string): Promise<YouCamOutputItem[]> {
  const maxAttempts = 60;
  const pollInterval = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await delay(pollInterval);

    const res = await fetch(`${aiConfig.youCam.apiUrl}/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${aiConfig.youCam.apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`YouCam API poll error: ${res.status} ${res.statusText}`);
    }

    const body: YouCamTaskResponse = await res.json();

    if (body.data.task_status === 'success') {
      if (!body.data.results?.output) {
        throw new Error('YouCam API returned success but no results');
      }
      console.log(`[YouCam] Task completed after ${attempt} poll(s)`);
      return body.data.results.output;
    }

    if (body.data.task_status === 'error') {
      const errorMsg = body.data.error ?? 'unknown error';
      const userFriendlyErrors: Record<string, string> = {
        'error_src_face_too_small': 'Your face is too small in the photo. Please move closer to the camera and try again.',
        'error_src_no_face': 'No face detected in the photo. Please make sure your face is clearly visible.',
        'error_src_multiple_faces': 'Multiple faces detected. Please make sure only your face is in the photo.',
        'error_src_face_occluded': 'Your face is partially covered. Please remove any obstructions and try again.',
      };
      throw new Error(userFriendlyErrors[errorMsg] || `Skin analysis failed: ${errorMsg}`);
    }

    console.log(`[YouCam] Poll ${attempt}/${maxAttempts} — status: ${body.data.task_status}`);
  }

  throw new Error('YouCam API task timed out after 2 minutes');
}

// --- Main entry point ---

export async function analyzeSkinPhoto(photoUrl: string): Promise<YouCamScanResult> {
  if (aiConfig.youCam.useMock) {
    const mockTaskId = 'mock_' + Math.random().toString(36).slice(2, 15);
    console.log(`[YouCam] Task started: ${mockTaskId}`);
    console.log(`[YouCam] Poll 1/60 — status: running`);
    await delay(2000);
    console.log(`[YouCam] Task completed after 2 poll(s)`);
    return MOCK_SCAN_RESULT;
  }

  const taskId = await startTask(photoUrl);
  const output = await pollTask(taskId);
  return parseScanResponse(output);
}
