import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "sm:onboarding";
const COMPLETED_KEY = "sm:onboarding:completed";

export type OnboardingData = {
  questionId: number;
  answer: string;
}[];

export async function getOnboardingData(): Promise<OnboardingData | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function setOnboardingData(data: OnboardingData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function clearOnboardingData(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem(COMPLETED_KEY);
  return val === "1";
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(COMPLETED_KEY, "1");
  await AsyncStorage.setItem('justOnboarded', "true");
}

export async function justOnboarded ():Promise<boolean>{
  const val = await AsyncStorage.getItem('justOnboarded');
  return val === 'true'
}

export async function removeJustOnboarded(){
  await AsyncStorage.removeItem('justOnboarded');
}

export async function resetOnboardingCache(): Promise<void> {
  await AsyncStorage.multiRemove([KEY, COMPLETED_KEY, 'justOnboarded']);
}
