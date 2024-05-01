# BPMN JS Interpreter
Editing and interpreting business processes following the BPMN 2.0 standard.  

## Modeler
This editor is a node-style web application that builds a user interface around the [bpmn-js](https://github.com/bpmn-io/bpmn-js) BPMN 2.0 modeler.
![demo application screenshot](./docs/screenshot.png "Screenshot of the modeler + properties panel example")

### Properties Panel
It uses [bpmn-js](https://github.com/bpmn-io/bpmn-js) and [bpmn-js-properties-panel](https://github.com/bpmn-io/bpmn-js-properties-panel). It implements a BPMN 2.0 modeler that allows you to edit execution related properties via a properties panel.

### Extension of Properties Panel
Our extension follows the steps of [properties-panel-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/main/properties-panel-extension) and [properties-panel-list-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/main/properties-panel-list-extension) which show how to add custom properties(-lists) to the bpmn editor and the underlying bpmn diagram. With groups and nested groups we created the exact XML structure we wanted.

### Model
More about the bpmn model [here](./docs/model.md).

## Simulation
Also integrated in the editor is the [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation/tree/main), which is a great tool for visualization and learning. More about the simulation [here](./docs/simulation.md).

## Building
You need a [Node.js](http://nodejs.org) development stack with [npm](https://npmjs.org) installed to build the project.

To install all project dependencies execute

```sh
npm install
```

Build the example using [webpack](https://webpack.js.org/) via

```sh
npm run all
```

That generates the distribution ready client-side modeler application into the `public` folder.

Serve the application via

```sh
npm start
```
