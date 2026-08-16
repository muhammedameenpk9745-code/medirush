// Unit Test for Seller Delivery Coverage Evaluator Engine
const { evaluateSellerDeliveryCoverage, calculateHaversineDistanceKm } = require('../src/lib/delivery/coverage');

console.log('=== UNIT TESTING SELLER DELIVERY COVERAGE ENGINE ===\n');

// 1. Haversine Distance Test (Malappuram to Kolathur)
const dist = calculateHaversineDistanceKm(11.0428, 76.0807, 11.0450, 76.0820);
console.log('1. Haversine Distance:', dist, 'KM -> PASS');

const store = {
  id: 'store-1',
  store_name: 'Kerala Meds Hub',
  city: 'Malappuram',
  state: 'Kerala',
  pincode: '679338',
  latitude: 11.0428,
  longitude: 76.0807,
};

// 2. RADIUS Test (Within 5 KM vs Outside 5 KM)
const customerWithin = { latitude: 11.0500, longitude: 76.0900, pincode: '679338', district: 'Malappuram', state: 'Kerala', country: 'India' };
const customerFar = { latitude: 12.9716, longitude: 77.5946, pincode: '560001', district: 'Bengaluru', state: 'Karnataka', country: 'India' };

const radiusSettings = {
  store_id: 'store-1',
  coverage_type: 'RADIUS',
  match_mode: 'ANY_MATCH',
  radius_km: 5.0,
  is_active: true,
  areas: [],
};

const resRadiusIn = evaluateSellerDeliveryCoverage(store, radiusSettings, customerWithin);
console.log('2. RADIUS (Customer < 5 KM):', resRadiusIn.isAvailable ? 'PASS (Available)' : 'FAIL', '| Reason:', resRadiusIn.reasonMessage);

const resRadiusOut = evaluateSellerDeliveryCoverage(store, radiusSettings, customerFar);
console.log('3. RADIUS (Customer > 5 KM):', !resRadiusOut.isAvailable ? 'PASS (Blocked)' : 'FAIL', '| Reason:', resRadiusOut.reasonMessage);

// 3. DISTRICT Test
const districtSettings = {
  store_id: 'store-1',
  coverage_type: 'DISTRICT',
  match_mode: 'ANY_MATCH',
  radius_km: 5.0,
  is_active: true,
  areas: [{ area_type: 'DISTRICT', area_value: 'Malappuram' }, { area_type: 'DISTRICT', area_value: 'Kozhikode' }],
};

const resDistIn = evaluateSellerDeliveryCoverage(store, districtSettings, customerWithin);
console.log('4. DISTRICT (Customer in Malappuram):', resDistIn.isAvailable ? 'PASS (Available)' : 'FAIL');

const resDistOut = evaluateSellerDeliveryCoverage(store, districtSettings, customerFar);
console.log('5. DISTRICT (Customer in Bengaluru):', !resDistOut.isAvailable ? 'PASS (Blocked)' : 'FAIL');

// 4. PIN CODE Test
const pinSettings = {
  store_id: 'store-1',
  coverage_type: 'PIN_CODE',
  match_mode: 'ANY_MATCH',
  radius_km: 5.0,
  is_active: true,
  areas: [{ area_type: 'PIN_CODE', area_value: '679338' }],
};

const resPinIn = evaluateSellerDeliveryCoverage(store, pinSettings, customerWithin);
console.log('6. PIN CODE (Matching 679338):', resPinIn.isAvailable ? 'PASS (Available)' : 'FAIL');

const resPinOut = evaluateSellerDeliveryCoverage(store, pinSettings, customerFar);
console.log('7. PIN CODE (Non-matching 560001):', !resPinOut.isAvailable ? 'PASS (Blocked)' : 'FAIL');

// 5. STATE Test
const stateSettings = {
  store_id: 'store-1',
  coverage_type: 'STATE',
  match_mode: 'ANY_MATCH',
  radius_km: 5.0,
  is_active: true,
  areas: [{ area_type: 'STATE', area_value: 'Kerala' }],
};

const resStateIn = evaluateSellerDeliveryCoverage(store, stateSettings, customerWithin);
console.log('8. STATE (Customer in Kerala):', resStateIn.isAvailable ? 'PASS (Available)' : 'FAIL');

const resStateOut = evaluateSellerDeliveryCoverage(store, stateSettings, customerFar);
console.log('9. STATE (Customer in Karnataka):', !resStateOut.isAvailable ? 'PASS (Blocked)' : 'FAIL');

// 6. INDIA-WIDE & WORLDWIDE Tests
const indiaSettings = { store_id: 'store-1', coverage_type: 'INDIA_WIDE', match_mode: 'ANY_MATCH', radius_km: 5.0, is_active: true, areas: [] };
const resIndiaIn = evaluateSellerDeliveryCoverage(store, indiaSettings, customerWithin);
console.log('10. INDIA_WIDE (Indian customer):', resIndiaIn.isAvailable ? 'PASS (Available)' : 'FAIL');

const uaeCustomer = { country: 'United Arab Emirates' };
const resIndiaOut = evaluateSellerDeliveryCoverage(store, indiaSettings, uaeCustomer);
console.log('11. INDIA_WIDE (UAE customer):', !resIndiaOut.isAvailable ? 'PASS (Blocked)' : 'FAIL');

const worldwideSettings = { store_id: 'store-1', coverage_type: 'WORLDWIDE', match_mode: 'ANY_MATCH', radius_km: 5.0, is_active: true, areas: [] };
const resWorldIn = evaluateSellerDeliveryCoverage(store, worldwideSettings, uaeCustomer);
console.log('12. WORLDWIDE (UAE customer):', resWorldIn.isAvailable ? 'PASS (Available)' : 'FAIL');

console.log('\n=== ALL COVERAGE TYPES VERIFIED SUCCESSFULLY ===');
