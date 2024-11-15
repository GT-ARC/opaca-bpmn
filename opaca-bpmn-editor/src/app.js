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

var sessionId = '';

async function generateDiagramWithLLM() {
  const description = $('#process-description').val();
  $('#js-prompt-panel').hide();
  $('#js-loading-panel').show();
  try {
    const response = await fetch(process.env.LLM_BACKEND + '/generate_process_model', {
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

    sessionId = data.session_id;
    console.log(data.session_id);

    const bpmnXml = data.bpmn_xml;
    console.log(bpmnXml);

    if(bpmnXml) {
      $('#js-loading-panel').hide();
      $('#js-drop-zone').show();
      openDiagram(bpmnXml);
      $('#js-layout-prompt-panel').show();
      $('#feedback-button').show();
      return true;
    } else {
      $('#js-loading-panel').hide();
      $('#response-message').text('Failed to get BPMN diagram.')
      return false;
    }
  } catch (error) {
    if(error.message === 'Failed to fetch'){
      error.message += ', likely missing an API Key';
    }
    $('#js-loading-panel').hide();
    $('#response-message').text(`Error: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function refineDiagramWithLLM(){
  const feedbackText = $('#process-feedback-description').val();
  $('#js-feedback-panel').hide();
  $('#js-feedback-loading-panel').show();

  try {
    // Send xml, if new session
    var xml = null;
    if(sessionId===''){
      xml = await bpmnModeler.saveXML({ format: true });
      xml = xml.xml;
    }
    console.log('ready for call');

    const response = await fetch(process.env.LLM_BACKEND + '/update_process_model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedback_text: feedbackText,
        session_id: sessionId,
        ...(xml && {process_xml: xml})
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const bpmnXml = data.bpmn_xml;
    // Save session id
    sessionId = data.session_id;
    // console.log(bpmnXml);

    if (bpmnXml) {
      $('#js-feedback-loading-panel').hide();
      $('#js-drop-zone').show();
      openDiagram(bpmnXml);
      $('#js-layout-prompt-panel').show();
      return true;
    } else {
      $('#js-feedback-loading-panel').hide();
      $('#feedback-response-message').text('Failed to get updated BPMN diagram.');
      return false;
    }
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      error.message += ', likely missing an API Key';
    }
    $('#js-feedback-loading-panel').hide();
    $('#feedback-response-message').text(`Error: ${error.message}`);
    console.error(error);
    return false;
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
    $('#response-message').text(`Error: ${error.message}`);
  } finally {
    $('#js-loading-panel').hide();
    $('#js-layout-prompt-panel').hide();
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

  // Generate diagram using LLM
  $('#send-description').click(async function() {
    const success = await generateDiagramWithLLM();
    if(success){ await fixLayout(); }
  });

  // Set example prompts
  const exampleDescriptions = {
    onboarding: "Create a BPMN diagram showing an employee onboarding process. Start with 'Candidate Hired' and include 'Document Collection,' 'Account Setup,' 'Orientation Meeting,' and 'Team Introduction.' End with 'Onboarding Complete.' Include decision points for document completion and account setup approval.",
    orderFulfillment: "Generate a BPMN process for order fulfillment. Begin with 'Order Received' and include 'Inventory Check,' 'Order Packing,' 'Shipping Arrangement,' and 'Order Shipped.' Add a conditional branch for 'Inventory Unavailable' with a sub-process for 'Reorder Stock.' End with 'Order Delivered' confirmation.",
    invoiceApproval: "Create a BPMN diagram for invoice approval. Start with 'Invoice Received,' then include 'Preliminary Check,' 'Approval Request,' and 'Approval by Manager.' Add a decision point for 'Manager Approved?' If yes, proceed to 'Invoice Paid.' If no, loop back to 'Revision Required.'",
    customerSupport: "Illustrate a customer support process in BPMN format. Start with 'Ticket Created,' followed by 'Ticket Categorization,' 'Assign to Agent,' and 'Resolve Issue.' Include decision points for 'Escalation Needed?' leading to 'Escalate to Supervisor' if required. End with 'Ticket Closed.'",
    productDevelopment: "Build a BPMN diagram for a product development process. Start with 'Concept Approval,' then include stages for 'Design,' 'Prototype Development,' 'Testing,' and 'Final Approval.' Add a loop back from 'Testing' to 'Prototype Development' if test results are unsatisfactory. End with 'Product Launch.'",
    expenseReimbursement: "Generate a BPMN diagram for expense reimbursement. Start with 'Expense Submission' and add tasks for 'Expense Review,' 'Manager Approval,' and 'Finance Processing.' Include a conditional branch for 'Receipt Missing?' leading back to 'Request Receipt from Employee.' End with 'Reimbursement Issued.'"
  };

  $('#example-prompt-dropdown').on('change', function() {
    $('#process-description').val(exampleDescriptions[$(this).val()] || '');
  });

    // Display feedback prompt
  $('#feedback-button').click(async function(){
    $('#js-feedback-prompt-panel').show();
  });

  // Use enter to trigger buttons
  $('#process-feedback-description').on('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
      event.preventDefault();
      $('#send-feedback').click();
    }
  });
  $('#process-description').on('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
      event.preventDefault();
      $('#send-description').click();
    }
  });

  // Refine diagram using LLM
  $('#send-feedback').click(async function() {
    $('#js-feedback-prompt-panel').hide();
    const success = await refineDiagramWithLLM();
    if(success){ await fixLayout(); }else{
      $('#feedback-response-message').show();
      // Hide the message after 3 seconds
      setTimeout(() => {
        $('#feedback-response-message').hide();
      }, 3000);
    }
    // Reset text
    $('#process-feedback-description').val('');
  });

  // Cancel feedback
  $('#cancel-feedback').click(async function() {
    $('#js-feedback-prompt-panel').hide();
    $('#process-feedback-description').val('');
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

  //// functions to load diagram and control simulation ////

  // LOAD DIAGRAM
  window.loadDiagram = async (bpmnXml) => {
    try {
      console.log(bpmnXml);
      await openDiagram(bpmnXml);
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

  // PAUSE SIMULATION
  window.pauseSimulation = async () => {
    try {
      // If not paused, pause simulation
      if(!pauseSimulation.isPaused){
        pauseSimulation.pause();
      }else{
        throw new Error('Simulation is already paused.');
      }

      return 'Simulation paused.';
    } catch (error) {
      return 'Pause failed. ' + error.message;
    }
  }

  // RESUME SIMULATION
  window.resumeSimulation = async () => {
    try {
      // If paused, unpause simulation
      if(pauseSimulation.isPaused){
        pauseSimulation.unpause();
      }else{
        throw new Error('Simulation is not paused.');
      }

      return 'Simulation resumed.';
    } catch (error) {
      return 'Resume failed. ' + error.message;
    }
  }

  // RESET SIMULATION
  window.resetSimulation = async () => {
    try { // try-catch not needed here, but maybe later
      // Trigger reset
      eventBus.fire('tokenSimulation.resetSimulation');

      return 'Simulation reset.';
    }catch (error){
      return 'Reset failed. ' + error.message;
    }
  }

  // SEND MESSAGE
  window.sendMessage = async () => {
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
      return 'Message received.';
    }catch (error){
      return 'Message could not be processed. ' + error.message;
    }
  }
});
