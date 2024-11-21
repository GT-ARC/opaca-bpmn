# Simulation
## Token Simulation
This editor uses [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation/tree/main), which is an extension for bpmn-js. It allows for the simulation of bpmn processes using tokens, which represent the flow of work. Events defined in a process have to be triggered manually and sequence flows after a gateway have to be set in advance for the simulation to work.

When a loaded diagram is not marked as executable (under process -> general) this will be the default behavior.
## Interpretation
While most of it is original, we applied a [patch](../opaca-bpmn-editor/patches) to bpmn-js-token-simulation to use some custom behaviors and settings, like gateway-settings. You can find them in [simulation](../opaca-bpmn-editor/src/simulation). The result is a simulator that automates some of the events and sets sequence flows based on conditions in real time. Evaluating assignments, keeping track of variable values, making service calls and creating input dialogs for user tasks, happens in [simulation/util.js](../opaca-bpmn-editor/src/simulation/util.js). Triggering of timer events is handled in [app.js](../opaca-bpmn-editor/src/app.js).
## Interpreter Agent
When you start the project in a Docker Container and connect to the OPACA RP, this "interpreter-agent" provides following actions: 
- **LoadDiagram**
    - **Parameters**:
        - `diagram` (escaped XML string)
    - **Result**: void

- **StartSimulation**
    - **Parameters**: None
    - **Result**: void

- **PauseSimulation**
    - **Parameters**: None
    - **Result**: void

- **ResumeSimulation**
    - **Parameters**: None
    - **Result**: void

- **ResetSimulation**
    - **Parameters**: None
    - **Result**: void

- **SendMessage**
    - **Parameters**:
        - `messageType` (string)
        - `messageContent` (string)
    - **Result**: void