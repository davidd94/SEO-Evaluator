const _ = require("lodash");
const puppeteer = require("puppeteer");
const fetch = require("node-fetch");
const fs = require("fs-extra");

const lh = require("./lighthouse");
const scrape = require("./scrape");
const { saveReportAsJson, saveToJson, readJson, sleep, getFileExtension } = require('./utils');
const { timestamp, psc } = require("./settings");


async function _newBrowser() {
    var browser = await puppeteer.launch({
        // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        ignoreDefaultArgs: true,
        headless: false,
        defaultViewport: null,
    });

    var page = await browser.newPage();
    page.on('console', consoleObj => console.log(consoleObj.text())); // console.log work inside page methods

    // browser settings
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
    });

    // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36');
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36');

    await page.setViewport({
        width: 375,
        height: 667,
        isMobile: true
    });

    return { browser, page };
};

function _setUpQuery() {
    const api = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const parameters = {
      url: encodeURIComponent(process.env.NETLIFY_URL || '')
    };
    let query = `${api}?`;
    for (key in parameters) {
      query += `${key}=${parameters[key]}`;
    }
    return query;
};

async function runPagespeedApi() {
    const url = _setUpQuery();
    const results = await fetch(url)
      .then(response => response.json())
      .then(json => {
        // See https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed#response
        // to learn more about each of the properties in the response object.
        const lighthouse = json.lighthouseResult;
        if (lighthouse) {
            const lighthouseMetrics = {
              'First Contentful Paint': lighthouse.audits['first-contentful-paint'],
              'Speed Index': lighthouse.audits['speed-index'],
              'Time To Interactive': lighthouse.audits['interactive'],
              'First Meaningful Paint': lighthouse.audits['first-meaningful-paint'],
              'First CPU Idle': lighthouse.audits['first-cpu-idle'],
              'Estimated Input Latency': lighthouse.audits['estimated-input-latency']
            };
            return lighthouseMetrics;
        };
        return {
            'Error': 'Pagepeed API failed to retrieve report'
        };
      });
      return results;
};

