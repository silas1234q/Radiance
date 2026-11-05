import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useParams } from "react-router";
import { CircleLoader } from "react-spinners";

// ─── Config ──────────────────────────────────────────────────────────────────
// Point this at the same backend the mobile app uses (BASE_URL in the app).
const API_URL = import.meta.env.VITE_API_URL as string;
const APP_STORE_URL = "https://apps.apple.com/us/app/radiance-skin-care/id6794619381";
const BRAND = "#F06680";

// ─── Types (mirror what the app sends to POST /api/routines/share) ───────────
type SharedStep = {
  id?: string;
  name: string;
  description?: string | null;
  order?: number;
  timeOfDay?: "morning" | "evening";
  product?: {
    name: string;
    brand?: string | null;
    imageUrl?: string | null;
  } | null;
};

type SharedRoutine = {
  name: string;
  steps: SharedStep[];
};

type Section = { label: string; steps: SharedStep[] };

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Descriptions are stored as "[AM] Cleanse & refresh your skin · Daily".
function parseDescription(description?: string | null) {
  const clean = (description ?? "").replace(/^\[(AM|PM)\]\s*/, "").trim();
  const [text, frequency] = clean.split(" · ");
  return { text: text?.trim() || "", frequency: frequency?.trim() || "" };
}

function buildSections(steps: SharedStep[]): Section[] {
  const sorted = [...steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const isMorning = (s: SharedStep) =>
    s.timeOfDay === "morning" || s.description?.startsWith("[AM]");
  const isEvening = (s: SharedStep) =>
    s.timeOfDay === "evening" || s.description?.startsWith("[PM]");

  const morning = sorted.filter(isMorning);
  const evening = sorted.filter((s) => !isMorning(s) && isEvening(s));
  const other = sorted.filter((s) => !isMorning(s) && !isEvening(s));

  return [
    { label: "Morning Routine", steps: morning },
    { label: "Evening Routine", steps: evening },
    { label: "Routine", steps: other },
  ].filter((section) => section.steps.length > 0);
}

// ─── Page ────────────────────────────────────────────────────────────────────
export const Routine = () => {
  const { token } = useParams<{ token: string }>();
  const [routine, setRoutine] = useState<SharedRoutine | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "notfound" | "error"
  >("loading");

  useEffect(() => {
    if (!token) {
      setStatus("notfound");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/routines/share/${encodeURIComponent(token)}`,
          { signal: controller.signal },
        );
        if (res.status === 404) {
          setStatus("notfound");
          return;
        }
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = await res.json();
        setRoutine((data.routine ?? data) as SharedRoutine);
        setStatus("ready");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setStatus("error");
      }
    })();

    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    document.title = routine?.name
      ? `${routine.name} · Radiance`
      : "Shared routine · Radiance";
  }, [routine]);

  const sections = useMemo(
    () => (routine ? buildSections(routine.steps ?? []) : []),
    [routine],
  );

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        {status === "loading" && (
          <div className="w-full h-full flex items-center justify-center p-4">
            <CircleLoader color="#F06680" />
          </div>
        )}

        {status === "notfound" && (
          <Message
            title="Routine not found"
            body="This link may have expired or been removed."
          />
        )}

        {status === "error" && (
          <Message
            title="Something went wrong"
            body="We couldn't load this routine. Please try again in a moment."
          />
        )}

        {status === "ready" && routine && (
          <>
            <h1 style={styles.title}>{routine.name || "Skincare Routine"}</h1>
            <p style={styles.subtitle}>
              A skincare routine shared with you on Radiance.
            </p>

            {sections.length === 0 ? (
              <p style={styles.muted}>
                This routine doesn&apos;t have any steps yet.
              </p>
            ) : (
              sections.map((section) => (
                <section key={section.label} style={{ marginTop: 28 }}>
                  <h2 style={styles.sectionLabel}>{section.label}</h2>
                  <ol style={styles.list}>
                    {section.steps.map((step, i) => (
                      <StepCard
                        key={step.id ?? `${section.label}-${i}`}
                        step={step}
                        index={i}
                      />
                    ))}
                  </ol>
                </section>
              ))
            )}

            <div style={styles.cta}>
              <h3 style={styles.ctaTitle}>
                Build your own personalized routine
              </h3>
              <p style={styles.ctaBody}>
                Scan your skin and get a routine that adapts to your progress.
              </p>
              <a href={APP_STORE_URL} style={styles.ctaButton}>
                Get Radiance
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// ─── Pieces ──────────────────────────────────────────────────────────────────
function StepCard({ step, index }: { step: SharedStep; index: number }) {
  const { text, frequency } = parseDescription(step.description);
  const imageUrl = step.product?.imageUrl ?? undefined;

  return (
    <li style={styles.card}>
      <div style={styles.thumb}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={step.product?.name ?? step.name}
            style={styles.thumbImg}
            loading="lazy"
          />
        ) : (
          <span style={styles.thumbFallback}>{index + 1}</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.stepName}>{step.name}</div>
        {step.product?.name && step.product.name !== step.name && (
          <div style={styles.productName}>{step.product.name}</div>
        )}
        {text && <div style={styles.description}>{text}</div>}
        {frequency && <span style={styles.pill}>{frequency}</span>}
      </div>
    </li>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <h1 style={{ ...styles.title, fontSize: 22 }}>{title}</h1>
      <p style={styles.muted}>{body}</p>
      <a href={APP_STORE_URL} style={{ ...styles.ctaButton, marginTop: 20 }}>
        Get Radiance
      </a>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
  },
  container: { maxWidth: 560, margin: "0 auto", padding: "32px 20px 64px" },
  brand: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: BRAND,
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: -0.5, margin: 0 },
  subtitle: { fontSize: 15, color: "#6B6468", margin: "6px 0 0" },
  muted: { fontSize: 15, color: "#6B6468" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#6B6468",
    margin: "0 0 12px",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  card: {
    display: "flex",
    gap: 14,
    alignItems: "center",
    background: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(255,255,255,0.9)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    background: "#fff",
    flexShrink: 0,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "contain" },
  thumbFallback: { fontSize: 20, fontWeight: 700, color: BRAND },
  stepName: { fontSize: 16, fontWeight: 600 },
  productName: { fontSize: 13, color: "#6B6468", marginTop: 2 },
  description: { fontSize: 13, color: "#6B6468", marginTop: 4 },
  pill: {
    display: "inline-block",
    marginTop: 8,
    padding: "3px 10px",
    borderRadius: 999,
    background: "rgba(240,102,128,0.12)",
    color: BRAND,
    fontSize: 12,
    fontWeight: 600,
  },
  cta: {
    marginTop: 40,
    textAlign: "center",
    background: "#fff",
    borderRadius: 22,
    padding: "28px 20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },
  ctaTitle: { fontSize: 18, fontWeight: 700, margin: 0 },
  ctaBody: { fontSize: 14, color: "#6B6468", margin: "8px 0 18px" },
  ctaButton: {
    display: "inline-block",
    background: BRAND,
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 15,
    padding: "13px 28px",
    borderRadius: 999,
  },
};
