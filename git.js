const { exec } = require('child_process');


async function gitPush() {
    await exec('sh git-push.sh', (err, stdout, stderr) => {
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
};

exports.gitPush = gitPush;
