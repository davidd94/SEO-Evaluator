const puppeteer = require("puppeteer");
const fetch = require("node-fetch");
const fs = require("fs-extra");
const PuppeteerHar = require('puppeteer-har/lib/PuppeteerHar');

const { ExcelWorkbook } = require('./excel');
const git = require('./git');
const { saveToJson, readJson, sleep, getFileExtension } = require('./utils');
const { timestamp, psc } = require("./settings");


async function _newBrowser() {
    var browser = await puppeteer.launch({
        // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        ignoreDefaultArgs: true,
        headless: false,
        devtools: true,
        ignoreHTTPSErrors: true,
        args: [
            '--incognito'
        ],
    });

    var [page] = await browser.pages();

    // console.log work inside page methods
    page.on('console', consoleObj => console.log(consoleObj.text()));

    // browser settings
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
    });

    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1');;
    // await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36');

    await page.setViewport({
        width: 375,
        height: 667,
        isMobile: true
    });

    return { browser, page };
};

function _setUpQuery(url) {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY || '';
    const api = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const parameters = {
      url: encodeURIComponent(url || '')
    };
    let query = `${api}?`;
    for (key in parameters) {
      query += `${key}=${parameters[key]}`;
    }
    query += `&key=${apiKey}`;
    return query;
};

async function runPagespeedApi(url=process.env.NETLIFY_SITE_1_URL) {
    const pageSpeedQuery = _setUpQuery(url);
    const results = await fetch(pageSpeedQuery)
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
            // get 'network-requests' for script auditing
            return lighthouseMetrics;
        } else if (json.error) {
            return {
                'error': `Error ${json.error.code}: ${json.error.message}`
            }
        }
        return {
            'error': 'PageSpeed API failed to retrieve report'
        };
      });
      return results;
};

