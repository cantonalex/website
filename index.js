const Wappalyzer = require('wappalyzer');
const readCsv = require('./csv').readCsv;
const fs = require('fs');
var os = require("os");
const { join } = require('path')

console.time("process")
process.on('exit', function () {
    console.timeEnd("process")
});
const options = {
    batchSize: 10,
    debug: false,
    delay: 500,
    maxDepth: 3,
    maxUrls: 10,
    maxWait: 30000,
    recursive: true,
    extended: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
}
var rampUpPoolScale = 10;
var rampUpTime = 2000;

readCsv(join(__dirname, '/urls.csv')).then(async (urls) => {
    try {
        var counter = 0, i = 0;
        var jobInterval = setInterval(async () => {
            analyze_url(urls.slice(counter, counter + rampUpPoolScale), i++)
            counter += rampUpPoolScale;
            if (counter >= urls.length)
                clearInterval(jobInterval);
        }, rampUpTime)
    } catch (error) {
        console.error(error)
    }
});

var analyze_url = async function (urls, init) {
    console.log("Chormium instance # " + init + " started")
    console.time("batch" + init)
    var wappalyzer = undefined;
    try {
        wappalyzer = new Wappalyzer(options);
        await wappalyzer.init();

        let results = await Promise.all(
            urls.map(async (url) => {
                return {
                    url,
                    results: await wappalyzer.open(url).analyze()
                }
            })
        )
        pushToFile(results);
        console.timeEnd("batch" + init)

        await wappalyzer.destroy();
        console.log("Chromium Instance number " + init + " destroyed")
        console.log("+++++++++++++++++++++++++++++++++++++++++++++")
    }
    catch (ex) {
        if (wappalyzer) {
            console.log("Unable to destroy Chromium Instance number " + init + ". Going to try again")
            console.log("************************************************************************************")
            await wappalyzer.destroy();
            console.log("Chromium Instance number " + init + " destroyed now")
            console.log("************************************************************************************")
        }
        console.error(ex)
    };
}

var pushToFile = async function (results) {
    results.forEach(result => {
        fs.appendFile(join(__dirname, "/output.csv"), JSON.stringify(result.url) + ", " + JSON.stringify(result.results.technologies) + os.EOL, (err) => {
            if (err) console.log(err);
        });
    });
}