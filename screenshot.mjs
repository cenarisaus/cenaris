import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

// Auto-increment filename
let n = 1;
let filename;
do {
  filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
  n++;
} while (fs.existsSync(path.join(screenshotDir, filename)));

const outPath = path.join(screenshotDir, filename);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: (() => {
    // Try common paths
    const paths = [
      'C:/Users/leona/.cache/puppeteer/chrome/win64-*/chrome-win64/chrome.exe',
      'C:/Users/nateh/.cache/puppeteer/chrome/win64-*/chrome-win64/chrome.exe',
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    ];
    for (const p of paths) {
      // glob-like: if no wildcard, check directly
      if (!p.includes('*') && fs.existsSync(p)) return p;
    }
    return undefined; // let puppeteer find it
  })(),
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
// Scroll through the page to trigger IntersectionObserver animations
await page.evaluate(async () => {
  await new Promise(resolve => {
    let scrollY = 0;
    const step = 300;
    const timer = setInterval(() => {
      scrollY += step;
      window.scrollTo(0, scrollY);
      if (scrollY >= document.body.scrollHeight) {
        window.scrollTo(0, 0);
        clearInterval(timer);
        resolve();
      }
    }, 60);
  });
});
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outPath}`);
