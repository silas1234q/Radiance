import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { clearOnboardingData, getOnboardingData, markOnboardingComplete } from "../lib/onboardingCache";
import { waitForBackendReady } from "../lib/authToken";
import { useSubmitQuiz } from "./queries/useQuiz";

/**
 * Fallback only. The root layout normally submits cached quiz answers right
 * after sign-in (sync → submit → route). This catches the case where that
 * submit failed and answers are still sitting in the local cache.
 *
 * It does NOT call /auth/sync (the root layout owns that) and does NOT query
 * the server for existing answers.
 */
const useAutoSubmitQuiz = () => {
  const { isSignedIn } = useAuth();
  const { mutateAsync: submitQuiz } = useSubmitQuiz();
  const submitRef = useRef(submitQuiz);
  submitRef.current = submitQuiz;
  const running = useRef(false);
  const done = useRef(false);

  useEffect(() => {
    if (!isSignedIn || running.current || done.current) return;
    running.current = true;

    (async () => {
      try {
        await waitForBackendReady(); // never fire before the backend knows us
        const data = await getOnboardingData();
        if (data && data.length > 0) {
          await submitRef.current(data);
          markOnboardingComplete();
          await clearOnboardingData(); // only after success
        }
        done.current = true;
      } catch (err) {
        console.warn("[useAutoSubmitQuiz] failed, will retry on next mount", err);
      } finally {
        running.current = false;
      }
    })();
  }, [isSignedIn]);
};

export default useAutoSubmitQuiz;