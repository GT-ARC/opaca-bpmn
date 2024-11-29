const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();
const { invokeAgentAction } = require('./puppeteer');


app.use(express.json());

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

module.exports = app;
