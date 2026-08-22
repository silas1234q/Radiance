# App Review reply — Guideline 2.1, face data

Paste the block below into App Store Connect → Resolution Center.

**Before sending:**

1. Deploy the updated `web/` build so `https://radianceskin.fit/privacy#face-data` is live — App Review will open it, and the quoted text must already be published.
2. Confirm the domain is `radianceskin.fit` and that App Store Connect's *Privacy Policy URL* field points at `/privacy`.
3. Confirm `YOUCAM_USE_MOCK=false` on Render. If YouCam is *not* actually live, delete every mention of Perfect Corp from the reply **and** from both policy copies — the disclosure must match reality in either direction.
4. Ship a build containing the Phase 1 changes (device-side photo deletion, Cloudinary deletion, no EXIF, no microphone permission). Several answers below describe behaviour that only exists in that build.
5. Check the Privacy nutrition label: photo/sensitive data declared as collected, linked to the user, used for App Functionality, **not** used for tracking.

---

## Reply text

**What face data does the app collect?**

Radiance captures a single still photograph of the user's face, and only at the moment the user taps the capture button. There is no video recording and no background camera access. The face scan is entirely optional — users who skip it receive an analysis based on their quiz answers alone.

Before the photo is accepted, we run Google's on-device ML Kit **Face Detection** API to check the photo shows one well-lit, centred, front-facing face. It returns only a bounding box, three head-pose angles, and two eye-open probabilities. These are used solely for a pass/fail quality check; they are never stored and never transmitted off the device.

Radiance does not use face recognition and does not generate a faceprint, face template, face embedding, or any other biometric identifier. Face data is never used to identify, recognise, or authenticate anyone.

**Please provide a complete explanation of all planned use, sharing, retention, deletion, and storage practices for the collected face data.**

*Use.* The photo is used only to compute the user's own skin metrics (hydration, texture, pores, redness and similar) and to display a personal before-and-after progress comparison. It is never used for advertising, never used to train AI models, never shared with other users, and never sold.

*Storage.* The photo is transmitted over TLS to our authenticated backend endpoint and stored by Cloudinary, our image storage provider. No image data is stored in our application database — we store only a reference URL. The photo is never saved to the device's photo library, and the temporary capture file is deleted from the device as soon as the upload succeeds.

*Timing.* The photo is not uploaded when it is taken. It is uploaded only if the user proceeds with the analysis. If the user declines, the photo never leaves the device.

*Sharing, retention and deletion* are covered in the answers below.

**Will the face data be shared with any third parties? Where will this information be stored?**

The photo is shared with exactly two processors, both acting on our instructions under contract:

- **Cloudinary** — image storage and delivery.
- **Perfect Corp (YouCam Skin Analysis API)** — receives the photo for the sole purpose of computing the numeric skin metrics, which it returns to us.

No other party receives the image. In particular, the face photo is never sent to OpenAI: our AI recommendation step receives only the resulting numeric scores and the user's quiz answers as text. No face data is sent to our analytics provider (PostHog) or to our subscription provider (RevenueCat) — analytics events for the scan flow carry only booleans and fixed status strings, never an image or an image reference. Face data is never sold and never shared for advertising or tracking.

**How long will face data be retained?**

We retain the user's first scan (their "before" photo) and their most recent scan. When a newer scan replaces an older one, the superseded photo is deleted automatically, so no more than two images are held at any time. Both are retained only for as long as the account exists.

Deleting the account from the Profile screen inside the app permanently removes the photos from our database **and from Cloudinary storage**. Users may also email us at sarfosilas2003@gmail.com at any time to request deletion of their face data.

**Where in the privacy policy is the app's collection, use, disclosure, sharing, and retention of face data explained?**

Section 3, titled **"Face Data"**, of the Radiance Privacy Policy. The processors that receive face data are also named in Section 4, "Third-Party Services", and account-level deletion is covered in Section 6, "Data Retention & Deletion".

Direct link: https://radianceskin.fit/privacy#face-data

The identical text is shown inside the app under Profile → Legal → Privacy Policy, and is reachable from the sign-in screen before an account is created.

**Please quote the specific text from the privacy policy concerning face data.**

Quoted verbatim from Section 3, "Face Data":

