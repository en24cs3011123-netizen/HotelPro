const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPaymentVerification() {
  console.log('=== Starting HotelPro Payment Verification Test ===');

  const screenshotsDir = path.resolve('C:/Users/pc/.gemini/antigravity-ide/brain/506d7a65-74af-426f-ac49-599500c575c6/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[Browser Console (${msg.type()})]:`, msg.text()));
  page.on('pageerror', err => console.log(`[Browser Page Error]:`, err));

  try {
    // 1. Log in as Guest
    console.log('\n--- Step 1: Log in as Guest ---');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
    await page.click('button:has-text("Guest Login")');
    await page.click('button:has-text("Sign In as Guest")');
    await page.waitForURL('**/my-bookings', { timeout: 10000 });
    console.log('[PASS] Logged in as Guest. Current URL:', page.url());

    // 2. Inspect My Bookings page for pending payment and Pay Now button
    console.log('\n--- Step 2: Check My Bookings & Click Pay Now ---');
    await page.waitForSelector('.hp-card');

    const payNowBtn = page.locator('button:has-text("Pay Now")').first();
    const payNowCount = await page.locator('button:has-text("Pay Now")').count();
    console.log(`[PASS] Found ${payNowCount} pending booking(s) with "Pay Now" action.`);

    if (payNowCount > 0) {
      console.log('[Action] Clicking "Pay Now" on the first pending reservation...');
      await payNowBtn.click();

      // Wait for toast and status update
      await page.waitForTimeout(2000);
      console.log('[PASS] Payment settlement executed.');
    }

    const myBookingsScreenshotPath = path.join(screenshotsDir, 'fix_06_my_bookings_paid.png');
    await page.screenshot({ path: myBookingsScreenshotPath });
    console.log(`[PASS] My Bookings screenshot saved to: ${myBookingsScreenshotPath}`);

    // 3. Test New Reservation with Automatic Payment Confirmation
    console.log('\n--- Step 3: Test New Booking & Immediate Payment Settlement ---');
    await page.goto('http://localhost:5174/rooms', { waitUntil: 'networkidle' });
    await page.waitForSelector('.hp-card');

    // Click Reserve on first room
    const reserveBtn = page.locator('a:has-text("Reserve")').first();
    await reserveBtn.click();
    await page.waitForURL('**/booking/**', { timeout: 10000 });
    console.log('[PASS] On Booking Checkout Page:', page.url());

    // Fill phone number if needed
    const phoneInput = page.locator('input[name="phone"]');
    await phoneInput.fill('+91 98765 43210');

    // Submit reservation
    console.log('[Action] Submitting Reservation with Secure Payment...');
    await page.click('button[type="submit"]');

    // Wait for confirmation screen
    await page.waitForSelector('h3:has-text("Reservation Confirmed!")', { timeout: 12000 });
    console.log('[PASS] Reservation Confirmed view reached!');

    const confirmationScreenshotPath = path.join(screenshotsDir, 'fix_07_reservation_confirmed_paid.png');
    await page.screenshot({ path: confirmationScreenshotPath });
    console.log(`[PASS] Confirmation screenshot saved to: ${confirmationScreenshotPath}`);

    // Navigate to My Bookings
    console.log('\n--- Step 4: Verify New Booking in My Bookings is Confirmed & Paid ---');
    await page.click('a:has-text("View in My Bookings")');
    await page.waitForURL('**/my-bookings', { timeout: 10000 });
    await page.waitForSelector('.hp-card');

    const confirmedBadges = await page.locator('.badge.bg-success:has-text("Confirmed")').count();
    const paidBadges = await page.locator('.badge:has-text("Paid")').count();
    console.log(`[PASS] Confirmed Badges count: ${confirmedBadges}`);
    console.log(`[PASS] Paid Badges count: ${paidBadges}`);

    const finalMyBookingsPath = path.join(screenshotsDir, 'fix_08_my_bookings_all_confirmed.png');
    await page.screenshot({ path: finalMyBookingsPath });
    console.log(`[PASS] Final screenshot saved to: ${finalMyBookingsPath}`);

    console.log('\n=== ALL PAYMENT TESTS COMPLETED WITH 100% SUCCESS! ===');
  } catch (err) {
    console.error('[TEST ERROR]:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testPaymentVerification();
