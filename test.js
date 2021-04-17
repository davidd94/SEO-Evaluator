const { saveToJson, readJson, sleep, exposeModuleMethods } = require('./utils');
const puppeteer = require("puppeteer");

const ps = require("./pagespeed");
const scraper = require("./scrape");
const { ExcelWorkbook } = require('./excel');

// (async () => {
//     var browser = await puppeteer.launch({
//         // executablePath: '/Users/davidduong/nwjs-sdk-v0.51.1-osx-x64/nwjc.app',
//         ignoreDefaultArgs: true,
//         headless: false,
//         defaultViewport: null,
//     });

//     var page = await browser.newPage();
//     page.on('console', consoleObj => console.log(consoleObj.text())); // console.log work inside page methods

//     // browser settings
//     await page.setExtraHTTPHeaders({
//         'Accept-Language': 'en-US,en;q=0.9'
//     });

//     // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36');
//     await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1');

//     await page.setViewport({
//         width: 375,
//         height: 667,
//         isMobile: true
//     });

//     await page.exposeFunction('require', async (moduleName) => {
//         await exposeModuleMethods(page, moduleName);
//     });

//     // make the Page require "fs" native module
//     await page.evaluate(async (moduleName) => await require(moduleName), 'fs');

//     await page.evaluate(async (moduleName) => {
//         // save a file on the current directory named "mod2.js"
//         await window[moduleName]['writeFileSync']('./mod2.js', 'any text');
//         // read the file "mod2.js"
//         const mod2 = await window[moduleName]['readFileSync']('./mod2.js', { encoding: 'utf8' });
//         // log it's content
//         console.log(JSON.stringify(mod2, null, 2));
//         // delete the file
//         await window[moduleName]['unlinkSync']('./mod2.js');
//     }, 'fs');

//     browser.close();
// })();

// (async () => {
//     await scraper.scrapeAndDownloadPage(url='https://www.511tactical.com/norris-sneaker-multicam-1.html');
// })();

(async () => {
    scraper.gitPushScrapeData(2);
})();

// (async () => {
//     await ps.pagespeedEvaluation('https://objective-bohr-9ff531.netlify.app/');
// })();

// (async () => {
//     const workbook = new ExcelWorkbook('12', 'DavidDee');
//     await workbook.initWorkbook();

//     workbook.addNewSection('SCRIPT', 'https://www.google.com/moo.js');

//     const testData = {
//         "First Contentful Paint": {
//           "id": "first-contentful-paint",
//           "title": "First Contentful Paint",
//           "description": "First Contentful Paint marks the time at which the first text or image is painted. [Learn more](https://web.dev/first-contentful-paint/).",
//           "score": 0.81,
//           "scoreDisplayMode": "numeric",
//           "displayValue": "1.1 s",
//           "numericValue": 1099
//         },
//         "Speed Index": {
//           "id": "speed-index",
//           "title": "Speed Index",
//           "description": "Speed Index shows how quickly the contents of a page are visibly populated. [Learn more](https://web.dev/speed-index/).",
//           "score": 0.57,
//           "scoreDisplayMode": "numeric",
//           "displayValue": "2.1 s",
//           "numericValue": 2129.004230029919
//         },
//         "Time To Interactive": {
//           "id": "interactive",
//           "title": "Time to Interactive",
//           "description": "Time to interactive is the amount of time it takes for the page to become fully interactive. [Learn more](https://web.dev/interactive/).",
//           "score": 0.34,
//           "scoreDisplayMode": "numeric",
//           "displayValue": "5.5 s",
//           "numericValue": 5484
//         },
//         "First Meaningful Paint": {
//           "id": "first-meaningful-paint",
//           "title": "First Meaningful Paint",
//           "description": "First Meaningful Paint measures when the primary content of a page is visible. [Learn more](https://web.dev/first-meaningful-paint/).",
//           "score": 0.75,
//           "scoreDisplayMode": "numeric",
//           "displayValue": "1.2 s",
//           "numericValue": 1199
//         },
//         "First CPU Idle": {
//           "id": "first-cpu-idle",
//           "title": "First CPU Idle",
//           "description": "First CPU Idle marks the first time at which the page's main thread is quiet enough to handle input.  [Learn more](https://web.dev/first-cpu-idle/).",
//           "score": 0.4,
//           "scoreDisplayMode": "numeric",
//           "displayValue": "5.1 s",
//           "numericValue": 5083
//         },
//         "Estimated Input Latency": {
//             "id": "estimated-input-latency",
//             "title": "Estimated Input Latency",
//             "description": "Estimated Input Latency is an estimate of how long your app takes to respond to user input, in milliseconds, during the busiest 5s window of page load. If your latency is higher than 50 ms, users may perceive your app as laggy. [Learn more](https://web.dev/estimated-input-latency/).",
//             "score": 0.12,
//             "scoreDisplayMode": "numeric",
//             "displayValue": "160 ms",
//             "numericValue": 164.32000000000002
//         }
//     }

//     const results = [];
//     Object.values(testData).forEach((result) => {
//         results.push(result.score);
//         results.push(result.displayValue);
//         results.push(result.numericValue);
//     });

//     workbook.addDataRow(results);

//     await workbook.saveWorkbookAsFile();
// })();
