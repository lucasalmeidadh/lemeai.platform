import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 850 } });
await page.goto('https://localhost:5173/login', { waitUntil: 'networkidle', ignoreHTTPSErrors: true });
await page.waitForTimeout(500);
const info = await page.evaluate(() => {
  const el = document.querySelector('.form-logo-mobile');
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return { width: cs.width, height: cs.height, objectFit: cs.objectFit, rect, natural: [el.naturalWidth, el.naturalHeight] };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'verify-mobile3.png' });
await browser.close();
