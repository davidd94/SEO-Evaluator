const scrape = require("website-scraper");
const PuppeteerPlugin = require("website-scraper-puppeteer");
const path = require("path");
const fs = require("fs-extra");
const { exec } = require('child_process');

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

    fs.ensureDir(projectDir + '/baseScrapeData1', err => {
        if (err) {
            throw err;
        }
        fs.copy(scrapeDir, './baseScrapeData1');
    });
    console.log('Copied files to Chunk 1');
    fs.ensureDir(projectDir + '/baseScrapeData2', err => {
        if (err) {
            throw err;
        }
        fs.copy(scrapeDir, './baseScrapeData2');
    });
    console.log('Copied files to Chunk 2');
    fs.ensureDir(projectDir + '/baseScrapeData3', err => {
        if (err) {
            throw err;
        }
        fs.copy(scrapeDir, './baseScrapeData3');
    });
    console.log('Copied files to Chunk 3');

    return true;
};

async function gitPushScrapeData(repoID) {
    const scrapeDir = `${projectDir}/baseScrapeData${repoID}`;
    const gitDir = projectDir + `/../seo-testing${repoID}`;

    // remove old repo files, dir persist
    try {
        await fs.emptyDir(gitDir);
        console.log(`Removed old repo files for repo ID: ${repoID}`);
    } catch (err) {
        console.log(err);
    };

    // copy new files over to repo
    try {
        await fs.copy(scrapeDir, gitDir);
        console.log(`Copied new files over to repo ID: ${repoID}`);
    } catch (err) {
        console.log(err);
    };

    // run script to auto push new files to git
    console.log('Pushing new files to git...');
    await exec(`sh git-push.sh -a${repoID}`, (err, stdout, stderr) => {
        if (err) {
            console.log(`error: ${err.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });

    return true;
}

exports.scrapeAndDownloadPage = scrapeAndDownloadPage;
exports.gitPushScrapeData = gitPushScrapeData;
