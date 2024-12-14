# OPACA Interpreter Agent

The actual BPMN Editor and integrated interpreter are wrapped inside an OPACA Agent, allowing multiple BPMN diagrams to be deployed via OPACA actions, with the interpreter running in "headless" mode via [Puppeteer](https://github.com/puppeteer/puppeteer), but also allowing the user to inspect the running processes using an interactive view on the editor.


## Interpreter Agent

The "agent" is defined in [`opaca-bpmn-editor`](../opaca-bpmn-editor). It mostly consists of three parts: A "puppeteer" running the actual BPMN-js Editor and Interpreter; a HTTP server providing the routes expected from the OPACA Agent Container API; and some code connecting the latter with the former. The agent does not have an actual "agent life cycle" on its own, since it only needs to provide the API while the interpreter does the actual execution.


## Actions

The interpreter agent provides the following actions for deploying and interacting with BPMN diagrams:

- **CreateInstance**: Open another interpreter instance. Parameters:
  - `width` (integer): Width of display port (for inspection)
  - `height` (integer): Height of display port (for inspection)
- **GetInstances**: Get the ids of all running interpreter instances
- **CloseInstance**: Close an interpreter instance. Parameters:
  - `id` (string): the interpreter id returned by **CreateInstance**
- **LoadDiagram**: Send a BPMN diagram to the interpreter to be executed. Parameters:
  - `id` (string): the interpreter id 
  - `diagram` (string): the full JSON-escaped XML string
- **StartSimulation**: Start the simulation for the specified interpreter instance. Parameters:
  - `id` (string): the interpreter id
  - `waitToFinish` (boolean): Only send response, when simulation finished.
- **CreateLoadStart**: Combines **CreateInstance**, **LoadDiagram** and **StartSimulation**. Parameters:
  - `diagram` (string): the full JSON-escaped XML string
  - `waitToFinish` (boolean): Only send response, when simulation finished.
- **PauseSimulation**: Pause the specified process. Parameters:
  - `id` (string): the interpreter id
- **ResumeSimulation**: Resume the specified process. Parameters:
  - `id` (string): the interpreter id
- **ResetSimulation**: Stop the specified process. Parameters:
  - `id` (string): the interpreter id
- **SendMessage**: Send a message to the interpreter, for triggering a Message (Start) Event. Parameters:
  - `id` (string): the interpreter id
  - `messageType` (string)
  - `messageContent` (string)
    
## Inspection

To facilitate debugging and monitoring of the running processes, remote debugging is enabled through Chromium's DevTools. The inspection feature provides an interactive insight into the virtual browser environment controlled by Puppeteer. You can open an instance in your local browser under `http://localhost:9222/devtools/inspector.html?ws=localhost:9222/devtools/page/<id>`, where `id` is the interpreter id.
