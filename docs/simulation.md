# Simulation
## Token Simulation
This editor uses [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation/tree/main), which is an extension for bpmn-js. It allows for the simulation of bpmn processes using tokens, which represent the flow of work. Events defined in a process have to be triggered manually and sequence flows after a gateway have to be set in advance for the simulation to work.
## Interpretation
While most of it is original, we applied a [patch](../patches) to bpmn-js-token-simulation to use some custom behaviors and settings, like gateway-settings. You can find them in [simulation](../src/simulation). The result is a simulator that automates some of the events and sets sequence flows based on conditions in real time. Evaluating assignments, keeping track of variable values and making service calls, happens in [simulation/util.js](../src/simulation/util.js).