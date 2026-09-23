/**
 * Renders an HTML file to a print-ready A4 PDF with Chrome.
 *
 * Usage:  node render_pdf.mjs <input.html> <output.pdf>
 *
 * Page geometry lives in print.css via the @page rule, so `preferCSSPageSize`
 * is set and Puppeteer's own margin options are left alone. Page numbers are
 * stamped afterwards by the Python pipeline, which needs to switch from roman
 * to arabic part-way through and so cannot use Chrome's footer template.
 */
import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node render_pdf.mjs <input.html> <output.pdf>');
  process.exit(1);
}

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
});
const page = await browser.newPage();

// `networkidle0` guarantees every embedded diagram and screenshot has loaded
// before pagination is computed; without it Chrome can lay out around
// zero-height images and the page breaks land in the wrong places.
await page.goto(path.resolve(input).startsWith('file://')
  ? input : `file://${path.resolve(input)}`, { waitUntil: 'networkidle0', timeout: 180000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 400));

await page.pdf({
  path: output,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: false,
  timeout: 300000,
});

await browser.close();
const kb = (fs.statSync(output).size / 1024).toFixed(0);
console.log(`  rendered ${path.basename(output)} (${kb} KB)`);
