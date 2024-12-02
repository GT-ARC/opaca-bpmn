# OPACA Interpreter Agent

The actual BPMN Editor and integrated interpreter are wrapped inside an OPACA Agent, allowing multiple BPMN diagrams to be deployed via OPACA actions, with the interpreter running in "headless" mode via [Puppeteer](https://github.com/puppeteer/puppeteer), but also allowing the user to inspect the running processes using a read-only view on the editor.


## Interpreter Agent

The "agent" is defined in [`opaca-bpmn-editor`](../opaca-bpmn-editor). It mostly consists of three parts: A "puppeteer" running the actual BPMN-js Editor and Interpreter; a HTTP server providing the routes expected from the OPACA Agent Container API; and some code connecting the latter with the former. The agent does not have an actual "agent life cycle" on its own, since it only needs to provide the API while the interpreter does the actual execution.


## Actions

The interpreter agent provides the following actions for deploying and interacting with BPMN diagrams:

- **CreateInstance**: Open another interpreter instance
- **GetInstances**: Get the ids of all running interpreter instances
- **CloseInstance**: Close an interpreter instance. Parameters:
  - `id` (string): the interpreter id returned by **CreateInstance**
- **LoadDiagram**: Send a BPMN diagram to the interpreter to be executed. Parameters:
  - `id` (string): the interpreter id 
  - `diagram` (string): the full JSON-escaped XML string
- **StartSimulation**: Start the simulation for the specified interpreter instance. Parameters:
  - `id` (string): the interpreter id
- **CreateLoadStart**: Combines **CreateInstance**, **LoadDiagram** and **StartSimulation**. Parameters:
  - `diagram` (string): the full JSON-escaped XML string
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
    
## Refactoring

Note that the Interpreter Agent is currently being refactored in order to allow the execution of multiple diagrams at once in "virtual" editors/interpreters, also allowing the inspection of running processes in a read-only interpreter view. This is currently work-in-progress. The above action can therefore change significantly in the next time.
