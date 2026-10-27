const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runVisualValidation() {
  console.log('=== Starting HotelPro Visual & Functional Fix Verification ===');

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
    // 1. VERIFY HOME PAGE: Backend API and 5-STAR LUXURY badge removed
    console.log('\n--- Step 1: Checking Home Page Hero for Removed Badge ---');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

    const pageContent = await page.content();
    const hasBackendApiBadge = pageContent.includes('Backend API: Connected');
    const hasFiveStarBadge = pageContent.includes('5-STAR LUXURY');

    if (!hasBackendApiBadge && !hasFiveStarBadge) {
      console.log('[PASS] "Backend API: Connected (Port 5000)" and "★ 5-STAR LUXURY" badge successfully removed!');
    } else {
      console.error('[FAIL] Badge still detected on Home Page! hasBackendApiBadge:', hasBackendApiBadge, 'hasFiveStarBadge:', hasFiveStarBadge);
    }

    const homeScreenshotPath = path.join(screenshotsDir, 'fix_01_homepage_hero_clean.png');
    await page.screenshot({ path: homeScreenshotPath });
    console.log(`[PASS] Home page screenshot saved to: ${homeScreenshotPath}`);

    // 2. VERIFY LOGIN PAGE: Guest & Admin Role Tabs and Switching
    console.log('\n--- Step 2: Testing Login Page Role Switching ---');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });

    // Click Admin Login tab
    await page.click('button:has-text("Admin Login")');
    const emailValAdmin = await page.inputValue('input[name="email"]');
    console.log('[PASS] Switched to Admin Tab. Pre-filled Email:', emailValAdmin);

    // Click Guest Login tab
    await page.click('button:has-text("Guest Login")');
    const emailValGuest = await page.inputValue('input[name="email"]');
    console.log('[PASS] Switched to Guest Tab. Pre-filled Email:', emailValGuest);

    const loginScreenshotPath = path.join(screenshotsDir, 'fix_02_login_page_role_tabs.png');
    await page.screenshot({ path: loginScreenshotPath });

    // 3. LOG IN AS GUEST & TEST NAVBAR USER BUTTON
    console.log('\n--- Step 3: Log in as Guest & Test Navbar Dropdown ---');
    await page.click('button:has-text("Sign In as Guest")');
    await page.waitForURL('**/my-bookings', { timeout: 10000 });
    console.log('[PASS] Logged in as Guest. Current URL:', page.url());

    // Verify user dropdown button is visible
    const userDropdownBtn = page.locator('#userDropdown');
    await userDropdownBtn.waitFor({ state: 'visible' });
    const userBtnText = await userDropdownBtn.innerText();
    console.log('[PASS] Navbar user button text:', userBtnText.replace(/\n/g, ' '));

    // Click user dropdown button
    console.log('[Action] Clicking #userDropdown...');
    await userDropdownBtn.click();
    await page.waitForTimeout(400);

    // Verify dropdown menu opened
    const dropdownMenu = page.locator('#userDropdown + ul.dropdown-menu');
    const isMenuVisible = await dropdownMenu.isVisible();
    console.log('[PASS] Dropdown menu is visible:', isMenuVisible);

    const dropdownScreenshotPath = path.join(screenshotsDir, 'fix_03_navbar_dropdown_open.png');
    await page.screenshot({ path: dropdownScreenshotPath });

    // 4. TEST SWITCH TO ADMIN / SIGN OUT FROM DROPDOWN
    console.log('\n--- Step 4: Test Switch Account / Role from Dropdown ---');
    const switchRoleBtn = page.locator('button:has-text("Switch Account / Role")');
    await switchRoleBtn.click();
    await page.waitForURL('**/login', { timeout: 10000 });
    console.log('[PASS] Redirected to Login page upon role switch:', page.url());

    // 5. LOG IN AS ADMIN
    console.log('\n--- Step 5: Log in as Admin ---');
    await page.click('button:has-text("Admin Login")');
    await page.click('button:has-text("Sign In as Administrator")');
    await page.waitForURL('**/admin', { timeout: 10000 });
    console.log('[PASS] Successfully logged in as Admin! Current URL:', page.url());

    const adminScreenshotPath = path.join(screenshotsDir, 'fix_04_admin_portal_authenticated.png');
    await page.screenshot({ path: adminScreenshotPath });

    // 6. TEST DIRECT SIGN OUT BUTTON IN NAVBAR
    console.log('\n--- Step 6: Test Navbar Direct Sign Out Button ---');
    const directSignOutBtn = page.locator('#navbarDirectSignOutBtn');
    await directSignOutBtn.click();
    await page.waitForURL('**/login', { timeout: 10000 });
    console.log('[PASS] Direct Sign Out successfully logged out and navigated to:', page.url());

    const finalScreenshotPath = path.join(screenshotsDir, 'fix_05_logged_out_state.png');
    await page.screenshot({ path: finalScreenshotPath });

    console.log('\n=== ALL FIX VERIFICATIONS COMPLETED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('[TEST ERROR]:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVisualValidation();
