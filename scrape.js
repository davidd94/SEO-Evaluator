const scrape = require("website-scraper");
const PuppeteerPlugin = require("website-scraper-puppeteer");
const path = require("path");
const fs = require("fs-extra");

const projectDir = path.dirname(require.main.filename);

async function scrapeAndDownloadPage(url=null) {
    const scrapeDir = `${projectDir}/baseScrapeData`;

    // remove old scrape files, dir persist and created if doesn't exist
    try {
        await fs.rmdir(scrapeDir, { recursive: true });
        console.log('Removed old scrape files');
    } catch (err) {
        console.log(err);
    };

    await scrape({
        // Provide the URL(s) of the website(s) that you want to clone
        // In this example, you can clone the Our Code World website
        urls: [url || process.env.PAGE_URL],
        // Specify the path where the content should be saved
        // In this case, in the current directory inside the dir
        directory: scrapeDir,
        // Load the Puppeteer plugin
        plugins: [ 
            new PuppeteerPlugin({
                launchOptions: { 
                    // If you set this to false, the headless browser will show up on screen
                    // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                    headless: false,
                    defaultViewport: null,
                },
                // scrollToBottom: {
                //     timeout: 30000,
                //     viewportN: 10
                // },
                blockNavigation: true,
            })
        ],
        request: {
            headers: {
                'Accepted-Language': 'en-US,en;q=0.9',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
            }
        },
        ignoreErrors: true,
        requestConcurrency: 1, // need to limit this or else scrape hangs due to network being blocked
    }, (error) => {
        if (error) console.log(error);
    });

    console.log('Successfully scraped the website!');

    return true;
};

exports.scrapeAndDownloadPage = scrapeAndDownloadPage;
