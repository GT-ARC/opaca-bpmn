
const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const app = express();

//const {loadDiagram} = require('./bpmnModeler');

dotenv.config();

const EXAMPLE = 'modeler'
const PORT = 8082;

app.use(express.json());

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

/*
app.post('/invoke/:action', (req, res) => {
    const action = req.params.action;
    const parameters = req.body;
    const msg = `INVOKE ${action} with ${JSON.stringify(parameters)}`;
    console.log(msg);
    res.json(msg);
});

app.post('/invoke/:action/:agentId', (req, res) => {
    const action = req.params.action;
    const agentId = req.params.agentId;
    const parameters = req.body;
    const msg = `INVOKE ${action} at ${agentId} with ${JSON.stringify(parameters)}`;
    console.log(msg);
    res.json(msg);
});

 */

app.post('/invoke/:action', async (req, res) => {
    const action = req.params.action;
    const parameters = req.body;

    try {
        const result = await invokeAgentAction(action, null, parameters);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/invoke/:action/:agentId', async (req, res) => {
    const action = req.params.action;
    const agentId = req.params.agentId;
    const parameters = req.body;

    try {
        const result = await invokeAgentAction(action, agentId, parameters);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/broadcast/:channel', (req, res) => {
    const channel = req.params.channel;
    const message = req.body;
    console.log(`BROADCAST ${channel} ${JSON.stringify(message)}`);
    res.sendStatus(200);
});

async function invokeAgentAction(action, agentId, parameters) {
    if (action === 'LoadDiagram') {
        console.log(`INVOKE ${action} at ${agentId} with ${JSON.stringify(parameters)}`);
        //await loadDiagram('./resources/newDiagram.bpmn');
    } else if(action === 'Add'){
        console.log(`INVOKE ${action} at ${agentId} with ${JSON.stringify(parameters)}`);
        return await add(3, 80);
        //await add(parameters.value1, parameters.value2);
    } else {
        const msg = `INVOKE ${action} at ${agentId} with ${JSON.stringify(parameters)}`;
        console.log('in else case ');
        return msg;
    }
}


app.listen(PORT, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
