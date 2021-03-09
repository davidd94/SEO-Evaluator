const { saveToJson, readJson, sleep, exposeModuleMethods } = require('./utils');
const puppeteer = require("puppeteer");

(async () => {
    var browser = await puppeteer.launch({
        // executablePath: '/Users/davidduong/nwjs-sdk-v0.51.1-osx-x64/nwjc.app',
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
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1');

    await page.setViewport({
        width: 375,
        height: 667,
        isMobile: true
    });

    await page.exposeFunction('require', async (moduleName) => {
        await exposeModuleMethods(page, moduleName);
    });

    // make the Page require "fs" native module
    await page.evaluate(async (moduleName) => await require(moduleName), 'fs');

    await page.evaluate(async (moduleName) => {
        // save a file on the current directory named "mod2.js"
        await window[moduleName]['writeFileSync']('./mod2.js', 'any text');
        // read the file "mod2.js"
        const mod2 = await window[moduleName]['readFileSync']('./mod2.js', { encoding: 'utf8' });
        // log it's content
        console.log(JSON.stringify(mod2, null, 2));
        // delete the file
        await window[moduleName]['unlinkSync']('./mod2.js');
    }, 'fs');

    browser.close();
})();
