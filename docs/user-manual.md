# User Manual
This is intended to provide an overview of the modeling capabilities to the user.

## BPMN
**Business Process Model and Notation (BPMN)** is a graphical standard for modeling business processes. It provides a clear, standardized way to visualize workflows, making it easier for stakeholders to understand and improve business operations. BPMN uses various symbols, such as events, activities, and gateways, to represent different elements of a process.

For a very detailed explanation, check out: [BPMN Specification by OMG](https://www.bpmn.org/)

Or checkout [Camunda's Introduction](https://camunda.com/bpmn/) to BPMN.

## bpmn.io, bpmn-js
This editor is build on Camunda's bpmn-js editor. Creating a process is relatively simple. Just drag-and-drop elements from the element palette onto the canvas. If you want to learn more on how to model a process you can also check out their tutorials on the editor (A good starting point is: [bpmn.io](https://bpmn.io/)).

## Extensions 
To make processes interpretable we introduced some custom properties you need to set when creating your process. The main properties being `Variables` (stored under processes and subprocesses) and `Assignments` (stored under events and activities).

## Modeling Process 
Let's walk through modeling a process that is ready for execution. 
1. Diagram Structure
TODO Add picture/gif
2. Adding Variables and Assignments
TODO Add picture/gif
3. Adding Conditions
TODO Add picture/gif

Now we have a process that evaluates conditions based on the variable values automatically. It gets interesting with the inclusion of special tasks and events.

## Special Properties
- TimerEventDefinitions
- SignalEventDefinitions
- MessageEventDefinitions
- UserTask
- Services and ServiceTasks