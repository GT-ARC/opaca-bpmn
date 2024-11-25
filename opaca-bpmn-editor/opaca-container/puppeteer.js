const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');


const instances = new Map();
var browser;

//// Open editor in headless browser ////
(async () => {
    // Launch Puppeteer in headless mode
    browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        executablePath: '/usr/bin/chromium',
        // Required for running as root in Docker
        args: ['--no-sandbox', //'--disable-setuid-sandbox',
            '--remote-debugging-address=0.0.0.0',
            '--remote-debugging-port=9222',
            '--remote-allow-origins=*'
            //'--user-data-dir=/tmp/chrome'
        ],
    })

    console.log('Opened browser.');
})();

//// Modeler Actions ////
async function invokeAgentAction(action, agentId, parameters) {
    return new Promise(async(resolve, reject) => {

        if (action === 'CreateInstance') {
            const pages = await browser.pages();
            // Use default blank page for first instance
            const newPage = (instances.size === 0 && pages[0]) ? pages[0] : await browser.newPage();
            // Open modeler on page
            await newPage.goto(`http://localhost:8080`, { waitUntil: 'domcontentloaded' });

            // Redirect console messages from the page to the Node.js console
            newPage.on('console', (msg) => {
                for (let i = 0; i < msg.args().length; ++i) {
                    console.log(`PAGE LOG: ${msg.args()[i]}`);
                }
            });

            // Store page in map
            const id = uuidv4();
            instances.set(id, newPage);

            return resolve(`Opened a modeler instance. ID: ${id}`);

        } else if (action === 'GetInstances') {
            const ids = Array.from(instances.keys());
            return resolve(`Running instances: ${ids.join(', ')}`);
            // TODO Maybe add some info about the simulation state?

        } else if (action === 'LoadDiagram') {
            const page = instances.get(parameters.id);
            const loadResult = await page.evaluate(async (bpmnXml) => {
                // Return from browser context to node (loadResult)
                return await window.loadDiagram(bpmnXml);
            }, parameters.diagram)
            console.log(`LoadDiagram Result: ${loadResult}`);
            return resolve("Diagram loaded.");

        } else if (action === 'StartSimulation') {
            const page = instances.get(parameters.id);
            const startResult = await page.evaluate(async () => {
                // Return from browser context to node (simulation)
                return await window.startSimulation();
            })
            console.log(`StartSimulation Result: ${startResult}`);
            return resolve("Started Simulation");

        } else if (action === 'InspectModeler') {
            // Launch Puppeteer in headful mode TODO
            /*
            puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            })
                .then(async (browser) => {
                    const page = await browser.newPage();
                    // Navigate to the modeler
                    await page.goto('http://localhost:8080');

                    return resolve('Headful browser launched for inspection.');
                })
                .catch((error) => {
                    reject(new Error(`Failed to launch headful browser: ${error.message}`));
                });

             */
            return reject("Inspection not implemented yet.");

        } else if (action === 'PauseSimulation'){
            const page = instances.get(parameters.id);
            const pauseResult = await page.evaluate(async () => {
                return await window.pauseSimulation();
            })
            console.log(`PauseSimulation Result: ${pauseResult}`);
            return resolve("Paused Simulation");

        } else if (action === 'ResumeSimulation'){
            const page = instances.get(parameters.id);
            const resumeResult = await page.evaluate(async () => {
                return await window.resumeSimulation();
            })
            console.log(`ResumeSimulation Result: ${resumeResult}`);
            return resolve("Resumed Simulation");

        } else if (action === 'ResetSimulation'){
            const page = instances.get(parameters.id);
            const resetResult = await page.evaluate(async () => {
                return await window.resetSimulation();
            })
            console.log(`ResetSimulation Result: ${resetResult}`);
            return resolve("Reset Simulation");

        } else if (action === 'SendMessage'){
            const page = instances.get(parameters.id);
            const messageResult = await page.evaluate(async () => {
                return await window.sendMessage(parameters);
            }, parameters.messageType, parameters.messageContent)

            console.log(`SendMessage Result: ${messageResult}`);
            return resolve("Send Message");

        } else if (action === 'CloseInstance') {
            const page = instances.get(parameters.id);

            // Check if this is the last instance being closed
            if (instances.size === 1) {
                // Open a blank page to keep the browser alive
                const blankPage = await browser.newPage();
                await blankPage.goto('about:blank');
            }

            await page.close();
            instances.delete(parameters.id);

            return resolve('Closed this tab.');

        } else {
            return reject(new Error('Action not found.'));
        }
    });
}

module.exports = { invokeAgentAction };
