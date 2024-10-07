import $ from 'jquery';
import { debounce } from 'min-dash';
// bpmn-js
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {is} from "bpmn-js/lib/util/ModelUtil";
import InterpreterTokenSimulation from "./simulation";
import simulationSupportModule from "bpmn-js-token-simulation/lib/simulation-support";
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
// new diagram
import diagramXML from '../resources/newDiagram.bpmn';
// import Extra Props
import variablesListProviderModule from './provider/variables';
import assignmentsListProviderModule from './provider/assignments';
import serviceImplProviderModule from './provider/services';
import vsdtModdleDescriptor from './descriptors/vsdt2';
import conditionPropsProviderModule from './provider/conditions';
import userTaskInfoProviderModule from './provider/userTaskInformation';
// import Views
import serviceViewModule from './views/services';
// Auto-Layout
import { layoutProcess } from 'bpmn-auto-layout';
// Copy-Paste
import { nativeCopyModule } from './copyPasteModule';


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
    userTaskInfoProviderModule,
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

    // Add OPACA logo
    addWaterMark();

  } catch (err) {

    container
      .removeClass('with-diagram')
      .addClass('with-error');

    container.find('.error pre').text(err.message);

    // Rethrow error for webSocket
    throw err;
  }
}

function addWaterMark(){
  const canvas = bpmnModeler.get('canvas');
  const svgRoot = canvas.getContainer().querySelector('svg');

  // Calculate Logo position (centered)
  const svgWidth = svgRoot.clientWidth;
  const xPos = (svgWidth/2 - 376/2).toString();

  const watermarkImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  watermarkImage.setAttribute('href', '/resources/opaca-logo.png');
  watermarkImage.setAttribute('width', '376');
  watermarkImage.setAttribute('x', xPos);
  watermarkImage.setAttribute('y', '0');
  watermarkImage.setAttribute('opacity', '0.1');

  // Disable pointer events so the watermark doesn't capture mouse actions
  watermarkImage.setAttribute('style', 'pointer-events: none;');

  svgRoot.appendChild(watermarkImage);
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

async function generateDiagramWithLLM() {
  const description = $('#process-description').val();
  $('#js-prompt-panel').hide();  
  $('#js-loading-panel').show();
  try {
    const response = await fetch('http://127.0.0.1:5000/generate_process_model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        process_description: description})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const bpmnXml = data.bpmn_xml;
    console.log(bpmnXml);

    if(bpmnXml) {
      $('#js-loading-panel').hide();
      $('#js-drop-zone').show();
      openDiagram(bpmnXml);
      $('#js-layout-prompt-panel').show();
    } else {
      $('#js-loading-panel').hide();
      $('#response-message').text('Failed to get BPMN diagram.')
    }
  } catch (error) {
    $('#js-loading-panel').hide();
    $('#response-message').text(`Error: ${error.message}`);
    console.error(error);
  }
}

async function fixLayout() {
  //Fix the ProMoAI layout using library from bpmn-js
  try {
    const { xml: currentXml } = await bpmnModeler.saveXML({ format: true });
    const layoutedXml = await layoutProcess(currentXml);

    try {
      await bpmnModeler.importXML(layoutedXml);
  
      const canvas = bpmnModeler.get('canvas');
      canvas.zoom('fit-viewport');
  
      container.removeClass('with-error').addClass('with-diagram');

    } catch (err) {
      container.removeClass('with-diagram').addClass('with-error');
      container.find('.error pre').text(err.message);
      console.error('something went wrong: ', err);
    }
  } catch (error) {
    console.error('Error fixing layout: ', error);
    $('#response-message').text('Error: ${error.message}');
  } finally {
    $('#js-loading-panel').hide();
    $('#js-layout-prompt-panel').hide();
    $('#js-feedback-panel').show();
  }
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

  //Generate diagram using LLM
  $('#send-description').click(async function() {
    await generateDiagramWithLLM();
    await fixLayout();
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
  let ws = '';

  // Event handlers for WebSocket client
  function wsOpen() {
    console.log('Connected to WebSocket server');

    // Send a message to the server
    ws.send(JSON.stringify({type: 'info', message: 'Message from client'}));
  }

  function wsMessage(event) {
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
  }

  function wsClose() {
    console.log('Disconnected from WebSocket server');
  }

  function wsError(error) {
    console.error('WebSocket error:', error);
  }

  // Check if the companion server has been started
  function checkServerAvailability(){
    return fetch('http://localhost:8082/info')
        .then(response => {
          return response.ok;
        })
        .catch(() => {
          return false;
        });
  }

  function connectWebSocket() {
    checkServerAvailability().then(isAvailable => {
      if(isAvailable){
        ws = new WebSocket('ws://localhost:8082');
        ws.onopen = wsOpen;
        ws.onmessage = wsMessage;
        ws.onerror = wsError;
        ws.onclose = wsClose;
      }
    });
  }

  // Try to establish the connection
  connectWebSocket();
});