async function scrapeElemsAndTest(page) {
    const testFileName = process.env.TEST_FILE_NAME;
    // inject functions into puppeteer browser
    await page.exposeFunction('saveToJson', saveToJson);
    await page.exposeFunction('readJson', readJson);
    await page.exposeFunction('sleep', sleep);

    await page.exposeFunction('downloadAndReplacePage', (async (repoID) => {
    console.log('downloading page...');
    const htmlContent = await page.content();
    fs.writeFileSync(`../seo-testing${repoID}/index.html`, htmlContent, (error) => {console.log(error)});
    return true;
    }));

    await page.exposeFunction('takeScreenshot', (async (testNum) => {
    return await page.screenshot({
        path: `./evaluations/${timestamp}-test-ss-${testNum}.png`,
        fullPage: true,
    });
    }));

    await page.exposeFunction('pushElemChange', (async (repoID) => {
        console.log('git pushing latest HTML changes...');
        git.pushElemChange(repoID);
    }));

    await page.exposeFunction('getFileExtension', (fileStr) => {
        return getFileExtension(fileStr);
    });
    console.log('Initializing page evaluations...');
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
    let ulCt = 0;
    let footerCt = 0;

    // find largest height elem
    for (let i = 0; i < allHtml.length; i++) {
        const elem = allHtml[i];
        const height = elem.height;
        const width = elem.width;
        const topElementText = elem?.firstChild?.nodeValue?.replace(/\s+/g, '') || '';
        const elemLimit = 15;

        const elemData = {
            action: '',
            type: '',
            element: null,
        }

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
        if (topElementText && topElementText.length >= psc.text.minWordCount && textCt < elemLimit) {
            elemData.action = 'test';
            elemData.element = elem;
            elemData.type = elem.tagName;
            testElems.push(elemData);

            textCt += 1;
            totalFilteredElem += 1;
        } else if (elem.tagName === 'IMG' && elem.src && imgCt < elemLimit) {
            if (height >= psc.image.minImgHeight && 
                width >= psc.image.minImgWidth
            ) {
                elemData.action = 'remove';
                elemData.element = elem;
                elemData.type = elem.tagName;
                testElems.push(elemData);

                imgCt += 1;
                totalFilteredElem += 1;
            };
        } else if (elem.tagName === 'SCRIPT' && elem.src && scriptCt < elemLimit) {
            // ignore type="application/json"
            if (elem.type === 'application/json') {
                continue;
            };
            
            // Grab all src with suffix .js
            const fileType = window.getFileExtension(elem.src);
            if (fileType === 'js') {
                elemData.action = 'remove';
                elemData.element = elem;
                elemData.type = elem.tagName;
                testElems.push(elemData);

                scriptCt += 1;
                totalFilteredElem += 1;
            }
            // grab all url JS injections

            // NOTE innerText contents... need to catch 'require' and 'requirejs' (dont worry about it now)
        } else if (elem.tagName === 'NAV' && navCt < elemLimit) {
            if (elem.children.length >= psc.nav.minChildren) {
                elemData.action = 'remove';
                elemData.element = elem;
                elemData.type = elem.tagName;
                testElems.push(elemData);

                navCt += 1;
                totalFilteredElem += 1;
            }
        } else if (elem.tagName === 'UL' && ulCt < elemLimit) {
            const acceptedClassNames = psc.ul.classes;
            if (elem.classList) {
                const hasReqClassName = Array.from(elem.classList).some((className) => {
                    return acceptedClassNames.includes(className);
                });
                if (hasReqClassName) {
                    elemData.action = 'remove';
                    elemData.element = elem;
                    elemData.type = elem.tagName;
                    testElems.push(elemData);

                    ulCt += 1;
                    totalFilteredElem += 1;
                };
            }
        } else if (elem.tagName === 'FOOTER' && footerCt < elemLimit) {
            if (elem.children.length >= psc.footer.minChildren) {
                elemData.action = 'remove';
                elemData.element = elem;
                elemData.type = elem.tagName;
                testElems.push(elemData);

                footerCt += 1;
                totalFilteredElem += 1;
            }
        } else if (elem.tagName === 'IFRAME' && elem.src && iframeCt < elemLimit) {
            elemData.action = 'remove';
            elemData.element = elem;
            elemData.type = elem.tagName;
            testElems.push(elemData);

            iframeCt += 1;
            totalFilteredElem += 1;
        } else if (elem.tagName === 'VIDEO' && videoCt < elemLimit) {
            if (elem.src) {
                elemData.action = 'remove';
                elemData.element = elem;
                elemData.type = elem.tagName;
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
                    elemData.type = elem.tagName;
                    testElems.push(elemData);

                    videoCt += 1;
                    totalFilteredElem += 1;
                    return false;
                }
            });
        } else if (elem.tagName === 'LINK' && elem.href && linkCt < elemLimit) {
            // find .css files and rel="dns-prefetch" | "preconnect" | "preload"
            // NOTE: Does not count link inside iframes
            const fileType = window.getFileExtension(elem.href);
            const relType = elem.rel || '';

            if (
                psc.link.files.includes(fileType) || psc.link.rel.includes(relType)
                ) {
                    elemData.action = 'remove';
                    elemData.element = elem;
                    elemData.type = elem.tagName;
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
    console.log(`UL count ${ulCt}`);
    console.log(`Footer count ${footerCt}`);
    console.log(`Final total filtered elements: ${totalFilteredElem}`);
    
    // split elements to chunks
    const totalElems = testElems.length;
    const sectionLength = Math.floor(totalElems / 3);

    // starting index for each chunks
    let elemIndex1 = 0;
    let elemIndex2 = sectionLength;
    let elemIndex3 = sectionLength * 2;

    // save num of elements for each chunk
    const file1 = `${testFileName}1`;
    const file2 = `${testFileName}2`;
    const file3 = `${testFileName}3`;
    let currentTestData1 = await readJson(file1);
    let currentTestData2 = await readJson(file2);
    let currentTestData3 = await readJson(file3);

    currentTestData1.elementIndex = elemIndex1;
    currentTestData2.elementIndex = elemIndex2;
    currentTestData3.elementIndex = elemIndex3;
    currentTestData1.totalElems = sectionLength;
    currentTestData2.totalElems = sectionLength;
    currentTestData3.totalElems = totalElems - sectionLength * 2;

    saveToJson(currentTestData1, file1);
    saveToJson(currentTestData2, file2);
    saveToJson(currentTestData3, file3);

    let elemCt = 0;
    while (
        !currentTestData1.analysisCompleted ||
        !currentTestData2.analysisCompleted ||
        !currentTestData3.analysisCompleted
    ) {
        console.log(`current element count ${elemCt}`);
        // get current status of each chunks
        currentTestData1 = await readJson(`${testFileName}1`);
        currentTestData2 = await readJson(`${testFileName}2`);
        currentTestData3 = await readJson(`${testFileName}3`);

        // handling first chunk
        if (
            currentTestData1.elementIndex >= elemIndex1 &&
            currentTestData1.elementIndex < sectionLength
        ) {
            const currentElem1 = testElems[elemIndex1];
            let element = currentElem1.element;
            let parent = currentElem1.element.parentElement;

            console.log(
                `Currently testing: ${element.tagName} - 
                src: ${element?.src || 'N/A'} - 
                href: ${element?.href || 'N/A'}`
            );

            // mark element for SS
            const oldStyle = element.style.border;
            element.style.border = '5px solid red';

            // screenshot the modified page for current test
            await window.takeScreenshot(currentTestData1.elementIndex);

            // revert styles
            element.style.border = oldStyle;

            // modify html
            element.parentNode.removeChild(element);

            // download modified html
            await window.downloadAndReplacePage(1);

            // update webhost files
            await window.pushElemChange(1);

            // add element back
            parent.appendChild(element);
            
            elemIndex1 += 1;
            elemCt += 1;

            // update test data file
            if (element.src) {
                currentTestData1.elementSrc = element.src;
            }
            currentTestData1.elementType = element.tagName;
            currentTestData1.elementCompleted = false;

            saveToJson(currentTestData1, file1);
        } else if (
            currentTestData1.elementIndex >= elemIndex1 &&
            currentTestData1.elementIndex >= sectionLength &&
            !currentTestData1.analysisCompleted
        ) {
            currentTestData1.analysisCompleted = true;
            currentTestData1.endTime = new Date().toTimeString();
            saveToJson(currentTestData1, file1);
        }

        // handling second chunk
        if (
            currentTestData2.elementIndex >= elemIndex2 &&
            currentTestData2.elementIndex < sectionLength * 2
        ) {
            const currentElem2 = testElems[elemIndex2];
            let element = currentElem2.element;
            let parent = currentElem2.element.parentElement;

            console.log(
                `Currently testing: ${element.tagName} - 
                src: ${element?.src || 'N/A'} - 
                href: ${element?.href || 'N/A'}`
            );

            // mark element for SS
            const oldStyle = element.style.border;
            element.style.border = '3px solid red';

            // screenshot the modified page for current test
            await window.takeScreenshot(currentTestData2.elementIndex);

            // revert styles
            element.style.border = oldStyle;

            // modify html
            element.parentNode.removeChild(element);

            // download modified html
            await window.downloadAndReplacePage(2);

            // update webhost files
            await window.pushElemChange(2);

            // add element back
            parent.appendChild(element);
            
            elemIndex2 += 1;
            elemCt += 1;

            // update test data file
            if (element.src) {
                currentTestData2.elementSrc = element.src;
            }
            currentTestData2.elementType = element.tagName;
            currentTestData2.elementCompleted = false;

            saveToJson(currentTestData2, file2);
        } else if (
            currentTestData2.elementIndex >= elemIndex2 &&
            currentTestData2.elementIndex >= sectionLength * 2 &&
            !currentTestData2.analysisCompleted
        ) {
            currentTestData2.analysisCompleted = true;
            currentTestData2.endTime = new Date().toTimeString();
            saveToJson(currentTestData2, file2);
        }

        // handling third chunk
        if (
            currentTestData3.elementIndex >= elemIndex3 &&
            currentTestData3.elementIndex < totalElems
        ) {
            const currentElem3 = testElems[elemIndex3];
            let element = currentElem3.element;
            let parent = currentElem3.element.parentElement;

            console.log(
                `Currently testing: ${element.tagName} >> src: ${element?.src || 'N/A'} >> href: ${element?.href || 'N/A'}`
            );

            // mark element for SS
            const oldStyle = element.style.border;
            element.style.border = '3px solid red';

            // screenshot the modified page for current test
            await window.takeScreenshot(currentTestData3.elementIndex);

            // revert styles
            element.style.border = oldStyle;

            // modify html
            element.parentNode.removeChild(element);

            // download modified html
            await window.downloadAndReplacePage(3);

            // update webhost files
            await window.pushElemChange(3);

            // add element back
            parent.appendChild(element);
            
            elemIndex3 += 1;
            elemCt += 1;

            // update test data file
            if (element.src) {
                currentTestData3.elementSrc = element.src;
            }
            currentTestData3.elementType = element.tagName;
            currentTestData3.elementCompleted = false;

            saveToJson(currentTestData3, file3);
        } else if (
            currentTestData3.elementIndex >= elemIndex3 &&
            currentTestData3.elementIndex >= totalElems &&
            !currentTestData3.analysisCompleted
        ) {
            currentTestData3.analysisCompleted = true;
            currentTestData3.endTime = new Date().toTimeString();
            saveToJson(currentTestData3, file3);
        }

        console.log(`Waiting to test an element...`);
        await sleep(2500);
    };

    console.log('PageSpeed testing completed!');
    console.log('Saving data to excel sheet...');

    const resultFileName = 'results';
    const results1 = `${resultFileName}1`;
    const results2 = `${resultFileName}2`;
    const results3 = `${resultFileName}3`;

    const data1 = await readJson(results1) || [];
    const data2 = await readJson(results2) || [];
    const data3 = await readJson(results3) || [];

    const allData = data1.concat(data2).concat(data3);

    // get excel and save final results
    const workbook = new ExcelWorkbook(
        creator='DavidDee',
        initData={
            totalElems: totalElems,
            startTime: currentTestData1.startTime,
            endTime: new Date().toTimeString(),
        },
    );
    await workbook.initWorkbook();

    // iterate through all elements
    allData.forEach((elemData) => {
        function parseStringToNumber(stringVal) {
            if (typeof stringVal == 'string') {
                return Number(stringVal.replace(/[^.0-9]/g, ''));
            }
            return 0;
        };

        const elementType = elemData['element'];
        const src = elemData['src'];
        const results = elemData['results'];

        // add new section
        workbook.addNewSection(elementType, src);

        // avg scores
        let fcpScore = 0;
        let siScore = 0;
        let ttiScore = 0;
        let fmpScore = 0;
        let gciScore = 0;
        let eilScore = 0;

        // avg display values
        let fcpDisplayVal = 0;
        let siDisplayVal = 0;
        let ttiDisplayVal = 0;
        let fmpDisplayVal = 0;
        let gciDisplayVal = 0;
        let eilDisplayVal = 0;

        // avg numeric values
        let fcpNumericVal = 0;
        let siNumericVal = 0;
        let ttiNumericVal = 0;
        let fmpNumericVal = 0;
        let gciNumericVal = 0;
        let eilNumericVal = 0;
        
        // iterate through each element's test results
        results.forEach((result, index) => {
            // iterate through each result types
            const row = [index + 1];
            Object.values(result).forEach((testData, idx) => {
                if (idx === 0) {
                    fcpScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
                    fcpDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
                    fcpNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
                } else if (idx === 1) {
                    siScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
                    siDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
                    siNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
                } else if (idx === 2) {
                    ttiScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
                    ttiDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
                    ttiNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
                } else if (idx === 3) {
                    fmpScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
                    fmpDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
                    fmpNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
                } else if (idx === 4) {
                    gciScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
                    gciDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
                    gciNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
                } else if (idx === 5) {
                    eilScore += Number(testData.score) ? Number(testData.score) : parseStringToNumber(testData.score);
                    eilDisplayVal += Number(testData.displayValue) ? Number(testData.displayValue) : parseStringToNumber(testData.displayValue);
                    eilNumericVal += Number(testData.numericValue) ? Number(testData.numericValue) : parseStringToNumber(testData.numericValue);
                }

                row.push(testData.score);
                row.push(testData.displayValue);
                row.push(testData.numericValue);
            });
            workbook.addDataRow(row);
        });

        // add avg row
        workbook.addDataRow([
            'AVG SCORES: ',
            Math.round(fcpScore / 10 * 100) / 100, Math.round(fcpDisplayVal / 10 * 100) / 100, Math.round(fcpNumericVal / 10 * 100) / 100,
            Math.round(siScore / 10 * 100) / 100, Math.round(siDisplayVal / 10 * 100) / 100, Math.round(siNumericVal / 10 * 100) / 100,
            Math.round(ttiScore / 10 * 100) / 100, Math.round(ttiDisplayVal / 10 * 100) / 100, Math.round(ttiNumericVal / 10 * 100) / 100,
            Math.round(fmpScore / 10 * 100) / 100, Math.round(fmpDisplayVal / 10 * 100) / 100, Math.round(fmpNumericVal / 10 * 100) / 100,
            Math.round(gciScore / 10 * 100) / 100, Math.round(gciDisplayVal / 10 * 100) / 100, Math.round(gciNumericVal / 10 * 100) / 100,
            Math.round(eilScore / 10 * 100) / 100, Math.round(eilDisplayVal / 10 * 100) / 100, Math.round(eilNumericVal / 10 * 100) / 100,
        ]);

    });

    // save to excel
    await workbook.saveWorkbookAsFile();

    console.log('PageSpeed analysis completed!');

    return true;
}, psc, testFileName);
  
  return true;
};

