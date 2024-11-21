# OPACA BPMN Editor and Interpreter

Copyright 2023-2024 GT-ARC & DAI-Labor, TU Berlin

* Main Contributors: Cedric Braun
* Further contributions by: Anastasiia Zubenko, Tobias Küster

The BPMN-Editor and Interpreter are based on [bpmn-js](https://github.com/bpmn-io/bpmn-js) and the [bpmn-js Token Simulation](https://github.com/bpmn-io/bpmn-js-token-simulation). The LLM-based process generation is based on [ProMoAI](https://github.com/humam-kourani/ProMoAI/).

This (https://github.com/gt-arc/opaca-bpmn/) is the public repository of the OPACA BPMN Editor and Interpreter project. Feel free to create issues if you have any suggestions, or improve things yourself with a fork and pull request. The main development work still happens in the internal/private repository at https://gitlab.dai-labor.de, including most (internal) tickets, development branches, merge requests, build pipelines, etc.

This repository includes software developed in the course of the project "Offenes Innovationslabor KI zur Förderung gemeinwohlorientierter KI-Anwendungen" (aka Go-KI, https://go-ki.org/) funded by the German Federal Ministry of Labour and Social Affairs (BMAS) under the funding reference number DKI.00.00032.21.


## About

This is a tool for editing and interpreting business processes following the BPMN 2.0 standard. It was mainly developed for [OPACA](https://github.com/gt-arc/opaca-core/), an Agent Framework, which empowers users to combine multi-agent systems with microservices and container-technologies. The tool consists of several components that are explained further in the following:

* a BPMN editor, based on the [bpmn-js](https://github.com/bpmn-io/bpmn-js), with extensions for referring to OPACA actions
* a BPMN interpreter, based on the [bpmn-js Token Simulation](https://github.com/bpmn-io/bpmn-js-token-simulation), with extensions for calling OPACA actions
* an optional backend service for generating basic BPMN diagrams using an LLM, based on [ProMoAI](https://github.com/humam-kourani/ProMoAI/)
* an integration of the BPMN editor and interpreter into an OPACA Agent Container (WIP)

![demo application screenshot](./docs/screenshot.png "Screenshot of the modeler + properties panel example")


## BPMN Editor / Modeler

The editor is a node-style web application that builds upon the [bpmn-js](https://github.com/bpmn-io/bpmn-js) BPMN 2.0 modeler, with several extensions towards integration with the OPACA framework.

For this, it extends the basic BPMN-js editor with additional model elements and properties panels for specifying variables, assignments, and services, as well as additional UI elements for importing those services from a connected OPACA Runtime Platform. It also includes a custom landing page that allows the generation of basic processes using an LLM prompt (see below).

### Model

The BPMN 2.0 model has been extended with additional element for modelling variables, assignments, and services (OPACA actions) to be invoked by the interpreter. More about the BPMN model and our extensions can be found [here](./docs/model.md).

### Properties Panel

In order to effectively manage the new model element, the [bpmn-js-properties-panel](https://github.com/bpmn-io/bpmn-js-properties-panel) has to be extended as well.

Following the steps of [properties-panel-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/main/properties-panel-extension) and [properties-panel-list-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/main/properties-panel-list-extension), we added custom properties to the BPMN editor that are needed to create executable processes for OPACA.

### Importing OPACA Actions as Services

In addition to the extended properties panel, the OPACA BPMN Editor also includes a special view (see screenshot) for connecting to an OPACA Runtime Platform and importing the different agents' actions as Services into the BPMN diagram, to use used as implementations for Service Tasks.

### Integrated BPMN Interpreter

Also integrated in the editor is the [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation/tree/main), which is a great tool for simulating and visualising the process. For the OPACA BPMN Editor, the simulation has been extended to a full-fledged interpreter, evaluating conditions and assignments and calling the referred OPACA actions accordingly. More about the simulation and our extension can be found [here](./docs/simulation.md).

### LLM Integration

A custom landing page allows to create a new BPMN diagram, load an existing one by drag-and-drop, or draft a new BPMN diagram using an LLM prompt. The latter call the `python-powl-server` which is based on ProMoAI (see below for details). The diagrams can then be further extended in the regular BPMN editor. Similarly, a button at the bottom of the editor also allows the refinement of existing BPMN diagrams.

**Note:** Due to inner workings of ProMoAI, the LLM can currently only generate very basic processes, and does not "know" about the OPACA-specific extensions.


## Integration into an OPACA Agent Container

TODO
primary use of editor as web application
integration of interpreter into opaca agent using puppeteer, details see separate config file
editor can be used as read-only view of current interpretation process
still WIP


## Process Generation based on ProMoAI

TODO
based on ProMoAI, based on BA by Anastasiia
very rough description of inner workings, creating (basic) model, then translating that to BPMN --> limited expressiveness
again stress that its completely optional


## Getting Started


### Building (editor and integrated interpretation)
You need a [Node.js](http://nodejs.org) development stack with [npm](https://npmjs.org) installed to build the project.

To install all project dependencies execute (in /opaca-bpmn-editor)

```sh
npm install
```

Build the example using [webpack](https://webpack.js.org/) via

```sh
npm run build
```

That generates the distribution ready client-side modeler application into the `public` folder.

Serve the application via

```sh
npm start
```

### Building (as interpreter agent)
If you want to connect the interpreter to the OPACA runtime platform, you first need to create the interpreter server container.

Build the Docker image (in /opaca-bpmn-editor) via

```sh
docker build -f ./opaca-bpmn-editor/Dockerfile -t bpmn-interpreter-vsdt2-server .
```

Start the OPACA platform and open the UI following their [Quick Testing Guide](https://github.com/gt-arc/opaca-core/?tab=readme-ov-file#getting-started--quick-testing-guide).

Go to `POST containers` and create the agent container by setting the `imageName` to `"bpmn-interpreter-vsdt2-server"`. Other fields can be removed.

We use Puppeteer to create a headless browser running in the container. The editor will be started and a first instance opened in that browser sequentially.

Go to `GET containers` or `GET agents` to see the server container and its actions.

Now you can invoke these actions in the `POST invoke` routes.

### Building (as a whole)
To build the project as a whole run the docker-compose (in the project root)
```sh
docker compose up --build
```
Note that you will first need an API key for the LLM (we use OPENAI). You can set your key as `OPENAI_API_KEY` in your environment variables.


## License

The [opaca-bpmn-editor](./opaca-bpmn-editor) is based on [bpmn-js](https://github.com/bpmn-io/bpmn-js) and the [bpmn-js Token Simulation](https://github.com/bpmn-io/bpmn-js-token-simulation), licensed under the Camunda- and MIT License, respectively. The extensions for the OPACA framework are licensed under the [OPACA License](LICENSE.txt).

The [python-powl-server](./python-powl-server) is based on [ProMoAI](https://github.com/humam-kourani/ProMoAI/), licensed under GPL3, and is therefore also licensed under GPL3. This is an optional component, not needed for the editor and interpreter to work, and only linked with it via network (HTTP/REST).
