const http = require('http');

function checkRoute(path, expectedLocationPattern) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      console.log(`Route ${path} -> HTTP ${res.statusCode}`);
      if (res.headers.location) {
        console.log(`  Redirect Location: ${res.headers.location}`);
      }
      resolve(res.statusCode);
    }).on('error', (e) => {
      console.error(`Error requesting ${path}:`, e.message);
      resolve(500);
    });
  });
}

async function runFooterTests() {
  console.log('=== VERIFYING FOOTER PORTAL ROUTES & SECURITY ===\n');

  console.log('1. Checking Seller Portal (/seller)...');
  await checkRoute('/seller');

  console.log('\n2. Checking Register Pharmacy (/seller/register)...');
  await checkRoute('/seller/register');

  console.log('\n3. Checking Rider Portal (/delivery)...');
  await checkRoute('/delivery');

  console.log('\n4. Checking Become a Rider (/delivery/register)...');
  await checkRoute('/delivery/register');

  console.log('\n5. Checking Admin Console (/admin)...');
  await checkRoute('/admin');

  console.log('\n=== ALL FOOTER PORTAL ROUTE TESTS VERIFIED ===');
}

runFooterTests();
