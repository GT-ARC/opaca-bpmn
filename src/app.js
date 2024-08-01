import $ from 'jquery';
import { debounce } from 'min-dash';
// bpmn-js
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {is} from "bpmn-js/lib/util/ModelUtil";
import InterpreterTokenSimulation from "./simulation";
import simulationSupportModule from "bpmn-js-token-simulation/lib/simulation-support";
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import {isPaste} from 'diagram-js/lib/features/keyboard/KeyboardUtil';
// new diagram
import diagramXML from '../resources/newDiagram.bpmn';
// import Extra Props
import variablesListProviderModule from './provider/variables';
import assignmentsListProviderModule from './provider/assignments';
import serviceImplProviderModule from './provider/services';
import vsdtModdleDescriptor from './descriptors/vsdt2';
import conditionPropsProviderModule from './provider/conditions';
// import Views
import serviceViewModule from './views/services';
import {getAssignments} from "./provider/assignments/util";
import {getVariables} from "./provider/variables/util";

// Native Copy-Paste Module
const nativeCopyModule = {
  __init__: ['nativeCopyPaste'],
  nativeCopyPaste: ['type', function (
      keyboard, eventBus,
      moddle, clipboard
  ) {

    function collectReferences(elements, references) {
      if (!elements){
        console.error('Expected an array of elements');
        return;
      }

      const process = elementRegistry.get('Process_1');
      const variables = getVariables(process);
      // TODO also collect other references (processes)
      console.log(elements);
      elements.forEach(element => {
        const assignments = getAssignments(element);
        if(assignments){
          assignments.forEach(assignment => {
            if(variables){
              variables.forEach(variable => {
                if(variable.name === assignment.variable){
                  references[variable.name] = variable;
                }
              });
            }
          });
        }
      });
    }

    // Persist into local storage whenever copy takes place
    eventBus.on('copyPaste.elementsCopied', event => {
      const { tree } = event;

      // Collect all references
      const references = {};
      collectReferences(tree[0], references);
      console.log(references);

      // Combine tree and references
      const copyPayload = {
        tree,
        references
      };

      console.log('PUT localStorage', tree, references);

      // Persist in local storage, encoded as JSON
      localStorage.setItem('bpmnClipboard', JSON.stringify(copyPayload));
    });

    // Intercept global paste keybindings and inject reified pasted stack
    keyboard.addListener(2000, event => {
      const { keyEvent } = event;

      if (!isPaste(keyEvent)) {
        return;
      }

      // Retrieve from local storage
      const serializedCopy = localStorage.getItem('bpmnClipboard');

      if (!serializedCopy) {
        return;
      }

      // Parse tree, re-instantiating contained objects
      const { tree, references } = JSON.parse(serializedCopy, createReviver(moddle));

      console.log('GET localStorage', tree, references);

      // TODO make sure it works for processes with other names
      const targetProcess = elementRegistry.get('Process_1');

      console.log('targetProcess', targetProcess);
      // TODO add undo support
      // Add missing variables to the target process
      Object.keys(references).forEach(key => {
        const reference = references[key];

        if(!targetProcess.businessObject.get('extensionElements')){
          targetProcess.businessObject.extensionElements = moddle.create('bpmn:ExtensionElements', {values : []});
        }
        console.log('target extensionElements', targetProcess.businessObject.extensionElements);
        if (!getVariables(targetProcess)) {
          targetProcess.businessObject.extensionElements.values.push(moddle.create('vsdt2:Variables', {values: []}));
        }
        console.log('target extensionElements', targetProcess.businessObject.extensionElements);

        if (!getVariables(targetProcess).find(variable => variable.name === key)) {
          // Add the reference to the target process variables
          // TODO make sure values[0] is variables extension
          targetProcess.businessObject.extensionElements.values[0].values.push(reference);
        }
      });
      // Put into clipboard
      clipboard.set(tree);
    });
  }]
};

function createReviver(moddle) {
  var elCache = {};

  return function(key, object) {
    if (typeof object === 'object' && typeof object.$type === 'string') {
      var objectId = object.id;

      if (objectId && elCache[objectId]) {
        return elCache[objectId];
      }

      var type = object.$type;
      var attrs = Object.assign({}, object);

      delete attrs.$type;

      var newEl = moddle.create(type, attrs);

      if (objectId) {
        elCache[objectId] = newEl;
      }

      return newEl;
    }

    return object;
  };
}

var container = $('#js-drop-zone');
var canvas = $('#js-canvas');

var bpmnModeler = new BpmnModeler({
  container: canvas,
  keyboard: { bindTo: document },
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
    conditionPropsProviderModule,
    nativeCopyModule
  ],
  moddleExtensions: {
    vsdt2: vsdtModdleDescriptor
  }
});
container.removeClass('with-diagram');

const eventBus = bpmnModeler.get('eventBus');
const simulationSupport = bpmnModeler.get('simulationSupport');
const elementRegistry = bpmnModeler.get('elementRegistry');
const toggleMode = bpmnModeler.get('toggleMode');
const pauseSimulation = bpmnModeler.get('pauseSimulation');

