const fs = require("fs-extra");
const path = require("path");
const { exec } = require('child_process');

const projectDir = path.dirname(require.main.filename);

async function forcePushScrapeData(repoID) {
    const scrapeDir = `${projectDir}/baseScrapeData`;
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
    console.log('Pushing init files to git...');
    exec(`sh git-force-push-init.sh -a${repoID}`, (err, stdout, stderr) => {
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

async function pushElemChange(repoID) {
    // run script to auto push new files to git
    console.log(`Pushing latest element changes to git ${repoID}...`);
    exec(`sh git-push-element-update.sh -a${repoID}`, (err, stdout, stderr) => {
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

exports.forcePushScrapeData = forcePushScrapeData;
exports.pushElemChange = pushElemChange;
