# OPACA BPMN Editor and Interpreter

Copyright 2023-2024 GT-ARC & DAI-Labor, TU Berlin

* Main Contributors: Cedric Braun
* Further contributions by: Anastasiia Zubenko, Tobias Küster

The BPMN-Editor and Interpreter are based on [bpmn-js](https://github.com/bpmn-io/bpmn-js) and the [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation). The LLM-based process generation is based on [ProMoAI](https://github.com/humam-kourani/ProMoAI/).

This (https://github.com/gt-arc/opaca-bpmn/) is the public repository of the OPACA BPMN Editor and Interpreter project. Feel free to create issues if you have any suggestions, or improve things yourself with a fork and pull request. The main development work still happens in the internal/private repository at https://gitlab.dai-labor.de, including most (internal) tickets, development branches, merge requests, build pipelines, etc.

This repository includes software developed in the course of the project "Offenes Innovationslabor KI zur Förderung gemeinwohlorientierter KI-Anwendungen" (aka Go-KI, https://go-ki.org/) funded by the German Federal Ministry of Labour and Social Affairs (BMAS) under the funding reference number DKI.00.00032.21.


## About

This is a tool for editing and interpreting business processes following the BPMN 2.0 standard. It was mainly developed for [OPACA](https://github.com/gt-arc/opaca-core/), an Agent Framework, which empowers users to combine multi-agent systems with microservices and container-technologies. The tool consists of several components that are explained further in the following:

* a BPMN editor, based on the [bpmn-js](https://github.com/bpmn-io/bpmn-js), with extensions for referring to OPACA actions
* a BPMN interpreter, based on the [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation), with extensions for calling OPACA actions
* an optional backend service for generating basic BPMN diagrams using an LLM, based on [ProMoAI](https://github.com/humam-kourani/ProMoAI/)
* an integration of the BPMN editor and interpreter into an OPACA Agent Container

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

In addition to the extended properties panel, the OPACA BPMN Editor also includes a special view (see screenshot) for connecting to an OPACA Runtime Platform and importing the different agents' actions as Services into the BPMN diagram, to be used as implementations for Service Tasks.

### Integrated BPMN Interpreter

Also integrated in the editor is the [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation/tree/main), which is a great tool for simulating and visualising the process. For the OPACA BPMN Editor, the simulation has been extended to a full-fledged interpreter, evaluating conditions and assignments and calling the referred OPACA actions accordingly. More about the simulation and our extension can be found [here](./docs/simulation.md).

### LLM Integration

A custom landing page allows to create a new BPMN diagram, load an existing one by drag-and-drop, or draft a new BPMN diagram using an LLM prompt. The latter calls the `promoai-api-server` which is based on [ProMoAI](https://github.com/humam-kourani/ProMoAI/) (see below for details). The diagrams can then be further extended in the regular BPMN editor. Similarly, a button at the bottom of the editor also allows the refinement of existing BPMN diagrams through the LLM.

**Note:** Due to inner workings of ProMoAI, the LLM can currently only generate very basic processes, and does not "know" about the OPACA-specific extensions.


## Integration into an OPACA Agent Container

While the primary intention is for the BPMN Editor and Interpreter to be used interactively in a web browser, another goal was to directly integrate the Interpreter into an OPACA Agent, similar to how it was in the old 'VSDT' BPMN Editor and JIAC-based Interpreter Agent (cf. [Process-oriented modelling, creation, and interpretation of multi-agent systems. Küster et al., 2016](http://dx.doi.org/10.1504/IJAOSE.2016.080892)). For this, the actual BPMN Editor and integrated interpreter are wrapped inside an OPACA Agent, allowing multiple BPMN diagrams to be deployed via OPACA actions, with the interpreter running in "headless" mode via [Puppeteer](https://github.com/puppeteer/puppeteer), but also allowing the user to inspect the running processes using a read-only view on the editor.

For more details, please refer to the [dedicated documentation](docs/opaca-agent.md). Note, however, that at the moment this is still work-in-progress.


## Process Generation based on ProMoAI

The `promoai-api-server` is entirely optional, but can be used to create BPMN diagrams based on a textual description, as an alternative to starting with a new or existing BPMN diagram. The logic has been taken mostly from ProMoAI, replacing the Streamlit App with a FastAPI server to be used by the BPMN editor frontend.

It uses the OpenAI API to generate the BPMN process. But while GPT can generate BPMN XML, the result is often incorrect. Thus, the approach in ProMoAI is to generate Python code, that then generates a POWL model, which is then translated to actual valid BPMN 2.0 XML. For more details please refer to [ProMoAI: Process Modeling with Generative AI (Kourani et al., 2024)](https://www.ijcai.org/proceedings/2024/1014). The downside of this approach is that while the resulting processes are usually "on point" and syntactically correct, the intermediate model limits the expressiveness to just a subset of what's possible with BPMN, and in particular none of the extension elements of the OPACA BPMN editor.


## Environment Variables

* **BPMN Modeller**
  * `LLM_BACKEND`: Where to find the server for LLM-based process generation (optional)
* **Process Generation Server**
  * `LLM_NAME`: GPT model to use, e.g. `gpt-4o-mini`
  * `LLM_API_KEY`: OpenAI API Key


## Getting Started

### Using Docker Compose

The easiest way to build and start the BPMN Editor and Interpreter along with the optional Process Generation Server is using Docker Compose, using the provided [`docker-compose.yml`](docker-compose.yml). Make sure to set the environment variables accordingly (see above), then run `docker compose up --build` to build and start the services.

### Development and testing (editor and interpreter)

For starting only the BPMN editor, and especially for development and testing, you can also build and run the editor locally using the [Node.js](http://nodejs.org) development stack with [npm](https://npmjs.org).

1. Go to the `opaca-bpmn-editor` directory
2. Run `npm install` to install all project dependencies
3. Run `npm run build` to build the application using [webpack](https://webpack.js.org/), generating the distribution-ready client-side modeler in the `public` folder.
4. Finally, run `npm start` to serve the application.

### Building the OPACA Interpreter Agent

To run the OPACA Agent Container integrating the BPMN editor and interpreter, you first have to build the Docker image and then deploy it via an OPACA Runtime Platform.

1. Go to the `opaca-bpmn-editor` directory
2. Build the Docker image:
    ```sh
    docker build -f ./opaca-container/Dockerfile -t opaca-bpmn-interpreter-agent .
    ```
3. Start an [OPACA Platform](https://github.com/GT-ARC/opaca-core)
4. In the Swagger UI, call `POST containers`, replacing the `image` attribute with the content of [`modeler-image.json`](opaca-bpmn-editor/opaca-container/modeler-image.json)
5. Use the container's actions to interact with the interpreter (see [the respective documentation](docs/opaca-agent.md) for details).

**Note:** The OPACA Interpreter Agent is still work in progress and details may change.


## License

The `opaca-bpmn-editor`is based on [bpmn-js](https://github.com/bpmn-io/bpmn-js) and the [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation), licensed under the Camunda- and MIT License, respectively. The extensions for the OPACA framework are licensed under the [OPACA License](LICENSE.txt).

The `promoai-api-server` is based on [ProMoAI](https://github.com/humam-kourani/ProMoAI/), licensed under GPL3, and is therefore also licensed under GPL3. This is an optional component, not needed for the editor and interpreter to work, and only linked with it via network (HTTP/REST).
