# OPACA Agent

WIP...

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