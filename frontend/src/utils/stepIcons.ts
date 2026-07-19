import { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

interface StepIconInfo {
  icon: IconName;
  color: string;
}

const STEP_ICON_MAP: Record<string, StepIconInfo> = {
  cleanser: { icon: "water-outline", color: "#4FC3F7" },
  toner: { icon: "flask-outline", color: "#AB47BC" },
  serum: { icon: "eyedrop-outline", color: "#F06680" },
  moisturizer: { icon: "leaf-outline", color: "#66BB6A" },
  sunscreen: { icon: "sunny-outline", color: "#FF9500" },
  exfoliator: { icon: "sparkles-outline", color: "#FF7043" },
  "eye cream": { icon: "eye-outline", color: "#5C6BC0" },
  mask: { icon: "happy-outline", color: "#26A69A" },
  "face wash": { icon: "water-outline", color: "#4FC3F7" },
  "face oil": { icon: "eyedrop-outline", color: "#FFB74D" },
  retinol: { icon: "moon-outline", color: "#7E57C2" },
  "lip balm": { icon: "heart-outline", color: "#EC407A" },
  spf: { icon: "sunny-outline", color: "#FF9500" },
};

const DEFAULT_ICON: StepIconInfo = {
  icon: "diamond-outline",
  color: "#F06680",
};

export function getStepIcon(stepName: string): StepIconInfo {
  const key = stepName.toLowerCase().trim();
  for (const [name, info] of Object.entries(STEP_ICON_MAP)) {
    if (key.includes(name)) return info;
  }
  return DEFAULT_ICON;
}
