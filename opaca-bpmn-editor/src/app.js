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

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  //// functions to load diagram and control simulation ////

  // LOAD DIAGRAM
  window.loadDiagram = async (bpmnXml) => {
    try {
      //await bpmnModeler.importXML(bpmnXml);
      await openDiagram(bpmnXml); // Use this to add with-diagram elements for now
      return 'BPMN diagram loaded successfully';
    } catch (error) {
      console.error('Error loading BPMN diagram:', error.message);
      return error.message;
    }
  };

  // START SIMULATION
  window.startSimulation = async () => {
    try{
      if(!toggleMode._active){
        toggleMode.toggleMode(true);
      }
      // Find (the first) start event
      const elements = elementRegistry.getAll();
      const startEvent = elements.find(el => is(el, 'bpmn:StartEvent'));

      // Trigger start event
      simulationSupport.triggerElement(startEvent.id);

      return `Started Simulation at ${startEvent.id}`;
    }catch(error){
      return error.message;
    }
  }

});
