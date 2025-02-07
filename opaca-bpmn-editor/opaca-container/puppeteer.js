const puppeteer = require('puppeteer');

// Keep track of browser tabs
const instances = new Map();
var browser;

//// Open editor in headless browser ////
(async () => {
    // Launch Puppeteer in headless mode
    browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox',
            '--disable-setuid-sandbox',
            '--remote-debugging-address=0.0.0.0',
            '--remote-debugging-port=9222',
            '--remote-allow-origins=*',
            '--window-size=1920,1080'
        ],
    })

    console.log('Opened browser.');
})();

//// Modeler Actions ////
async function invokeAgentAction(action, agentId, parameters) {
    return new Promise(async(resolve, reject) => {
        // check for process, when id is passed
        if(parameters.id && !instances.get(parameters.id)){
            return reject(new Error(`There is no process with id ${parameters.id}.`));
        }

        if (action === 'CreateInstance') {
            const width = parameters.width || 1920;
            const height = parameters.height || 1080;

            // Create a new instance
            const newPage = await openModelerInstance(width, height);

            // Store page in map
            const id = newPage.target()._targetId;
            instances.set(id, newPage);

            return resolve(id);

        } else if (action === 'GetInstances') {
            const ids = Array.from(instances.keys());

            if(ids.length>0){
                return resolve(ids);
            }
            return reject('There are no running instances.')

        } else if (action === 'LoadDiagram') {
            const page = instances.get(parameters.id);
            const loadResult = await page.evaluate(async (bpmnXml) => {
                // Return from browser context to node (loadResult)
                return await window.loadDiagram(bpmnXml);
            }, parameters.diagram)

            if(loadResult==='ok'){
                return resolve();
            }
            return reject(new Error(loadResult));

        } else if (action === 'StartSimulation') {
            const page = instances.get(parameters.id);
            const startResult = await page.evaluate(async (waitToFinish) => {
                // Return from browser context to node (simulation)
                return await window.startSimulation(waitToFinish);
            }, parameters.waitToFinish)

            if(startResult==='ok'){
                return resolve();
            }
            return reject(new Error(startResult));

        } else if (action === 'CreateLoadStart') {

            // Create a new instance
            const newPage = await openModelerInstance();

            // Store the new page in map
            const id = newPage.target()._targetId;
            instances.set(id, newPage);

            // Load the diagram
            const loadResult = await newPage.evaluate(async (bpmnXml) => {
                return await window.loadDiagram(bpmnXml);
            }, parameters.diagram);

            if(loadResult!=='ok'){
                return reject(new Error(`Error loading diagram: ${loadResult}`));
            }

            // Start the simulation
            const startResult = await newPage.evaluate(async (waitToFinish) => {
                return await window.startSimulation(waitToFinish);
            }, parameters.waitToFinish);

            if(startResult!=='ok'){
                return reject(new Error(`Error starting simulation: ${startResult}`));
            }

            return resolve(id);

        } else if (action === 'PauseSimulation'){
            const page = instances.get(parameters.id);
            const pauseResult = await page.evaluate(async () => {
                return await window.pauseSimulation();
            })

            if(pauseResult==='ok'){
                return resolve();
            }
            return reject(new Error(pauseResult));

        } else if (action === 'ResumeSimulation'){
            const page = instances.get(parameters.id);
            const resumeResult = await page.evaluate(async () => {
                return await window.resumeSimulation();
            })

            if(resumeResult==='ok'){
                return resolve();
            }
            return reject(new Error(resumeResult));

        } else if (action === 'ResetSimulation'){
            const page = instances.get(parameters.id);
            const resetResult = await page.evaluate(async () => {
                return await window.resetSimulation();
            })

            if(resetResult==='ok'){
                return resolve();
            }
            return reject(new Error(resetResult));

        } else if (action === 'SendMessage') {
            if (parameters.id) {
                // Send to a specific instance
                const page = instances.get(parameters.id);

                const messageResult = await page.evaluate(async (messageReference, messageContent) => {
                    return await window.sendMessage(messageReference, messageContent);
                }, parameters.messageReference, parameters.messageContent);

                if (messageResult === 'ok') {
                    return resolve();
                }
                return reject(new Error(messageResult));

            } else {
                // Send to all instances
                const results = await Promise.allSettled(
                    Array.from(instances.values()).map(async (page) => {
                        return page.evaluate(async (messageReference, messageContent) => {
                            return await window.sendMessage(messageReference, messageContent);
                        }, parameters.messageReference, parameters.messageContent);
                    })
                );

                const errors = results.filter(result => result.status === 'rejected');
                if (errors.length > 0) {
                    return reject(new Error(`Failed to send message to some instances: ${errors.map(e => e.reason).join(', ')}`));
                }
                return resolve();
            }
        } else if (action === 'SendSignal') {
            if (parameters.id) {
                // Send to a specific instance
                const page = instances.get(parameters.id);

                const signalResult = await page.evaluate(async (signalReference) => {
                    return await window.sendSignal(signalReference);
                }, parameters.signalReference);

                if (signalResult === 'ok') {
                    return resolve();
                }
                return reject(new Error(signalResult));

            } else {
                // Send to all instances
                const results = await Promise.allSettled(
                    Array.from(instances.values()).map(async (page) => {
                        return page.evaluate(async (signalReference) => {
                            return await window.sendSignal(signalReference);
                        }, parameters.signalReference);
                    })
                );

                const errors = results.filter(result => result.status === 'rejected');
                if (errors.length > 0) {
                    return reject(new Error(`Failed to send signal to some instances: ${errors.map(e => e.reason).join(', ')}`));
                }
                return resolve();
            }
        }
        else if (action === 'CloseInstance') {
            const page = instances.get(parameters.id);

            // Check if this is the last instance being closed
            if (instances.size === 1) {
                // Open a blank page to keep the browser alive
                const blankPage = await browser.newPage();
                await blankPage.goto('about:blank');
            }

            await page.close();
            instances.delete(parameters.id);

            return resolve();

        } else {
            return reject(new Error('Action not found.'));
        }
    });
}

// Helper
async function openModelerInstance(portWidth, portHeight){

    const pages = await browser.pages();
    // Use the existing blank page if no instances exist, otherwise create a new page
    const newPage = (instances.size === 0 && pages[0]) ? pages[0] : await browser.newPage();

    await newPage.setViewport({ width: portWidth, height: portHeight });

    // Navigate to the modeler
    await newPage.goto(`http://localhost:8080`, { waitUntil: 'domcontentloaded' });

    // Redirect console messages from the page to the Node.js console
    newPage.on('console', (msg) => {
        for (let i = 0; i < msg.args().length; ++i) {
            console.log(`PAGE LOG: ${msg.args()[i]}`);
        }
    });

    return newPage;
}

module.exports = { invokeAgentAction };
