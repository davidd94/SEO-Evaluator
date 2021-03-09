const lh = require('./lighthouse');
const scraper = require('./scrape');
const arg = require('arg');
const inquirer = require('inquirer');
const fs = require("fs-extra");

// run script here
function ParseCliArgsIntoOptions() {
    const args = arg(
        {
            '--url': String,
            '--mode': String,
            '-u': '--url',
            '-m': '--mode',
        },
        {
            argv: process.argv.slice(2),
        }
    );
    return {
        url: args['--url'] || false,
        mode: args['--mode'] || false,
    };
};

async function PromptForOptions(options) {
    const questions = [];

    if (!options.url) {
        questions.push({
            type: 'string',
            name: 'url',
            message: 'Enter the URL you wish to scrape from. Please include the trailing slash at the end.',
        });
    };
    if (!options.mode) {
        questions.push({
            type: 'string',
            name: 'mode',
            message: 'Enter SEO evaluation mode',
        });
    };

    const answers = await inquirer.prompt(questions);
    
    return {
        ...options,
        url: options.url || answers.url,
        mode: options.mode || answers.mode,
    };
};

async function runScraper() {
    // CLI options
    let options = ParseCliArgsIntoOptions();
    options = await PromptForOptions(options);
    if (options.url) {
        // downloads website
        await scraper.startScrape(options.url);
    };
    if (options.mode) {
        // save seo eval mode as file
        let mode = JSON.stringify({
            evaluate: options.mode,
        });
        fs.writeFileSync('mode.json', mode);
    };
};


runScraper();
