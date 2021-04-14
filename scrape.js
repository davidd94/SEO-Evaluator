const scrape = require("website-scraper");
const PuppeteerPlugin = require("website-scraper-puppeteer");
const path = require("path");
const fs = require("fs-extra");

const git = require("./git");

const projectDir = path.dirname(require.main.filename);

async function scrapeAndDownloadPage(url=null, filePath=null) {
    const scrapeDir = projectDir + ('/baseScrapeData' || filePath);

    // remove old scrape files, dir persist and created if doesn't exist
    try {
        // await fs.emptyDir(scrapeDir);
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
                    // If you set  this to true, the headless browser will show up on screen
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
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
            }
        },
        ignoreErrors: true,
        requestConcurrency: 3, // need to limit this or else scrape hangs due to network being blocked
    }, (error) => {
        if (error) console.log(error);
    });

    console.log('Successfully scraped the website!');

    return true;
};

async function gitPushScrapeData(folderPath = '/baseScrapeData') {
    const scrapeDir = projectDir + folderPath;
    const gitDir = projectDir + '/../seo-testing';
    const tmpDir = projectDir + '/tmp/.git';

    // remove old repo files, dir persist
    try {
        await fs.emptyDir(gitDir);
        console.log('Removed old repo files');
    } catch (err) {
        console.log(err);
    };

    // copy new files over to repo
    try {
        await fs.copy(scrapeDir, gitDir);
        console.log('Copied new files over to repo');
    } catch (err) {
        console.log(err);
    };

    // copy over .git folder
    try {
        await fs.copy(tmpDir, gitDir + '/.git');
        console.log('Copied tmp .git folder to repo');
    } catch (err) {
        console.log(err);
    };

    // run script to auto push new files to git
    await git.gitPush();
    console.log('Pushing new files to git...');

    // copy over new .git folder
    try {
        await fs.copy(gitDir + '/.git', tmpDir);
        console.log('Updated .git folder to tmp');
    } catch (err) {
        console.log(err);
    };

    return true;
}

exports.scrapeAndDownloadPage = scrapeAndDownloadPage;
exports.gitPushScrapeData = gitPushScrapeData;
