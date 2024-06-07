const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const app = express();
var webSocketClient = null;

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

app.post('/invoke/:action', async (req, res) => {
    const action = req.params.action;
    const parameters = req.body;

    console.log('action', action);
    console.log('parameters', parameters);

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

// Forward action requests to the modeler
async function invokeAgentAction(action, agentId, parameters) {
    var request = {};

    if (action === 'LoadDiagram') {
        console.log(`INVOKE ${action} at ${agentId} with ${JSON.stringify(parameters)}`);

        request = {
            type: 'loadDiagram',
            parameters
        }
        console.log('request', request);

    } else if(action === 'StartSimulation'){
        console.log(`INVOKE ${action} at ${agentId} with ${JSON.stringify(parameters)}`);

        request = {
            type: 'startSimulation'
        }

    } else {
        const msg = `INVOKE ${action} at ${agentId} with ${JSON.stringify(parameters)}`;
        console.log('action unknown');
        return msg;
    }
    webSocketClient.send(JSON.stringify(request));
}

//// WebSocket to connect to modeler ////

const http = require('http');
const WebSocket = require('ws');

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket server event handlers
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket server');
    webSocketClient = ws;

    ws.on('message', (message) => {
        console.log('Received message from client:', message.toString());
    });

    ws.on('close', () => {
        console.log('Client disconnected from WebSocket server');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Ensure the message is sent only when the connection is open
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({type: 'info', message: 'Hello from server'}));
    } else {
        ws.on('open', () => {
            ws.send('Message from server');
        });
    }
});

// Handle server errors
server.on('error', (error) => {
    console.error('HTTP Server error:', error);
});

// Handle server listening event
server.listen(PORT, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
