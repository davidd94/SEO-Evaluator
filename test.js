const fetch = require('node-fetch');
const { saveToJson, readJson, sleep, exposeModuleMethods } = require('./utils');
const puppeteer = require("puppeteer");
const puppeteerHar = require("puppeteer-har");
const fs = require("fs-extra");
const _ = require('lodash');

const ps = require("./pagespeed");
const scraper = require("./scrape");
const git = require('./git');
const util = require('./utils');
const { ExcelWorkbook } = require('./excel');
const PuppeteerHar = require('puppeteer-har/lib/PuppeteerHar');

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
//     await scraper.scrapeAndDownloadPage(url='https://48hourmonogram.com/collections/monograms/products/regular-monogram-script');
//     // await git.forcePushScrapeData(1);
//     // await git.forcePushScrapeData(2);
//     // await git.forcePushScrapeData(3);
// })();

// (async () => {
//   await git.pushElemChange(1);
//   await git.pushElemChange(2);
//   await git.pushElemChange(3);
// })();

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

// (async () => {
//     const testDataName = 'currentTestData';
//     const testData1 = `${testDataName}1`;
//     const testData2 = `${testDataName}2`;
//     const testData3 = `${testDataName}3`;

//     const testFileName = 'results';
//     const file1 = `${testFileName}1`;
//     const file2 = `${testFileName}2`;
//     const file3 = `${testFileName}3`;

//     let currentTestData1 = readJson(testData1);
//     let currentTestData2 = readJson(testData2);
//     let currentTestData3 = readJson(testData3);

//     while (
//         !currentTestData1.analysisCompleted ||
//         !currentTestData2.analysisCompleted ||
//         !currentTestData3.analysisCompleted
//     ) {
//         console.log('Waiting for the last few tests to complete...');
//         currentTestData1 = readJson(testData1);
//         currentTestData2 = readJson(testData2);
//         currentTestData3 = readJson(testData3);
//         await sleep(2500);
//     }

//     console.log('Saving data to excel sheet...');

//     const data1 = readJson(file1) || [];
//     const data2 = readJson(file2) || [];
//     const data3 = readJson(file3) || [];

//     const allData = _.concat(data1, data2, data3);

//     // get excel and save final results
//     const workbook = new ExcelWorkbook(
//         creator='DavidDee',
//         initData={
//             totalElems: 100,
//             startTime: currentTestData1.startTime,
//             endTime: new Date().toTimeString(),
//         },
//     );
//     await workbook.initWorkbook();

//     // iterate through all elements
//     allData.forEach((elemData) => {
//         function parseStringToNumber(stringVal) {
//             if (typeof stringVal == 'string') {
//                 return Number(stringVal.replace(/[^.0-9]/g, ''));
//             }
//             return 0;
//         };

//         const elementType = elemData['element'];
//         const src = elemData['src'];
//         const results = elemData['results'];

//         // add new section
//         workbook.addNewSection(elementType, src);

//         // avg scores
//         let fcpScore = 0;
//         let siScore = 0;
//         let ttiScore = 0;
//         let fmpScore = 0;
//         let gciScore = 0;
//         let eilScore = 0;

//         // avg display values
//         let fcpDisplayVal = 0;
//         let siDisplayVal = 0;
//         let ttiDisplayVal = 0;
//         let fmpDisplayVal = 0;
//         let gciDisplayVal = 0;
//         let eilDisplayVal = 0;

//         // avg numeric values
//         let fcpNumericVal = 0;
//         let siNumericVal = 0;
//         let ttiNumericVal = 0;
//         let fmpNumericVal = 0;
//         let gciNumericVal = 0;
//         let eilNumericVal = 0;
        
//         // iterate through each element's test results
//         results.forEach((result, index) => {
//             // iterate through each result types
//             const row = [index + 1];
//             Object.values(result).forEach((testData, idx) => {
//                 if (idx === 0) {
//                     fcpScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
//                     fcpDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
//                     fcpNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
//                 } else if (idx === 1) {
//                     siScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
//                     siDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
//                     siNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
//                 } else if (idx === 2) {
//                     ttiScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
//                     ttiDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
//                     ttiNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
//                 } else if (idx === 3) {
//                     fmpScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
//                     fmpDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
//                     fmpNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
//                 } else if (idx === 4) {
//                     gciScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
//                     gciDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
//                     gciNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
//                 } else if (idx === 5) {
//                     eilScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
//                     eilDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
//                     eilNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
//                 }

//                 row.push(testData.score);
//                 row.push(testData.displayValue);
//                 row.push(testData.numericValue);
//             });
//             workbook.addDataRow(row);
//         });

