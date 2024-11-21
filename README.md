# BPMN INTERPRETER (VSDT2)
This is a tool meant for editing and interpreting business processes following the BPMN 2.0 standard. It was mainly developed for [OPACA](https://github.com/gt-arc/opaca-core/), an Agent Framework, which empowers users to combine multi-agent systems with microservices and container-technologies.    

## Modeler
The editor is a node-style web application that builds a user interface around the [bpmn-js](https://github.com/bpmn-io/bpmn-js) BPMN 2.0 modeler.

![demo application screenshot](./docs/screenshot.png "Screenshot of the modeler + properties panel example")

### Properties Panel
It uses [bpmn-js](https://github.com/bpmn-io/bpmn-js) and [bpmn-js-properties-panel](https://github.com/bpmn-io/bpmn-js-properties-panel), which allows you to edit execution related properties via a properties panel.

Following the steps of [properties-panel-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/main/properties-panel-extension) and [properties-panel-list-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/main/properties-panel-list-extension), we added custom properties to the bpmn editor that are needed to create executable processes for OPACA.  
To highlight their importance and make modeling easier, services are added in an extra service-view focused on OPACA services.

### Model
More about the bpmn model and our extensions [here](./docs/model.md).

### Examples
Some example diagrams can be found in [examples](./resources/examples) and [bpmn-examples](https://gitlab.dai-labor.de/zeki-bmas/tp-processes/bpmn-examples).

## Simulation
Also integrated in the editor is the [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation/tree/main), which is a great tool for visualization and learning. More about the simulation and our extension [here](./docs/simulation.md).

## Building (editor and integrated interpretation)
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

## Building (as interpreter agent)
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

# BPMN Model Generation
Also integrated into the editor is a Model Generator based on ProMoAI. When starting the editor, this tool enables you to define a business process in a prompt and let an LLM create the diagram for you. Additionally, you can ask for changes or refinement at a later point.

At this point the model generation does not support `extensionElements`, so our custom properties have to be defined by hand. 

## Building (as a whole)
To build the project as a whole run the docker-compose (in the project root)
```sh
docker compose up --build
```
Note that you will first need an API key for the LLM (we use OPENAI). You can set your key as `OPENAI_API_KEY` in your environment variables.

# LICENSING

- The [opaca-bpmn-editor](./opaca-bpmn-editor) directory is licensed under MIT. See the [MIT LICENSE](./opaca-bpmn-editor/LICENSE.txt) for details. 
- The [python-powl-server](./python-powl-server) directory is licensed under GPL. This is an optional component, not needed for the interpreter. See the [GPL LICENSE](./python-powl-server/LICENSE.txt) for details. 
