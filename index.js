// Require express and body-parser
const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const fs = require("fs-extra");

const ps = require("./pagespeed");
const scraper = require("./scrape");
const { saveToJson, readJson, saveReportAsJson } = require('./utils');
const { timestamp } = require("./settings");

// Initialize express and define a port
const app = express()
const PORT = 8080

// Setup env vars
dotenv.config();

// Tell express to use body-parser's JSON parsing
app.use(bodyParser.json())

// Routes
app.post("/hook", async (req, res) => {
    // Call your action on the request
    if (req.body['state'] === 'ready') {
        const testFileName = process.env.TEST_FILE_NAME;
        const maxTestNum = process.env.NUM_OF_PAGESPEED_TESTS;
        let currentTestData = await readJson(testFileName);
        let currentTestNum = 1;

        // run test X amount and record
        while (currentTestNum <= maxTestNum) {
            console.log('running test: ' + currentTestNum);
            // run pagespeed API
            const results = await ps.runPagespeedApi();
    
            // record results
            saveReportAsJson(`lh-report-elementID-${currentTestData.elementNum}-test-${currentTestNum}`, results, timestamp);
    
            currentTestNum += 1;
        };

        // set completed and save test data file
        currentTestData.completed = true;
        saveToJson(currentTestData, testFileName);
        console.log('Test completed! Starting next element test soon...');

        res.status(200).end(); // Responding is important for webhook events
    };
    res.status(400).end(); // Responding is important for webhook events
})

app.get("/test", (req, res) => {
    console.log("TEST");
    res.status(200).end();
})

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

async function startPagespeedEval() {
    const results = await ps.pagespeedEvaluation();
    if (!results) {
        console.log(results);
    };
    console.log('finished evaluating pagespeed...');
};

// startPagespeedEval();
