const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors')
const puppeteer = require('puppeteer');
const http = require('http');

const app = express();

dotenv.config();

const EXAMPLE = 'modeler'
const PORT = 8082;

app.use(express.json());
app.use(cors({origin: 'http://localhost:8080'}));

function getImage() {
    const filePath = path.join(__dirname, `${EXAMPLE}-image.json`);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getContainer() {
    const filePath = path.join(__dirname, `${EXAMPLE}-container.json`);
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
        console.log("SENDING STATUS");
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

// Only 1 instance for now TODO
var page;
var browser;

//// Open editor in headless browser ////

(async () => {
    // Launch Puppeteer in headless mode
    browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for running as root in Docker
    })
    // Use default blank page
    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();

    //TODO would be nice to have this scale to device fully
    // Not needed here, but at inspection
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

    // Load a BPMN diagram from file (adjust file path as needed)
    const bpmnFilePath = path.resolve(__dirname, '../resources/examples/exclusive_gateway_test.bpmn');
    const bpmnXml = fs.readFileSync(bpmnFilePath, 'utf-8');
    // TODO remove test diagram, set up actual endpoints

    // Pass BPMN XML
    const loadResult = await page.evaluate(async (bpmnXml) => {
        return await window.loadDiagram(bpmnXml);
    }, bpmnXml);

    console.log("Load Result:", loadResult);

    /*
    const simulation = await page.evaluate(async () => {
        return await window.startSimulation();
    })
    console.log(simulation);

     */

    // Close the browser
    //await browser.close();
})();

// Create an HTTP server
const server = http.createServer(app);

// Handle server errors
server.on('error', (error) => {
    console.error('HTTP Server error:', error);
});
// Handle server listening event
server.listen(PORT, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

//// Modeler Actions ////
// TODO later pass ids to get the right modeler instance

async function invokeAgentAction(action, agentId, parameters) {
    return new Promise(async(resolve, reject) => {

        if (action === 'LoadDiagram') {
            const loadResult = await page.evaluate(async (bpmnXml) => {
                return await window.loadDiagram(bpmnXml);
            }, JSON.parse(parameters).diagram);
            console.log("Load Result:", loadResult);
            // TODO

        } else if (action === 'StartSimulation') {
            const simulation = await page.evaluate(async () => {
                await window.startSimulation();
            })
            console.log(simulation);
            return resolve("Started Simulation");

        } else if (action === 'InspectModeler') {
            // Launch Puppeteer in headful mode
            puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            })
                .then(async (browser) => {
                    const page = await browser.newPage();
                    // Navigate to the modeler
                    await page.goto('http://localhost:8080');
                    // TODO

                    return resolve('Headful browser launched for inspection.');
                })
                .catch((error) => {
                    reject(new Error(`Failed to launch headful browser: ${error.message}`));
                });

        } else if (action === 'PauseSimulation'){
            const pauseResult = await page.evaluate(async () => {
                await window.pauseSimulation();
            })
            console.log(pauseResult);
            return resolve("Paused Simulation");

        } else if (action === 'ResumeSimulation'){
            const resumeResult = await page.evaluate(async () => {
                await window.resumeSimulation();
                return resolve("Resumed Simulation");
            })
            console.log(resumeResult);

        } else if (action === 'ResetSimulation'){
            const resetResult = await page.evaluate(async () => {
                await window.resetSimulation();
                return resolve("Reset Simulation");
            })
            console.log(resetResult);

        } else if (action === 'SendMessage'){
            const messageResult = await page.evaluate(async () => {
                await window.sendMessage(parameters);
                return resolve("Send Message");
            })
            console.log(messageResult);

        } else if (action === 'CloseModeler') {
            await browser.close();
            // TODO later also remove ref to page
            return resolve('Closed this tab.');
        } else {
            return reject(new Error('Action not found.'));
        }
    });
}