function createNewDiagram() {
  try{
    openDiagram(diagramXML);
  }catch (err) {
    console.error(err);
  }
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

    // Rethrow error for webSocket
    throw err;
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
      try{
        callback(xml);
      }catch(err){
        console.error(err);
      }
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

// File drag/drop functionality
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}

// Bootstrap diagram functions
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

  // Confirm closing/refreshing window with unsaved changes
  window.addEventListener('beforeunload', function(event) {
    // If undo is possible there are unsaved changes
    if (bpmnModeler.get('commandStack').canUndo()) {
      const message = 'You have unsaved changes. Are you sure you want to leave?';
      event.returnValue = message; // Standard for most browsers
      return message;              // For some older browsers
    }
  });


  //// WebSocket to control simulation on request ////

  // Create a WebSocket client
  const ws = new WebSocket('ws://localhost:8082');

  // Event handlers for WebSocket client
  ws.onopen = function() {
    console.log('Connected to WebSocket server');

    // Send a message to the server
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
    if(request.type==='info'){
      return;
    }

    // Make sure simulation mode is active before invoking actions depending on that
    if(!toggleMode._active){
      toggleMode.toggleMode(true);
    }

    /// Different actions
    if(request.type==='loadDiagram'){// LOAD DIAGRAM
      // Open the passed diagram
      openDiagram(request.parameters.diagram).then(() => {
        // After a new diagram is opened we need to deactivate simulation mode once
        toggleMode.toggleMode(false);
        toggleMode.toggleMode(true);
        // Send info
        ws.send(JSON.stringify({ type: 'response', requestId: request.id, message: 'load ok.'}));
      }).catch(error => {
        console.error('Error in openDiagram:', error);
        // Send info
        ws.send(JSON.stringify({ type: 'error', requestId: request.id, message: 'load failed. ' + error.message}));
      });
    }else if(request.type==='startSimulation'){// START SIMULATION
      try {
        // Find (the first) start event
        const elements = elementRegistry.getAll();
        const startEvent = elements.find(el => is(el, 'bpmn:StartEvent'));

        // Trigger start event
        simulationSupport.triggerElement(startEvent.id);
        ws.send(JSON.stringify({type: 'response', requestId: request.id, message: 'simulation started at ' + startEvent.id}));
      }catch (error){
        ws.send(JSON.stringify({type: 'error', requestId: request.id, message: 'start failed. ' + error.message}));
      }
    }else if(request.type==='pauseSimulation') {// PAUSE SIMULATION
      try {
        // If not paused, pause simulation
        if(!pauseSimulation.isPaused){
          pauseSimulation.pause();
        }else{
          throw new Error('Simulation is already paused.');
        }

        ws.send(JSON.stringify({type: 'response', requestId: request.id, message: 'simulation paused.'}));
      } catch (error) {
        ws.send(JSON.stringify({type: 'error', requestId: request.id, message: 'pause failed. ' + error.message}));
      }
    }else if(request.type==='resumeSimulation') {// RESUME SIMULATION
      try {
        // If paused, unpause simulation
        if(pauseSimulation.isPaused){
          pauseSimulation.unpause();
        }else{
          throw new Error('Simulation is not paused.');
        }

        ws.send(JSON.stringify({type: 'response', requestId: request.id, message: 'simulation resumed.'}));
      } catch (error) {
        ws.send(JSON.stringify({type: 'error', requestId: request.id, message: 'resume failed. ' + error.message}));
      }
    }else if(request.type==='resetSimulation'){// RESET SIMULATION
      try { // try-catch not needed here, but maybe later
        // Trigger reset
        eventBus.fire('tokenSimulation.resetSimulation');

        ws.send(JSON.stringify({type: 'response', requestId: request.id, message: 'simulation reset.'}));
      }catch (error){
        ws.send(JSON.stringify({type: 'error', requestId: request.id, message: 'reset failed. ' + error.message}));
      }
    }else if(request.type==='sendMessage'){// SEND MESSAGE
      try{
        // Get all elements
        const elements = elementRegistry.getAll();
        // Filter for events
        const events = elements.filter(el => is(el, 'bpmn:Event'));
        // Filter for events that have the messageReference of our message
        const messageEvents = events.filter(el => el.businessObject.eventDefinitions.find(ed => ed.messageRef.name === request.parameters.messageType));

        // TODO: make sure when triggering one element fails, others are still executed
        messageEvents.forEach(msgEvent => simulationSupport.triggerElement(msgEvent.id));
        // trigger boundary events with message reference, only when attached to a running action
        ws.send(JSON.stringify({type: 'response', requestId: request.id, message: 'got request.'}));
      }catch (error){
        ws.send(JSON.stringify({type: 'error', requestId: request.id, message: 'message could not be processed. ' + error.message}));
      }
    }
  };

  ws.onclose = function() {
    console.log('Disconnected from WebSocket server');
  };

  ws.onerror = function(error) {
    console.error('WebSocket error:', error);
  };
});
