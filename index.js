// Require express and body-parser
const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const { ExcelWorkbook } = require('./excel');
const ps = require("./pagespeed");
const scraper = require("./scrape");
const { saveToJson, readJson, sleep } = require('./utils');

// Setup env vars
dotenv.config();

async function initPagespeedEval() {
    const scrapeResults = await scraper.scrapeAndDownloadPage().then(async () => {
        const result1 = await scraper.gitPushScrapeData(1);
        const result2 = await scraper.gitPushScrapeData(2);
        const result3 = await scraper.gitPushScrapeData(3);
        return result1 && result2 && result3;
    });

    if (scrapeResults) {
        return true;
    } else if (!scrapeResults) {
        throw 'Failed to scrape website';
    };
};

async function startPagespeedEval() {
    const results = await ps.pagespeedEvaluation();
    if (!results) {
        console.log(results);
    };
    console.log('finished evaluating pagespeed...');
};


initPagespeedEval().then(async (succeeded) => {
    if (succeeded) {
        // Initialize express and define a port
        const app = express()
        const PORT = 8080
    
        // Tell express to use body-parser's JSON parsing
        app.use(bodyParser.json())
        
        // Routes
        app.post("/hook", async (req, res) => {
            console.log(`Netlify webhook status: ${req.body['state']}`);
            res.status(200).end(); // Responding to webhooks to prevent auto-disable or spamming events
            // Call your action on the request
            if (req.body['state'] === 'ready') {
                const testFileName = process.env.TEST_FILE_NAME;
                const resultFileName = process.env.RESULT_FILE_NAME;
                const maxTestNum = process.env.NUM_OF_PAGESPEED_TESTS;

                const hookSiteID = req.body['site_id'];
                const siteID1 = process.env.NETLIFY_SITE_1_ID;
                const siteID2 = process.env.NETLIFY_SITE_2_ID;
                const siteID3 = process.env.NETLIFY_SITE_3_ID;

                let siteURL = '';
                let chunkNum = 0;

                if (hookSiteID === siteID1) {
                    siteURL = process.env.NETLIFY_SITE_1_URL;
                    chunkNum = 1;
                } else if (hookSiteID === siteID2) {
                    siteURL = process.env.NETLIFY_SITE_2_URL;
                    chunkNum = 2;
                } else if (hookSiteID === siteID3) {
                    siteURL = process.env.NETLIFY_SITE_3_URL;
                    chunkNum = 3;
                }

                const testChunkFileName = `${testFileName}${chunkNum}`;
                const resultChunkFileName = `${resultFileName}${chunkNum}`;

                let currentTestData = await readJson(testChunkFileName);
                const resultsData = await readJson(resultChunkFileName);

                if (currentTestData.initialized) {
                    console.log(`Currently running - Site ID (${hookSiteID}) - Test Elem ID (${currentTestData.elementIndex}) - Elem Type (${currentTestData.elementType})`);
                    let currentTestNum = 1;
                    const testResult = {
                        element: currentTestData.elementType,
                        src: currentTestData.elementSrc,
                        results: [],
                    };

                    // run test X amount and record
                    while (currentTestNum <= maxTestNum) {
                        console.log(`Running PageSpeed API test (ID: ${hookSiteID}): # ${currentTestNum}`);
        
                        // run pagespeed API
                        const results = await ps.runPagespeedApi(siteURL);

                        testResult['results'].push(results);
                
                        currentTestNum += 1;
        
                        await sleep(10000);
                    };

                    resultsData.push(testResult);

                    saveToJson(resultsData, resultChunkFileName);

                    console.log(`Test completed - Site ID (${hookSiteID}) - Test Elem ID (${currentTestData.elementIndex}) - Elem Type (${currentTestData.elementType})`);

                    // set completed and save test data file
                    currentTestData.elementCompleted = true;
                    currentTestData.elementIndex += 1;

                    console.log(currentTestData);
                    saveToJson(currentTestData, testChunkFileName);
                } else if (!currentTestData.initialized) {
                    console.log(`Initialized - Site ID (${hookSiteID})`);
                    currentTestData.initialized = true;
                    saveToJson(currentTestData, testChunkFileName);
                }
            };
        })
        
        // Start express on the defined port
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

        await startPagespeedEval();
    };
}).catch(err => {
    console.log(err);
});
