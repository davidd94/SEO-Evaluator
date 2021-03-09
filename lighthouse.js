const puppeteer = require("puppeteer");
const _ = require("lodash");
const lighthouse = require("lighthouse");

const { userLogin, urls, timestamp } = require("./settings");


async function getLogs(port=null) {
    const url = process.env.NETLIFY_URL;
    const PORT = port || 9222;
    let browser;

    if (!port) {
        browser = await puppeteer.launch({
            args: [`--remote-debugging-port=${PORT}`],
        });
    };

    const lighthouseOpts = {
        port: PORT,
        disableStorageReset: true,
        logLevel: "info",
        emulatedFormFactor: "none",
    };

    const lighthouseResult = await lighthouse(url, lighthouseOpts);

    const logs = lighthouseResult.lhr;
    const categories = [
        'userAgent',         'environment',
        'lighthouseVersion', 'fetchTime',
        'requestedUrl',      'finalUrl',
        'runWarnings',       'runtimeError',
        'audits',            'configSettings',
        'categories',        
        // 'categoryGroups',
        // 'timing',            'i18n',
        // 'stackPacks'
    ]

    console.log("Performance Score: " + logs.categories.performance.score);

    const audits = logs.audits;
    const performanceAttrs = [
        'first-contentful-paint', 'largest-contentful-paint',
        'first-meaningful-paint', 'load-fast-enough-for-pwa',
        'speed-index', 'total-blocking-time',
        'max-potential-fid', 'cumulative-layout-shift',
        'interactive', 
    ]

    const results = _.map(audits, (section) => {
        if (_.indexOf(performanceAttrs, section.id) !== -1) {
            console.log(`${section.title} => ${section.numericValue} ${section.numericUnit} < ${section.score * 100} score >`);
            return section;
        };
    });

    console.log('Audit analysis ending...');

    if (!port && browser) {
        await browser.close();
    };

    return results;
};

async function authenticate(browser, signinUrl) {
    const page = await browser.newPage();
    await page.goto(signinUrl);

    const emailInput = await page.$("input[id='email-login']");
    await emailInput.type(userLogin.email);
    await page.click("button[id='submit']");
    await page.waitForNavigation();

    await page.close();
};

exports.getLogs = getLogs;
