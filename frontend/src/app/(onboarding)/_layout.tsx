import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="quiz" />
      <Stack.Screen name="analyzing"  options={{ animation: "fade" }} />
      <Stack.Screen name="results" options={{ animation: "fade" }} />
      <Stack.Screen name="face-scan" />
    </Stack>
  );
}