async function pagespeedEvaluation(url=process.env.NETLIFY_SITE_1_URL) {
    const testFileName1 = `${process.env.TEST_FILE_NAME}1`;
    const testFileName2 = `${process.env.TEST_FILE_NAME}2`;
    const testFileName3 = `${process.env.TEST_FILE_NAME}3`;
    console.log('Evaluating pagespeed....');
    
    // create init test data file
    const testData1 = {
        siteID: process.env.NETLIFY_SITE_1_ID,
        elementIndex: -1,
        elementType: '',
        elementSrc: '',
        initialized: false,
        elementCompleted: false,
        analysisCompleted: false,
        totalElems: 0,
        startTime: new Date().toTimeString(),
        endTime: '',
    };
    const testData2 = {
        siteID: process.env.NETLIFY_SITE_2_ID,
        elementIndex: -1,
        elementType: '',
        elementSrc: '',
        initialized: false,
        elementCompleted: false,
        analysisCompleted: false,
        totalElems: 0,
        startTime: new Date().toTimeString(),
        endTime: '',
    };
    const testData3 = {
        siteID: process.env.NETLIFY_SITE_3_ID,
        elementIndex: -1,
        elementType: '',
        elementSrc: '',
        initialized: false,
        elementCompleted: false,
        analysisCompleted: false,
        totalElems: 0,
        startTime: new Date().toTimeString(),
        endTime: '',
    };

    saveToJson(testData1, testFileName1);
    saveToJson(testData2, testFileName2);
    saveToJson(testData3, testFileName3);

    // create init results
    const resultsFileName1 = `${process.env.RESULT_FILE_NAME}1`;
    const resultsFileName2 = `${process.env.RESULT_FILE_NAME}2`;
    const resultsFileName3 = `${process.env.RESULT_FILE_NAME}3`;
    const results1 = [];
    const results2 = [];
    const results3 = [];

    saveToJson(results1, resultsFileName1);
    saveToJson(results2, resultsFileName2);
    saveToJson(results3, resultsFileName3);

    // wait for sites to deploy before testing
    let currentTestData1 = await readJson(testFileName1);
    let currentTestData2 = await readJson(testFileName2);
    let currentTestData3 = await readJson(testFileName3);

    while (!currentTestData1.initialized ||
        !currentTestData2.initialized ||
        !currentTestData3.initialized
    ) {
        currentTestData1 = await readJson(testFileName1);
        currentTestData2 = await readJson(testFileName2);
        currentTestData3 = await readJson(testFileName3);
        await sleep(2000);
        console.log(`Waiting for initial git push to complete... [test-branch-1: ${currentTestData1.initialized ? 'COMPLETE' : 'INCOMPLETE'}] - [test-branch-2: ${currentTestData2.initialized ? 'COMPLETE' : 'INCOMPLETE'}] - [test-branch-3: ${currentTestData3.initialized ? 'COMPLETE' : 'INCOMPLETE'}]`);
    }

    // baseline report - create excel
    const workbook = new ExcelWorkbook(
        creator='DavidDee',
        initData={
            startTime: new Date().toTimeString(),
        },
    );
    await workbook.initWorkbook();

    // init new section for elem
    workbook.addNewSection('Baseline with all elements', '*');

    console.log('Baseline Testing URL: ' + process.env.NETLIFY_SITE_1_URL);
    const reportNum = 3;
    for (i=0; i < reportNum; i++) {
        console.log(`Running baseline PageSpeed Test: ${i + 1}`);
        const results = await runPagespeedApi(process.env.NETLIFY_SITE_1_URL);
        
        const row = [i + 1];
        if (results.error) {
            row.push(results.error);
        } else {
            // add data
            Object.values(results).forEach((result) => {
                row.push(result.score);
                row.push(result.displayValue);
                row.push(result.numericValue);
            });
        }

        workbook.addDataRow(row);

        // save to excel
        await workbook.saveWorkbookAsFile();

        await sleep(5000);
    }

    // init browser
    const { browser, page } = await _newBrowser();
    const har = new PuppeteerHar(page);
    
    await har.start({ path: `./evaluations/results.har` });
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('body');

    await har.stop();

    // take init screenshot
    await page.screenshot({
      path: `./evaluations/${timestamp}-baseScreenshot.png`,
      fullPage: true,
    });

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
exports.newBrowser = _newBrowser;