> What we collect: if you choose to do a face scan, Radiance captures a single still photograph of your face, taken only at the moment you tap the capture button. We do not record video and we do not access your camera in the background. The face scan is optional — if you skip it, Radiance analyses your quiz answers alone.
>
> On-device quality check: before a photo is accepted, an on-device face detector confirms it shows one well-lit, centred, front-facing face. It measures only where your face sits in the frame, the angle of your head, and whether your eyes are open. These measurements never leave your device and are discarded immediately. Radiance does not create a faceprint, face template, face embedding, or any other biometric identifier, and never uses face data to identify, recognise, or authenticate you.
>
> How we use it: your photo is used solely to generate your own skin metrics and score, and to show you a before-and-after comparison of your own progress. We never use face data for advertising, never use it to train AI models, never share it with other users, and never sell it.
>
> Where it is stored and who receives it: the photo is sent over an encrypted connection to our authenticated backend and stored by Cloudinary, our image storage provider. It is then sent to Perfect Corp (the YouCam Skin Analysis API) for the sole purpose of computing your skin metrics, which are returned to us as numbers. Both act as processors on our instructions. No one else receives the image — in particular, your photo is never sent to OpenAI, which receives only the resulting numeric scores and your quiz answers as text. No face data is sent to our analytics or subscription providers. The photo is never saved to your device's photo library, and the temporary capture file is deleted from your device once the upload completes.
>
> How long we keep it: we retain your first scan (your "before" photo) and your most recent scan. When a newer scan replaces an older one, the superseded photo is deleted automatically. Both are kept only for as long as your account exists.
>
> Deleting it: deleting your account from the Profile screen permanently removes your photos from our database and from Cloudinary storage. You can also email sarfosilas2003@gmail.com at any time to request deletion of your face data.

Additionally, from Section 4, "Third-Party Services":

> We use the following third-party services: Clerk for authentication, Cloudinary for secure photo storage, Perfect Corp (YouCam) for face-scan skin analysis, OpenAI for AI-powered recommendations, RevenueCat for subscription management, Expo for push notifications, and PostHog for product analytics. Each service processes data in accordance with their own privacy policies. Of these, only Cloudinary and Perfect Corp ever receive your face photo — see the Face Data section above.

---

## Where each claim is implemented

Kept so the reply stays verifiable if review asks follow-ups.

| Claim in the reply | Code |
|---|---|
| Single still photo, capture-button only | `frontend/src/app/(onboarding)/face-scan.tsx` — `takePictureAsync`; no frame stream, no `recordAsync` anywhere |
| On-device detection, no biometric identifier | `@infinitered/react-native-mlkit-face-detection@5.0.0` → `GoogleMLKit/FaceDetection`; fields read in `frontend/src/lib/faceValidation.ts` |
| Detector values discarded | `face-scan.tsx` — result feeds a pass/fail boolean; `validation.face` is never read |
| No EXIF transmitted | `face-scan.tsx` — `exif` no longer requested |
| Photo never leaves device unless user proceeds | `frontend/src/app/(onboarding)/results.tsx` `runAnalysisAndUnlock` is the only caller of `uploadSkinPhoto` |
| Device copy deleted after upload | `frontend/src/api/uploadPhoto.ts` — `FileSystem.deleteAsync` on success |
| TLS to authenticated endpoint; no image bytes in DB | `backend/src/routes/uploadRoutes.ts` (`requireAuth` + `syncUser`); only URL strings on `SkinProfile` / `SkinLog` |
| Only Cloudinary + Perfect Corp receive the image | `backend/src/services/uploadService.ts`; `backend/src/services/youCamService.ts` |
| Never sent to OpenAI | `backend/src/services/skinAnalysisService.ts` passes numeric `scanData` only; no `image_url` part in `openAIService.analyzeWithAI` |
| No face data to PostHog/RevenueCat | `frontend/src/lib/analytics/events.ts`; session replay not enabled |
| At most two photos retained | `backend/src/controllers/skinProfileController.ts` — superseded non-baseline photo deleted after upsert |
| Account deletion removes photos from Cloudinary | `backend/src/controllers/userController.ts` `deleteMe` → `deleteFromCloudinary` |
