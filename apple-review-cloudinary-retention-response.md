# App Review reply — Guideline 2.1, Cloudinary retention

Submission ID: d9af759a-9989-45ae-9bb8-461cdb2b3afd · Version 1.0 (21)

Apple asked one question: **"How long does Cloudinary store the user's image and why?"**

## Reply text

**How long does Cloudinary store the user's image, and why?**

Cloudinary is our image storage processor. It stores an image only for as long as we instruct it to — we set no automatic expiry, and Cloudinary never deletes or retains anything on its own initiative. Deletion is always driven by our backend calling Cloudinary's delete API. Concretely:

**1. Face-scan photos — retained while the account exists, capped at two images per user.**

We keep exactly two face-scan photos per user:

- the **baseline** photo (the user's first scan), and
- the **most recent** scan.

When a user takes a new scan, the newly superseded photo is deleted from Cloudinary in the same request that saves the new one — typically within a second of the new scan completing. It is never left behind. A user who scans fifty times still has only two images in storage.

*Why we keep them for the life of the account:* both photos are what the app's core progress feature displays. The "Skin Comparison" screen shows the user their baseline photo side by side with their latest scan so they can see how their skin has changed since starting. That comparison is the reason people use the app over time, and it cannot work if the baseline photo is discarded after a fixed window — deleting it would silently destroy the user's own "before" image and the progress history they came back for. We therefore tie retention to the account rather than to a timer, and give the user direct control over deletion instead (below).

*Why the image is stored at all rather than processed in memory:* the skin-analysis provider (Perfect Corp / YouCam) is an asynchronous, URL-based API. We submit the image's storage URL, the provider fetches it, and we poll for the result. The image must therefore be retrievable at a URL for the duration of the analysis. Storing it also lets the app display the user's own scan back to them in the results and progress screens without re-uploading.

**2. Optional progress photos and profile avatar — retained while the account exists.**

Separately from the face scan, a user may optionally attach a photo to a daily skin log, and may optionally set a profile avatar. These are user-initiated, never automatic. They are stored on the same terms: kept while the account exists, so the user can view their own progress timeline, and deleted with the account.

**3. Deletion.**

Deleting the account from Profile → Delete Account permanently removes **every** stored image for that user from Cloudinary — baseline scan, latest scan, all skin-log photos, and the avatar — in the same request that deletes the account. Nothing is retained after account deletion, and we keep no separate archive or backup copy of user images. Users can also email sarfosilas2003@gmail.com at any time to request deletion of their face data without deleting the account.

No image data is stored in our own application database at any point — we store only a reference URL. Face photos are never used for advertising, never used to train AI models, never shared with other users, and never sold.

---

## Before you send this

1. **Confirm Render has commit `1a05001` deployed.** Every retention and deletion behaviour described above is backend code (`uploadService.ts`, `skinProfileController.ts`, `userController.ts`) running on Render — it is *not* in the iOS binary, so whether build 21 contains it is irrelevant. What matters is only that production is running that commit at the moment you reply. If Render is behind, deploy first, then send.
2. **The privacy policy must match this reply.** The published Section 3 currently says "no more than two images are held at any time." That is true of face scans only — skin-log photos and the avatar are additional. Update the policy to cover them before sending, or Apple can check the app, see a third image path, and read the discrepancy as a misstatement.
3. **Confirm `YOUCAM_USE_MOCK=false` on Render.** The reply names Perfect Corp as a recipient. If YouCam is not actually live, remove that mention from the reply and the policy.

## Two things worth fixing in code

Neither is what Apple asked about, but both weaken the answers above if reviewers probe.

**Cloudinary assets are publicly readable by URL.** `uploadService.ts:5-8` uploads with the default `type: 'upload'`, so any face photo is fetchable by anyone who has the URL, with no authentication. This is currently *required* by the architecture — `youCamService.ts:140` hands Perfect Corp `src_file_url` and the provider fetches it directly, which only works on a public URL. The fix is authenticated/private delivery plus a short-lived signed URL generated just for the YouCam call, so the image stops being permanently world-readable.

**`destroy` is called without `invalidate: true`** (`uploadService.ts:74`). The asset is removed from storage, but CDN-cached copies can keep being served at the old URL for a period after deletion. The reply above says superseded photos are deleted within a second; adding `invalidate: true` is a one-line change that makes that exactly true at the edge too.

Say the word and I'll implement both.

## Where each claim is implemented

| Claim | Code |
|---|---|
| No expiry set; Cloudinary deletes only when we call it | `backend/src/services/uploadService.ts:3-19` — upload options carry no `expires_at`/TTL |
| At most two face-scan photos per user | `backend/src/controllers/skinProfileController.ts:143-176` — baseline pinned, superseded photo destroyed |
| Superseded photo deleted in the same request | `skinProfileController.ts:169-176` → `deleteFromCloudinary` |
| Baseline + latest drive the comparison screen | `frontend/src/app/(screens)/skin-comparison-modal.tsx:366-367`; `frontend/src/app/(tabs)/progress.tsx:472-478` |
| Provider fetches the image from its URL | `backend/src/services/youCamService.ts:132-140` (`src_file_url`), polled at `:183` |
| Optional skin-log photo, user-initiated | `frontend/src/app/(screens)/skin-log-modal.tsx:514-530, 796` |
| Optional avatar, user-initiated | `frontend/src/app/(tabs)/profile.tsx:140-160` |
| Account deletion removes every image | `backend/src/controllers/userController.ts:109-149` — profile photo, baseline, all skin-log photos, avatar |
| No image bytes in our DB, only URLs | `backend/prisma/schema.prisma:21, 71-72, 140` — all `String?` URL fields |