async function scrapeElemsAndTest(page) {
    const testFileName = process.env.TEST_FILE_NAME;

    // inject libraries into puppeteer browser
    // await page.addScriptTag({ path: './node_modules/fs-extra/lib/json/jsonfile.js' });

    // inject functions into puppeteer browser
    await page.exposeFunction('saveToJson', saveToJson);
    await page.exposeFunction('readJson', readJson);
    await page.exposeFunction('sleep', sleep);

    await page.exposeFunction('downloadAndReplacePage', (async () => {
    console.log('downloading page...');
    const htmlContent = await page.content();
    fs.writeFileSync('./baseScrapeData/index.html', htmlContent, (error) => {console.log(error)});
    return true;
    }));

    await page.exposeFunction('takeScreenshot', (async (testNum) => {
    return await page.screenshot({
        path: `./evaluations/${timestamp}-test-ss-${testNum}.png`,
        fullPage: true,
    });
    }));

    await page.exposeFunction('gitPushData', (async () => {
        console.log('git pushing latest HTML changes...');
        scrape.gitPushScrapeData();
    }));

    await page.exposeFunction('getFileExtension', (fileStr) => {
        return getFileExtension(fileStr);
    });

    await page.evaluate(async (psc, testFileName) => {
    let testElems = [];
    // let allHtml = document.querySelectorAll([
    //     'link', 'script',
    //     'div', 'iframe',
    //     'img', 'video',
    //     'nav', 'footer',
    // ]);
    let allHtml = document.getElementsByTagName('*');
    let totalFilteredElem = 0;

    console.log(`Total elements: ${allHtml.length}`);
    let linkCt = 0;
    let scriptCt = 0;
    let divCt = 0;
    let textCt = 0;
    let iframeCt = 0;
    let imgCt = 0;
    let videoCt = 0;
    let navCt = 0;
    let footerCt = 0;

    // find largest height elem
    for (let i = 0; i < allHtml.length; i++) {
        const elem = allHtml[i];
        const height = elem.height;
        const width = elem.width;

        const elemData = {
            action: '',
            element: null,
        }

        // console.log(elem.tagName);

        // element filtering
        // if (elem.children.length >= minChildElems) {
        //     // check if children have multiple imgs
        //     let elemCount = 0;
        //     Array.from(elem.children).forEach((child) => {
        //         // return elem when met the min num of children
        //         if (elemCount >= minChildElems) {
        //             elemData.action = 'remove';
        //             elemData.element = elem;
        //             testElems.push(elemData);
        //             return;
        //         }
        //         if (child.tagName === 'IMG' && child.src) {
        //             elemCount += 1;
        //         };
        //     });
        // } else 
        if (elem.innerText) {
            const wordCount = elem.innerText.length;
            console.log('word ct: ', wordCount);
            console.log(height);
            console.log(width);
            if (height >= psc.text.minElemHeight && 
                width >= psc.text.minElemWidth && 
                wordCount >= psc.text.minWordCount
            ) {
                elemData.action = 'test';
                elemData.element = elem;
                testElems.push(elemData);

                textCt += 1;
                totalFilteredElem += 1;
            };
        } else if (elem.tagName === 'IMG' && elem.src) {
            if (height >= psc.image.minImgHeight && 
                width >= psc.image.minImgWidth
            ) {
                elemData.action = 'remove';
                elemData.element = elem;
                testElems.push(elemData);

                imgCt += 1;
                totalFilteredElem += 1;
            };
        } else if (elem.tagName === 'SCRIPT' && elem.src) {
            // ignore type="application/json"
            if (elem.type === 'application/json') {
                continue;
            };
            
            // Grab all src with suffix .js
            const fileType = await window.getFileExtension(elem.src);
            if (fileType === 'js') {
                elemData.action = 'remove';
                elemData.element = elem;
                testElems.push(elemData);

                scriptCt += 1;
                totalFilteredElem += 1;
            }
            // NOTE innerText contents... need to catch 'require' and 'requirejs' (dont worry about it now)
        } else if (elem.tagName === 'NAV') {
            if (elem.children.length >= psc.nav.minChildren) {
                elemData.action = 'remove';
                elemData.element = elem;
                testElems.push(elemData);

                navCt += 1;
                totalFilteredElem += 1;
            }
        } else if (elem.tagName === 'FOOTER') {
            if (elem.children.length >= psc.footer.minChildren) {
                elemData.action = 'remove';
                elemData.element = elem;
                testElems.push(elemData);

                footerCt += 1;
                totalFilteredElem += 1;
            }
        } else if (elem.tagName === 'IFRAME' && elem.src) {
            elemData.action = 'remove';
            elemData.element = elem;
            testElems.push(elemData);

            iframeCt += 1;
            totalFilteredElem += 1;
        } else if (elem.tagName === 'VIDEO') {
            if (elem.src) {
                elemData.action = 'remove';
                elemData.element = elem;
                testElems.push(elemData);

                videoCt += 1;
                totalFilteredElem += 1;
                continue;
            }

            // check if video's children are sources
            Array.from(elem.children).every((child) => {
                if (child.tagName === 'SOURCE') {
                    elemData.action = 'remove';
                    elemData.element = elem;
                    testElems.push(elemData);

                    videoCt += 1;
                    totalFilteredElem += 1;
                    return false;
                }
            });
        } else if (elem.tagName === 'LINK' && elem.href) {
            // find .css files and rel="dns-prefetch" | "preconnect" | "preload"
            // NOTE: Does not count link inside iframes
            const fileType = await window.getFileExtension(elem.href);
            const relType = elem.rel || '';

            if (
                psc.link.files.includes(fileType) || psc.link.rel.includes(relType)
                ) {
                    elemData.action = 'remove';
                    elemData.element = elem;
                    testElems.push(elemData);

                    linkCt += 1;
                    totalFilteredElem += 1;
            }
        }
    };

    console.log(`Link count: ${linkCt}`);
    console.log(`Script count: ${scriptCt}`);
    console.log(`Div count: ${divCt}`);
    console.log(`Text count: ${textCt}`);
    console.log(`iFrame count: ${iframeCt}`);
    console.log(`Img count ${imgCt}`);
    console.log(`Video count ${videoCt}`);
    console.log(`Nav count ${navCt}`);
    console.log(`Footer count ${footerCt}`);
    console.log(`Final total filtered elements: ${totalFilteredElem}`);
    
        // for (let i = 0; i < testElems.length; i++) {
        //     const testElem = testElems[i];
        //     console.log(`currently testing: ${testElem.element.tagName}`);

        //     let currentTestData = await readJson(testFileName);

        //     const element = testElem.element;
        //     const parent = testElem.element.parentElement;

        //     // mark element for SS
        //     const oldStyle = element.style.border;
        //     element.style.border = '3px solid red';

        //     // screenshot the modified page for current test
        //     await window.takeScreenshot(currentTestData.elementNum);

        //     // revert styles
        //     element.style.border = oldStyle;

        //     // modify html
        //     element.parentNode.removeChild(element);

        //     // download modified html
        //     await window.downloadAndReplacePage();

        //     // update webhost files
        //     await window.gitPushData();
            
        //     // wait for web hook / testing to complete
        //     while (!currentTestData.completed) {
        //         currentTestData = await readJson(testFileName);
                
        //         await sleep(2500);
        //         currentTestData = await readJson(testFileName);
        //         console.log('Waiting... test completed: ' + currentTestData.completed);
        //         await sleep(2500);
        //     };

        //     // add element back
        //     parent.appendChild(element);

        //     // update test data file
        //     saveToJson({
        //         elementNum: i + 1,
        //         completed: false,
        //     }, testFileName);
        // }

        return testElems;
}, psc, testFileName);
  
  return true;
};

async function pagespeedEvaluation(url=process.env.NETLIFY_URL) {
    const testFileName = process.env.TEST_FILE_NAME;
    console.log('Evaluating pagespeed....');

    // init scrape and download page
    // await scrape.scrapeAndDownloadPage();

    // // init git push page
    // scrape.gitPushScrapeData();
    
    // // create init test data file
    // const testData = {
    //     elementNum: -1,
    //     completed: false,
    // };
    // saveToJson(testData, testFileName);

    // // baseline report
    // const results = await runPagespeedApi();
    // saveReportAsJson('lh-report-initial', results, timestamp);

    // let currentTestData = await readJson(testFileName);

    // while (currentTestData.elementNum === -1) {
    //     currentTestData = await readJson(testFileName);
    //     await sleep(2000);
    //     console.log('Waiting for initial git push to complete...');
    // }

    // init browser
    const { browser, page } = await _newBrowser();
    
    await page.goto(url);
    await page.waitForSelector('body');

    // take init screenshot
    // await page.screenshot({
    //   path: `./evaluations/${timestamp}-baseScreenshot.png`,
    //   fullPage: true,
    // });

    // scrape elements and initialize testing
    const baseElems = await scrapeElemsAndTest(page);
    if (!baseElems) {
        return 'Failed to run analysis... did not meet the requirement(s)...';
    };

    browser.close();

    return true;
};

exports.runPagespeedApi = runPagespeedApi;
exports.scrapeElemsAndTest = scrapeElemsAndTest;
exports.pagespeedEvaluation = pagespeedEvaluation;
