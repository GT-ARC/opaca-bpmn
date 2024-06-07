import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import InterpreterTokenSimulation from "./simulation";
import simulationSupportModule from "bpmn-js-token-simulation/lib/simulation-support";
import { debounce } from 'min-dash';

import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import diagramXML from '../resources/newDiagram.bpmn';
import exampleXML from '../resources/examples/exclusive_gateway_test.bpmn';

// import Extra Props
import variablesListProviderModule from './provider/variables';
import assignmentsListProviderModule from './provider/assignments';
import serviceImplProviderModule from './provider/services';
import vsdtModdleDescriptor from './descriptors/vsdt2';
import conditionPropsProviderModule from './provider/conditions';
// import Views
import serviceViewModule from './views/services';
//import interpreterViewModule from './views/interpreter';

import {is} from "bpmn-js/lib/util/ModelUtil";

var container = $('#js-drop-zone');
var canvas = $('#js-canvas');

var bpmnModeler = new BpmnModeler({
  container: canvas,
  propertiesPanel: {
    parent: '#js-properties-panel'
  },
  additionalModules: [
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    variablesListProviderModule,
    assignmentsListProviderModule,
    serviceImplProviderModule,
    InterpreterTokenSimulation,
    simulationSupportModule,
    serviceViewModule,
    //interpreterViewModule
    conditionPropsProviderModule
  ],
  moddleExtensions: {
    vsdt2: vsdtModdleDescriptor
  }
});
container.removeClass('with-diagram');

const eventBus = bpmnModeler.get('eventBus');
const simulationSupport = bpmnModeler.get('simulationSupport');
const elementRegistry = bpmnModeler.get('elementRegistry');

function createNewDiagram() {
  openDiagram(diagramXML);
}

async function openDiagram(xml) {

  try {

    await bpmnModeler.importXML(xml);

    container
      .removeClass('with-error')
      .addClass('with-diagram');

  } catch (err) {

    container
      .removeClass('with-diagram')
      .addClass('with-error');

    container.find('.error pre').text(err.message);

    console.error(err);
  }
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;

    var file = files[0];

    var reader = new FileReader();

    reader.onload = function(e) {

      var xml = e.target.result;

      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}


////// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}

// bootstrap diagram functions

$(function() {

  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();

    createNewDiagram();
  });

  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(async function() {

    try {

      const { svg } = await bpmnModeler.saveSVG();

      setEncoded(downloadSvgLink, 'diagram.svg', svg);
    } catch (err) {

      console.error('Error happened saving SVG: ', err);

      setEncoded(downloadSvgLink, 'diagram.svg', null);
    }

    try {

      const { xml } = await bpmnModeler.saveXML({ format: true });

      setEncoded(downloadLink, 'diagram.bpmn', xml);
    } catch (err) {

      console.log('Error happened saving XML: ', err);

      setEncoded(downloadLink, 'diagram.bpmn', null);
    }
  }, 500);

  bpmnModeler.on('commandStack.changed', exportArtifacts);

  //// WebSocket to control simulation on request ////

  // Create a WebSocket client
  const ws = new WebSocket('ws://localhost:8082');

  // Event handlers for WebSocket client
  ws.onopen = function() {
    console.log('Connected to WebSocket server');

    // Send a message to the client
    ws.send(JSON.stringify({type: 'info', message: 'Message from client'}));
  };

  ws.onmessage = function(event) {
    console.log('Received message from server:', event.data);

    var request;
    try {
      request = JSON.parse(event.data);
    } catch (error) {
      console.error('Error parsing message from server:', error);
      return;
    }

    // Different actions
    if(request.type==='loadDiagram'){// LOAD DIAGRAM
      // Open the passed diagram
      // TODO
      //openDiagram(request.parameters.diagram);
      openDiagram(exampleXML).then(r => ws.send(JSON.stringify({type: 'info', message: 'load ok'})));

      // Toggle simulation mode automatically
      const toggleMode = bpmnModeler.get('toggleMode');
      toggleMode.toggleMode(true);

    }else if(request.type==='startSimulation'){// START SIMULATION
      // Find start event
      const elements = elementRegistry.getAll()
      console.log(elements);
      const startEvent = elements.find(el => is(el, 'bpmn:StartEvent'));
      console.log(startEvent);
      console.log(startEvent.id);

      // Trigger simulation
      simulationSupport.triggerElement(startEvent.id);
    }
  };

  ws.onclose = function() {
    console.log('Disconnected from WebSocket server');
  };

  ws.onerror = function(error) {
    console.error('WebSocket error:', error);
  };
});
