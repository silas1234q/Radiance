import * as StoreReview from "expo-store-review";

export async function requestAppReview() {
  try {
    const available = await StoreReview.isAvailableAsync();

    if (!available) {
      console.log("In-app review is not available.");
      return;
    }

    await StoreReview.requestReview();
  } catch (error) {
    console.warn("Could not request app review:", error);
  }
}
