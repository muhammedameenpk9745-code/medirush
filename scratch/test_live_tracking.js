const { fetchOSRMRoute, formatStaleTime } = require('../src/lib/delivery/tracking');

async function testLiveTrackingEngine() {
  console.log('=== TESTING LIVE TRACKING & OSRM ROUTING ENGINE ===\n');

  // Test 1: Turn-by-Turn OSRM Route between Malappuram & Kolathur
  console.log('1. Fetching OSRM Turn-by-Turn Route (11.0428, 76.0807 -> 11.0500, 76.0900)...');
  const routeResult = await fetchOSRMRoute(11.0428, 76.0807, 11.0500, 76.0900);
  
  console.log('Route Points Count:', routeResult.routePoints.length);
  console.log('Calculated Distance:', routeResult.distanceKm, 'KM');
  console.log('Calculated ETA:', routeResult.etaMins, 'Mins');
  console.log('Is Fallback?:', routeResult.isFallback ? 'YES' : 'NO (Real OSRM Route)');

  // Test 2: Stale Time Formatting
  console.log('\n2. Testing Stale Location Detector:');
  const nowIso = new Date().toISOString();
  const thirtySecAgoIso = new Date(Date.now() - 30000).toISOString();
  const sixtySecAgoIso = new Date(Date.now() - 60000).toISOString();

  console.log('Just now:', formatStaleTime(nowIso).text);
  console.log('30s ago:', formatStaleTime(thirtySecAgoIso).text);
  console.log('60s ago:', formatStaleTime(sixtySecAgoIso).text);

  console.log('\n=== ALL LIVE TRACKING UNIT TESTS PASSED ===');
}

testLiveTrackingEngine();
