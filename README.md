# bpmn-js Modeler + Properties Panel Example

This example uses [bpmn-js](https://github.com/bpmn-io/bpmn-js) and [bpmn-js-properties-panel](https://github.com/bpmn-io/bpmn-js-properties-panel). It implements a BPMN 2.0 modeler that allows you to edit execution related properties via a properties panel.

## How to extend the Properties Panel

This example follows the steps of [properties-panel-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/main/properties-panel-extension) and [properties-panel-list-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/main/properties-panel-list-extension) which show how to add custom properties(-lists) to the bpmn editor and the underlying bpmn diagram. With groups and nested groups you can achieve the exact XML structure you want.


## About

This example is a node-style web application that builds a user interface around the bpmn-js BPMN 2.0 modeler.

![demo application screenshot](./docs/screenshot.png "Screenshot of the modeler + properties panel example")


## Building the Example

You need a [NodeJS](http://nodejs.org) development stack with [npm](https://npmjs.org) installed to build the project.

To install all project dependencies execute

```sh
npm install
```

Build the example using [webpack](https://webpack.js.org/) via

```sh
npm run all
```

You may also spawn a development setup by executing

```sh
npm run dev
```

Both tasks generate the distribution ready client-side modeler application into the `public` folder.

Serve the application locally or via a web server (nginx, apache, embedded).
