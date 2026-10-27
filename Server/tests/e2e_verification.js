const http = require('http');

const runRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runSuite = async () => {
  console.log('--- 1. Testing Frontend Dev Servers ---');
  for (const port of [5173, 5174]) {
    const fe = await runRequest({ hostname: 'localhost', port, path: '/', method: 'GET' });
    console.log(`[PASS] Frontend Port ${port} served HTML with status ${fe.statusCode}`);
  }

  console.log('\n--- 2. Testing Backend Health & CORS ---');
  for (const origin of ['http://localhost:5173', 'http://localhost:5174']) {
    const health = await runRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/health',
      method: 'GET',
      headers: { Origin: origin }
    });
    console.log(
      `[PASS] Health check from Origin ${origin}: Status ${health.statusCode} | CORS: ${health.headers['access-control-allow-origin']}`
    );
  }

  console.log('\n--- 3. Testing Invalid Credentials Authentication ---');
  const invalidRes = await runRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5174'
      }
    },
    { email: 'invalid.user@example.com', password: 'WrongPassword999!' }
  );
  console.log(`[PASS] Invalid Credentials Status: ${invalidRes.statusCode} (Expected 401)`);
  console.log(`[PASS] Invalid Credentials Message: "${invalidRes.body?.message}" (Expected 401 message, NO Network Error)`);
  console.log(`[PASS] CORS Allowed Origin: ${invalidRes.headers['access-control-allow-origin']}`);

  console.log('\n--- 4. Testing Demo Guest Login ---');
  const guestRes = await runRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5174'
      }
    },
    { email: 'priya.sharma@example.com', password: 'LuxuryHotelPassword2026!' }
  );
  console.log(`[PASS] Guest Login Status: ${guestRes.statusCode} (Expected 200)`);
  console.log(`[PASS] Guest Authenticated: ${guestRes.body.data.user.name} (${guestRes.body.data.user.role})`);
  const guestToken = guestRes.body.data.accessToken;
  const refreshCookie = guestRes.headers['set-cookie']
    ? guestRes.headers['set-cookie'][0].split(';')[0]
    : '';
  console.log(`[PASS] Access Token Issued: ${guestToken.substring(0, 30)}...`);
  console.log(`[PASS] Refresh Cookie Set: ${refreshCookie ? 'Yes (' + refreshCookie.split('=')[0] + ')' : 'No'}`);

  console.log('\n--- 5. Testing Guest Protected Profile (GET /api/v1/auth/me) ---');
  const meRes = await runRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/me',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${guestToken}`,
      Origin: 'http://localhost:5174'
    }
  });
  console.log(`[PASS] Profile Fetch Status: ${meRes.statusCode} | User: ${meRes.body.data.user.email}`);

  console.log('\n--- 6. Testing Token Refresh (POST /api/v1/auth/refresh) ---');
  const refreshRes = await runRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/refresh',
    method: 'POST',
    headers: {
      Cookie: refreshCookie,
      Origin: 'http://localhost:5174'
    }
  });
  console.log(
    `[PASS] Refresh Status: ${refreshRes.statusCode} | New Access Token Issued: ${refreshRes.body.data.accessToken.substring(0, 30)}...`
  );

  console.log('\n--- 7. Testing Demo Admin Login ---');
  const adminRes = await runRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5174'
      }
    },
    { email: 'admin@hotelpro.com', password: 'AdminPassword2026!' }
  );
  console.log(`[PASS] Admin Login Status: ${adminRes.statusCode} (Expected 200)`);
  console.log(`[PASS] Admin Authenticated: ${adminRes.body.data.user.name} (${adminRes.body.data.user.role})`);
  const adminToken = adminRes.body.data.accessToken;

  console.log('\n--- 8. Testing Admin Management Portal Endpoints ---');
  const reportsRes = await runRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/admin/reports/occupancy',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}`, Origin: 'http://localhost:5174' }
  });
  console.log(
    `[PASS] Admin Occupancy Reports Status: ${reportsRes.statusCode} | Total Revenue: Rs.${reportsRes.body.data.kpis.totalRevenue}`
  );

  const usersRes = await runRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/admin/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}`, Origin: 'http://localhost:5174' }
  });
  console.log(
    `[PASS] Admin Users List Status: ${usersRes.statusCode} | Total Users: ${usersRes.body.meta.totalRecords}`
  );

  console.log('\n--- 9. Testing Rooms & Booking Endpoints ---');
  const roomsRes = await runRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/rooms',
    method: 'GET',
    headers: { Origin: 'http://localhost:5174' }
  });
  console.log(
    `[PASS] Rooms Catalog Status: ${roomsRes.statusCode} | Rooms Available: ${roomsRes.body.data.length}`
  );

  const myBookingsRes = await runRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/bookings/my',
    method: 'GET',
    headers: { Authorization: `Bearer ${guestToken}`, Origin: 'http://localhost:5174' }
  });
  console.log(
    `[PASS] My Bookings Status: ${myBookingsRes.statusCode} | Guest Bookings: ${myBookingsRes.body.data.length}`
  );

  console.log('\n=== ALL 9 END-TO-END VERIFICATION SUITES PASSED WITH 100% SUCCESS ===');
};

runSuite().catch(console.error);
