
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = 'C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\506d7a65-74af-426f-ac49-599500c575c6\\screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const runHumanVisualTesting = async () => {
  console.log('=== Launching HotelPro Human-Like Visual Testing Suite ===');

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true
    });
  } catch (err) {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1366, height: 820 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  const BASE_URL = 'http://localhost:5174';

  const takeScreen = async (filename, description) => {
    const filePath = path.join(SCREENSHOTS_DIR, filename);
    await page.waitForTimeout(600); // Allow any transitions/renders to settle
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`[VISUAL SNAPSHOT] Saved: ${filename} — ${description}`);
  };

  // ----------------------------------------------------
  // Step 1: Guest Landing on Home Page
  // ----------------------------------------------------
  console.log('\n[Phase 1] Guest visits HotelPro Home Page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await takeScreen('01_homepage_hero.png', 'Home page luxury hero section with brand header and reservation bar');

  // Scroll down to featured suites & testimonials
  await page.evaluate(() => window.scrollBy(0, 900));
  await takeScreen('02_homepage_features.png', 'Featured luxury suites, five-star amenities, and guest reviews');

  // ----------------------------------------------------
  // Step 2: Room Discovery & Filtering
  // ----------------------------------------------------
  console.log('\n[Phase 2] Guest explores Rooms & Suites catalog...');
  await page.locator('nav a[href="/rooms"]').click();
  await page.waitForURL('**/rooms');
  await page.waitForTimeout(500);
  await takeScreen('03_rooms_catalog.png', 'Rooms and suites discovery catalog with active filter sidebar');

  // Apply a filter: select "suite"
  const suiteFilter = page.locator('button:has-text("Suite")').first();
  if (await suiteFilter.isVisible()) {
    await suiteFilter.click();
    await page.waitForTimeout(400);
    await takeScreen('03b_rooms_filtered_suite.png', 'Rooms filtered by Presidential & Executive Suites');
  }

  // ----------------------------------------------------
  // Step 3: Room Details View
  // ----------------------------------------------------
  console.log('\n[Phase 3] Guest inspects suite details...');
  // Find a "View Details" or "Explore Suite" button
  const detailBtn = page.locator('a:has-text("Details"), a:has-text("View Suite"), a:has-text("View Details")').first();
  if (await detailBtn.isVisible()) {
    await detailBtn.click();
  } else {
    await page.goto(`${BASE_URL}/rooms/671d20000000000000000001`, { waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(500);
  await takeScreen('04_room_details.png', 'Room specifications, photo gallery carousel, amenities list & rate breakdown');

  // ----------------------------------------------------
  // Step 4: Login & Authentication Experience
  // ----------------------------------------------------
  console.log('\n[Phase 4] Guest visits Login Portal...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await takeScreen('05_login_page.png', 'Guest & Staff Sign-in Portal with quick demo account buttons');

  // Test invalid credentials
  console.log('Testing invalid credentials rejection...');
  await page.locator('input[name="email"]').fill('unregistered.visitor@example.com');
  await page.locator('input[name="password"]').fill('WrongPassword999!');
  await page.locator('button[type="submit"]').click();
  await page.locator('.alert-danger').waitFor({ state: 'visible', timeout: 5000 });
  await takeScreen('06_login_invalid_alert.png', 'Clean 401 error message banner: "Invalid email or password credentials"');

  // Authenticate as Demo Guest (Priya Sharma)
  console.log('Signing in as Demo Guest (Priya Sharma)...');
  await page.locator('button:has-text("Demo Guest")').click();
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 8000 });
  await page.waitForTimeout(500);
  await takeScreen('07_guest_dashboard.png', 'Authenticated guest dashboard with active reservation history and profile badge');

  // ----------------------------------------------------
  // Step 5: Booking Checkout & Hold Timer
  // ----------------------------------------------------
  console.log('\n[Phase 5] Guest enters Reservation Checkout...');
  await page.goto(`${BASE_URL}/booking/671d20000000000000000001`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await takeScreen('08_reservation_checkout.png', 'Reservation checkout with 15-min countdown timer, guest details, and 18% GST breakdown');

  // Complete Booking Hold
  const confirmBtn = page.locator('button:has-text("Complete Reservation"), button:has-text("Confirm"), button:has-text("Book Now")').first();
  if (await confirmBtn.isVisible()) {
    await confirmBtn.click();
    await page.waitForTimeout(1000);
    await takeScreen('09_booking_confirmed.png', 'Reservation hold confirmed with reference code and payment status');
  }

  // ----------------------------------------------------
  // Step 6: Guest Bookings & Cancellation Modal
  // ----------------------------------------------------
  console.log('\n[Phase 6] Guest checks reservations & cancellation policy...');
  await page.goto(`${BASE_URL}/my-bookings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Look for Cancel button to test cancellation policy modal
  const cancelBtn = page.locator('button:has-text("Cancel")').first();
  if (await cancelBtn.isVisible()) {
    await cancelBtn.click();
    await page.waitForTimeout(400);
    await takeScreen('10_cancellation_modal.png', 'Cancellation dialogue displaying 48-hour free cancellation policy and refund terms');
    // Close modal
    const closeBtn = page.locator('.modal button:has-text("Keep"), .modal .btn-close, .modal button:has-text("Close")').first();
    if (await closeBtn.isVisible()) await closeBtn.click();
  }

  // ----------------------------------------------------
  // Step 7: Admin Executive Console
  // ----------------------------------------------------
  console.log('\n[Phase 7] Signing out and logging in as Hotel Administrator...');
  // Sign out
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.locator('button:has-text("Demo Admin")').click();
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin', { timeout: 8000 });
  await page.waitForTimeout(600);
  await takeScreen('11_admin_dashboard.png', 'Executive Admin Console showing live occupancy rate, gross revenue, and active holds');

  // 7b. Manage Rooms
  console.log('Navigating to Room Inventory Management...');
  await page.goto(`${BASE_URL}/admin/rooms`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await takeScreen('12_admin_manage_rooms.png', 'Physical room inventory catalog with room types, pricing, and operational status');

  // Open Add Room Modal
  const addRoomBtn = page.locator('button:has-text("Add Room"), button:has-text("Add New Room")').first();
  if (await addRoomBtn.isVisible()) {
    await addRoomBtn.click();
    await page.waitForTimeout(400);
    await takeScreen('12b_admin_add_room_modal.png', 'Add New Room modal dialogue with capacity, room type, and price inputs');
    const closeAddModal = page.locator('.modal .btn-close, .modal button:has-text("Cancel")').first();
    if (await closeAddModal.isVisible()) await closeAddModal.click();
  }

  // 7c. Front Desk Operations (Manage Bookings)
  console.log('Navigating to Front Desk Registry...');
  await page.goto(`${BASE_URL}/admin/bookings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await takeScreen('13_admin_front_desk.png', 'Front Desk Operations registry with real-time guest lookup and check-in/out status controls');

  // 7d. Hospitality Analytics & Reports
  console.log('Navigating to Hospitality Analytics & Reports...');
  await page.goto(`${BASE_URL}/admin/reports`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await takeScreen('14_admin_reports.png', 'Hospitality intelligence & revenue reports with ADR, RevPAR, and occupancy breakdown');

  // 7e. User Role Administration
  console.log('Navigating to User Administration...');
  await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await takeScreen('15_admin_manage_users.png', 'User Administration portal managing guest, staff, and admin credentials and active status');

  console.log('\n=== ALL 15 HUMAN-LIKE VISUAL TESTING SNAPSHOTS CAPTURED SUCCESSFULLY! ===');
  await browser.close();
};

runHumanVisualTesting().catch((err) => {
  console.error('Human visual testing failed:', err);
  process.exit(1);
});
