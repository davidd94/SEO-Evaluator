// Require express and body-parser
const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const { ExcelWorkbook } = require('./excel');
const ps = require("./pagespeed");
const scraper = require("./scrape");
const { saveToJson, readJson, saveReportAsJson, sleep } = require('./utils');

// Setup env vars
dotenv.config();

async function initPagespeedEval() {
    const scrapeResults = await scraper.scrapeAndDownloadPage().then(() => {
        return scraper.gitPushScrapeData();
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
                const maxTestNum = process.env.NUM_OF_PAGESPEED_TESTS;
                let currentTestData = await readJson(testFileName);
                console.log(`Current test elem (ID: ${currentTestData.elementNum}): ${currentTestData.elementType}`);
                if (currentTestData.elementNum >= 0) {
                    let currentTestNum = 1;

                    // create excel
                    const workbook = new ExcelWorkbook(
                        fileId=currentTestData.elementNum,
                        creator='DavidDee',
                        testData=currentTestData,
                    );
                    await workbook.initWorkbook();

                    // init new section for elem
                    workbook.addNewSection(currentTestData.elementType, currentTestData.elementSrc);

                    // run test X amount and record
                    while (currentTestNum <= maxTestNum) {
                        console.log(`Running PageSpeed API test: ${currentTestNum}`);
        
                        // run pagespeed API
                        const results = await ps.runPagespeedApi();
                        
                        // add test col #
                        workbook.addDataRow([currentTestNum]);
                        
                        // add data
                        const row = [];
                        Object.values(results).forEach((result) => {
                            row.push(result.score);
                            row.push(result.displayValue);
                            row.push(result.numericValue);
                        });
                        workbook.addDataRow(row);

                        // save to excel
                        await workbook.saveWorkbookAsFile();
                
                        currentTestNum += 1;
        
                        await sleep(3000);
                    };

                    console.log(`Test completed for (ID: ${currentTestData.elementNum}): ${currentTestData.elementType}!`);
                    
                    if (currentTestData.analysisCompleted) {
                        currentTestData.endTime = new Date().toTimeString();
                        console.log('PageSpeed Analysis completed!');
                    } else {
                        console.log('Starting next element test soon...');
                    };

                    // set completed and save test data file
                    currentTestData.elementCompleted = true;
                    console.log(currentTestData);
                    saveToJson(currentTestData, testFileName);
                } else if (currentTestData.elementNum === -1) {
                    currentTestData.elementNum = 0;
                    saveToJson(currentTestData, testFileName);
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
