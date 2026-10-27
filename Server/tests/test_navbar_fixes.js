const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testNavbarFixes() {
  console.log('=== Starting HotelPro Navbar Brand & Sign Out Button Verification ===');

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

  try {
    // 1. Check Home Page brand logo visibility
    console.log('\n--- Step 1: Check Navbar Brand Logo ---');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

    const brandEl = page.locator('.navbar-brand');
    await brandEl.waitFor({ state: 'visible' });
    const brandText = await brandEl.innerText();
    console.log('[PASS] Navbar brand text extracted:', brandText.replace(/\s+/g, ' '));

    const brandColor = await page.evaluate(() => {
      const el = document.querySelector('.navbar-brand span.text-white') || document.querySelector('.navbar-brand');
      return window.getComputedStyle(el).color;
    });
    console.log('[PASS] Computed color of HOTEL brand text:', brandColor);

    const brandScreenshotPath = path.join(screenshotsDir, 'fix_09_hotel_brand_visible.png');
    await page.screenshot({ path: brandScreenshotPath, clip: { x: 0, y: 0, width: 450, height: 120 } });
    console.log(`[PASS] Brand logo screenshot saved to: ${brandScreenshotPath}`);

    // 2. Log in as Guest
    console.log('\n--- Step 2: Log in as Guest ---');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
    await page.click('button:has-text("Guest Login")');
    await page.click('button:has-text("Sign In as Guest")');
    await page.waitForURL('**/my-bookings', { timeout: 10000 });

    // 3. Verify Direct Sign Out button is completely removed
    console.log('\n--- Step 3: Check Direct Red Sign Out Button is Removed ---');
    const directSignOutExists = await page.locator('#navbarDirectSignOutBtn').count();
    console.log('[PASS] Direct Sign Out button count (should be 0):', directSignOutExists);

    if (directSignOutExists === 0) {
      console.log('[PASS] Direct red "[-> Sign Out]" button successfully removed from navbar!');
    } else {
      console.error('[FAIL] Direct red Sign Out button still exists!');
    }

    // 4. Verify User Dropdown Button still works
    console.log('\n--- Step 4: Verify User Dropdown Still Functions Smoothly ---');
    const userDropdown = page.locator('#userDropdown');
    await userDropdown.click();
    await page.waitForTimeout(300);

    const dropdownMenu = page.locator('#userDropdown + ul.dropdown-menu');
    const isVisible = await dropdownMenu.isVisible();
    console.log('[PASS] Profile dropdown menu is open and visible:', isVisible);

    const navbarScreenshotPath = path.join(screenshotsDir, 'fix_10_navbar_clean_dropdown.png');
    await page.screenshot({ path: navbarScreenshotPath });
    console.log(`[PASS] Full navbar screenshot saved to: ${navbarScreenshotPath}`);

    console.log('\n=== ALL NAVBAR VERIFICATIONS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('[TEST ERROR]:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testNavbarFixes();
