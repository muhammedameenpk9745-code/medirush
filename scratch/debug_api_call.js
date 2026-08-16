const http = require('http');

const postData = JSON.stringify({
  fullName: 'Test Owner',
  storeName: 'Test Pharmacy',
  email: 'testpharmacy123@gmail.com',
  phone: '9876543210',
  address: 'Valanchery Main Road',
  city: 'Malappuram',
  state: 'Kerala',
  pincode: '676552',
  medicalLicenseNumber: 'KL-123456',
  gstNumber: '32AAAAA0000A1Z5',
  password: 'Password@123',
  role: 'SELLER',
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  },
  (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('RESPONSE DATA:', data);
    });
  }
);

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
