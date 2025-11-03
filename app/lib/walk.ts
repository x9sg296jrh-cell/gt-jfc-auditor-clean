// lib/walk.ts
export async function getWalkingEta(
  origin: { lat: number; lng: number },
  targets: { id: string; lat?: number; lng?: number }[]
) {
  const out: Record<string, { minutes: number; meters: number } | null> = {};
  for (const t of targets) {
    out[t.id] = null; // no routing yet
  }
  return out;
}