//         // add avg row
//         workbook.addDataRow([
//             'AVG SCORES: ',
//             Math.round(fcpScore / 10 * 100) / 100, Math.round(fcpDisplayVal / 10 * 100) / 100, Math.round(fcpNumericVal / 10 * 100) / 100,
//             Math.round(siScore / 10 * 100) / 100, Math.round(siDisplayVal / 10 * 100) / 100, Math.round(siNumericVal / 10 * 100) / 100,
//             Math.round(ttiScore / 10 * 100) / 100, Math.round(ttiDisplayVal / 10 * 100) / 100, Math.round(ttiNumericVal / 10 * 100) / 100,
//             Math.round(fmpScore / 10 * 100) / 100, Math.round(fmpDisplayVal / 10 * 100) / 100, Math.round(fmpNumericVal / 10 * 100) / 100,
//             Math.round(gciScore / 10 * 100) / 100, Math.round(gciDisplayVal / 10 * 100) / 100, Math.round(gciNumericVal / 10 * 100) / 100,
//             Math.round(eilScore / 10 * 100) / 100, Math.round(eilDisplayVal / 10 * 100) / 100, Math.round(eilNumericVal / 10 * 100) / 100,
//         ])

//     });

//     // save to excel
//     await workbook.saveWorkbookAsFile();

//     console.log('PageSpeed analysis completed!');

//     return true;
// })();

// (async () => {
//     // baseline report - create excel
//     const workbook = new ExcelWorkbook(
//         creator='DavidDee',
//         initData={
//             startTime: new Date().toTimeString(),
//         },
//     );
//     await workbook.initWorkbook();

//     const reportNum = 3;
//     for (i=0; i < reportNum; i++) {
//         console.log(`Running baseline PageSpeed Test: ${i + 1}`);
//         process.env.GOOGLE_PAGESPEED_API_KEY = '';
//         const results = await ps.runPagespeedApi('https://seo-testing1.netlify.app/');
        
//         const row = [i + 1];
//         if (results.error) {
//             row.push(results.error);
//         } else {
//             // add data
//             Object.values(results).forEach((result) => {
//                 row.push(result.score);
//                 row.push(result.displayValue);
//                 row.push(result.numericValue);
//             });
//         }
//         console.log(row);
//         workbook.addDataRow(row);

//         // save to excel
//         await workbook.saveWorkbookAsFile();

//         await sleep(3000);
//     }
// })()

// (async () => {
//     const { browser, page } = await ps.newBrowser();
//     const har = new PuppeteerHar(page);

//     await har.start({ path: './evaluations/results.har' });
    
//     await page.goto(
//         'https://48hourmonogram.com/collections/monograms/products/regular-monogram-script',
//         { waitUntil: 'networkidle2' }
//     );
//     await page.waitForSelector('body');

//     await har.stop();

//     await sleep(10000);

//     browser.close();
// })();

// (() => {
//     const url = 'https://connect.nosto.com/include/magento-b71573d5';
//     const otherParams = {
//         headers: {
//             'Accept': '*/*'
//         },
//         method: 'GET',
//     };
//     fetch(url, otherParams)
//     .then(res => res.buffer())
//     .then(blob => {
//         const buffToString = blob.toString('utf8');
//         console.log(buffToString);
//         console.log(buffToString.includes('https://'));
//         console.log(buffToString.includes('.js'));
//     })
//     .catch(error => {
//         if (error) {
//             console.log(error);
//         }
//     });
// })();

(async () => {
    // const har = await fs.readFile('./evaluations/results.har');
    // const data = har.toString('utf8');
    // const dataJSON = JSON.parse(data);
    // const responses = dataJSON.log.entries;

    // const filteredResponses = _.chain(responses)
    //     .filter((res) => {
    //         const fileType = util.getFileExtension(res.request.url);
    //         // return fileType === 'js';
    //         return true;
    //     })
    //     .orderBy('time', 'desc')
    //     .value()
    
    // console.log(responses.length);
    // console.log(filteredResponses.length);

    // // _.forEach(filteredResponses, (res) => console.log(res.request.url, ' | ', `Time: ${res.time} ms`, ' | ', `Request Time: ${res._requestTime} ms`));
    
    // console.log(filteredResponses[0]);
    // console.log(filteredResponses[0].request.url);
    // console.log('time: ', filteredResponses[0].time);
    // console.log('request time: ', filteredResponses[0]._requestTime);
    process.env.GOOGLE_PAGESPEED_API_KEY = '';
    await ps.runPagespeedApi('https://seo-testing1.netlify.app/');
})();
