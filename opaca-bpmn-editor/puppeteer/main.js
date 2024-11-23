const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors')
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

const app = express();

dotenv.config();

const PORT = 8082;

app.use(express.json());
app.use(cors({origin: 'http://localhost:8080'}));

function getImage() {
    const filePath = path.join(__dirname, 'modeler-image.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getContainer() {
    const filePath = path.join(__dirname, 'modeler-container.json');
    const container = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const now = new Date().toISOString().replace(/\d+$/, '000Z');
    return {
        ...container,
        image: getImage(),
        containerId: process.env.CONTAINER_ID,
        owner: process.env.OWNER,
        runningSince: now
    };
}

//// OPACA Routes ////

app.get('/info', (req, res) => {
    res.json(getContainer());
});

app.get('/agents', (req, res) => {
    res.json(getContainer().agents);
});

app.get('/agents/:agentId', (req, res) => {
    const agentId = req.params.agentId;
    const agent = getContainer().agents.find(agent => agent.agentId === agentId);
    res.json(agent || {});
});

app.post('/send/:agentId', (req, res) => {
    const agentId = req.params.agentId;
    const message = req.body;
    console.log(`SEND ${agentId} ${JSON.stringify(message)}`);
    res.sendStatus(200);
});

app.post('/invoke/:action', async (req, res) => {
    const action = req.params.action;
    const parameters = req.body;

    console.log('action', action);
    console.log('parameters', parameters);

    try {
        const result = await invokeAgentAction(action, null, parameters);
        res.status(200).json(result);
    } catch (error) {
        var code = 500;
        if(error.message==='Action not found.'){
            code = 404;
        }
        res.status(code).json({ error: error.message });
    }
});

app.post('/invoke/:action/:agentId', async (req, res) => {
    const action = req.params.action;
    const agentId = req.params.agentId;
    const parameters = req.body;

    // Is there an agent with this id
    if(!getContainer().agents.find(agent => agent.id === agentId)){
        res.status(404).json({error: 'Agent not found.'});
        return;
    }

    try {
        const result = await invokeAgentAction(action, agentId, parameters);
        res.status(200).json(result);
    } catch (error) {
        var code = 500;
        if(error.message==='Action not found.'){
            code = 404;
        }
        res.status(code).json({ error: error.message });
    }
});

app.post('/broadcast/:channel', (req, res) => {
    const channel = req.params.channel;
    const message = req.body;
    console.log(`BROADCAST ${channel} ${JSON.stringify(message)}`);
    res.sendStatus(200);
});

const instances = new Map();
var browser;

//// Open editor in headless browser ////

(async () => {
    // Launch Puppeteer in headless mode
    browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        //executablePath: '/usr/bin/chromium',
        // Required for running as root in Docker
        args: ['--no-sandbox', //'--disable-setuid-sandbox',
            '--remote-debugging-address=0.0.0.0',
            '--remote-debugging-port=9222',
            '--remote-allow-origins=*'
            //'--user-data-dir=/tmp/chrome'
        ],
    })

    //const browserWSEndpoint = browser.wsEndpoint();
    //console.log(`DevTools WebSocket URL: ${browserWSEndpoint}`);

    // Use default blank page
    /*
    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();

    // For debugging (headful)
    await page.setViewport({
        width: 1400,
        height: 875,
        deviceScaleFactor: 2,
    });


    // Redirect console messages from the page to the Node.js console
    page.on('console', (msg) => {
        for (let i = 0; i < msg.args().length; ++i) {
            console.log(`PAGE LOG: ${msg.args()[i]}`);
        }
    });

    // Open modeler
    await page.goto(`http://localhost:8080`, { waitUntil: 'domcontentloaded' });

     */

    console.log('Opened browser.');
})();

// Handle server listening event
app.listen(PORT, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

//// Modeler Actions ////
// TODO later pass ids to get the right modeler instance

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
            const ids = instances.keys()
            return resolve(`Running instances: ${ids}`);

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
            await page.close();
            instances.delete(parameters.id);

            return resolve('Closed this tab.');

        } else {
            return reject(new Error('Action not found.'));
        }
    });
}
