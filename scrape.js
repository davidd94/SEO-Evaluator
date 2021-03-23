const scrape = require("website-scraper");
const PuppeteerPlugin = require("website-scraper-puppeteer");
const path = require("path");
const fs = require("fs-extra");

const git = require("./git");


async function scrapeAndDownloadPage(url='', filePath=null) {
    const scrapeDir = path.resolve(__dirname, filePath || 'baseScrapeData');

    // check if scrape dir exists to rm
    fs.access(filePath || "./baseScrapeData", function(error) {
        if (!error) {
            fs.rmdirSync(scrapeDir, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                };
                console.log('Successfully removed old scraped data!');
            });
        };
    });

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
                    // If you set  this to true, the headless browser will show up on screen
                    // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                    headless: false,
                    defaultViewport: null,
                    arguments: [
                        // '--single-process',
                        // '--no-sandbox',
                    ],
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
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
            }
        },
        ignoreErrors: true,
        requestConcurrency: 3, // need to limit this or else scrape hangs due to network being blocked
    }, (error) => {
        console.log(error);
    });

    console.log('Successfully scraped the website!');

    return true;
};

function gitPushScrapeData(folderPath = './baseScrapeData') {
    // delete old repo files
    
    // remove old test repo files
    fs.rmdirSync("../seo-testing", { recursive: true }, (err) => {
        if (err) {
            throw err;
        };
        console.log('Successfully removed old scraped data!');
    });

    // create folder again
    // fs.mkdir("../seo-testing", (err) => {
    //     if (err) {
    //         throw err;
    //     }
    // });

    // copy over new repo files
    fs.copy(folderPath, "../seo-testing", function(err) {
        if (err) {
            throw err;
        };
        console.log('Copied files over to repo.');

        // copy over .git folder
        fs.copy("./tmp/.git", "../seo-testing/.git", function(err) {
            if (err) {
                throw err;
            };
            console.log('Copied .git folder to test repo');

            // run script to auto push new files to git
            git.gitPush();
        
            // copy over new .git folder
            fs.copy("../seo-testing/.git", "./tmp/.git", function(err) {
                if (err) {
                    throw err;
                };
                console.log('Updated .git folder');
            });
        });
    });

    return true;
}

exports.scrapeAndDownloadPage = scrapeAndDownloadPage;
exports.gitPushScrapeData = gitPushScrapeData;
