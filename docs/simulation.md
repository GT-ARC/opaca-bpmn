# Simulation and Interpretation

## Token Simulation

This editor uses [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation/tree/main), which is an extension for bpmn-js. It allows for the simulation of BPMN processes using tokens, which represent the flow of work.

In the original token simulation, events defined in a process have to be triggered manually and sequence flows after a gateway have to be set in advance for the simulation to work. This is still the behavior for non-executable processes, but the token simulation has also been extended to allow for the actual execution of processes, evaluating assignments and conditions and calling the referred services.

## Interpretation

We extended the [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation/tree/main) to inject some custom behaviors and settings, e.g. for handling Gateways and Service Tasks. The implementation of these behaviors is found in the [`simulation`](../opaca-bpmn-editor/src/simulation) package. The result is an interpreter that automates some of the events and evaluates conditions and assignments based on the current variable values. Evaluating assignments, keeping track of variable values, making service calls and creating input dialogs for user tasks, happens in [`simulation/util.js`](../opaca-bpmn-editor/src/simulation/interpreter-base/util.js). Triggering of timer events is handled in [`simulation/timer-event-support`](../opaca-bpmn-editor/src/simulation/timer-event-support).
