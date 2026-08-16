import { calculateHaversineDistanceKm } from './coverage';

export interface RouteResult {
  routePoints: [number, number][]; // [lat, lng] array for Leaflet polyline
  distanceKm: number;
  etaMins: number;
  isFallback?: boolean;
}

/**
 * Fetch turn-by-turn driving route and ETA using OSRM (Open Source Routing Machine)
 */
export async function fetchOSRMRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): Promise<RouteResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const rawCoords: [number, number][] = route.geometry?.coordinates || [];

        // OSRM returns [lng, lat] -> convert to Leaflet [lat, lng]
        const routePoints: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

        const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
        const etaMins = Math.max(1, Math.round(route.duration / 60));

        return {
          routePoints: routePoints.length > 0 ? routePoints : [[startLat, startLng], [destLat, destLng]],
          distanceKm,
          etaMins,
        };
      }
    }
  } catch {
    clearTimeout(timeoutId);
  }

  // Fallback to Haversine straight line if OSRM is offline or timed out
  const haversineDist = calculateHaversineDistanceKm(startLat, startLng, destLat, destLng);
  // Estimate ETA assuming average city speed of 25 km/h
  const estimatedEta = Math.max(2, Math.round((haversineDist / 25) * 60));

  return {
    routePoints: [
      [startLat, startLng],
      [destLat, destLng],
    ],
    distanceKm: haversineDist,
    etaMins: estimatedEta,
    isFallback: true,
  };
}

/**
 * Format stale location time indicator
 */
export function formatStaleTime(updatedAtStr?: string): { text: string; isStale: boolean } {
  if (!updatedAtStr) return { text: 'Live location pending', isStale: false };

  const updatedMs = new Date(updatedAtStr).getTime();
  const nowMs = Date.now();
  const diffSec = Math.max(0, Math.floor((nowMs - updatedMs) / 1000));

  if (diffSec < 10) return { text: 'Updated just now', isStale: false };
  if (diffSec < 45) return { text: `Updated ${diffSec}s ago`, isStale: false };
  if (diffSec < 120) return { text: `Updated ${Math.floor(diffSec / 60)}m ago (Stale location)`, isStale: true };

  return { text: 'Live location temporarily offline', isStale: true };
}
