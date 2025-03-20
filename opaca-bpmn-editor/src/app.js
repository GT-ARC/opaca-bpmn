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
import payloadsListProviderModule from './provider/messagePayloads';
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
    payloadsListProviderModule,
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

// Hide llm prompt elements, if llm or api key not present
async function fetchConfig() {
  try {
    console.log('Fetching LLM Backend config...');
    const response = await fetch(process.env.LLM_BACKEND + '/config');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const appConfig = await response.json();

    if(!appConfig.llm_api_key_present){
      throw new Error('No api key present.');
    }

    // Show optional elements
    $('.llm-backend-present').show();
    $('.llm-backend-not-present').hide();

    console.log('LLM Backend ready.');
  } catch (error) {
    console.log('LLM Backend not found.');
  }
}

var sessionId = '';
var extensionSessionId = '';

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
    console.log(sessionId);
    extensionSessionId = data.extension_session_id;
    console.log(extensionSessionId);

    const bpmnXml = data.bpmn_xml;
    console.log(bpmnXml);

    if(bpmnXml) {
      $('#js-loading-panel').hide();
      $('#js-drop-zone').show();
      openDiagram(bpmnXml);
      $('#js-layout-prompt-panel').show();
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

    const response = await fetch(process.env.LLM_BACKEND + '/update_process_model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedback_text: feedbackText,
        session_id: sessionId,
        extension_session_id: extensionSessionId,
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
    // Save extension session id
    extensionSessionId = data.extension_session_id;
    // console.log(bpmnXml);

    if (bpmnXml) {
      console.log('New diagram', bpmnXml);
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
  // Add version and build date
  $('#version-info').text(`Version: ${process.env.APP_VERSION} (Built: ${process.env.BUILD_DATE})`);

  // Check if llm backend and api key present
  fetchConfig();

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

      // Inject version info into <bpmn2:definitions>
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');

      // Create the comment
      const commentText = `appVersion: ${process.env.APP_VERSION}, buildDate: ${process.env.BUILD_DATE}`;
      const commentNode = xmlDoc.createComment(commentText);

      // Insert the comment at the beginning of the document
      xmlDoc.insertBefore(commentNode, xmlDoc.documentElement);

      // Serialize XML back to string
      const serializer = new XMLSerializer();
      const updatedXml = serializer.serializeToString(xmlDoc);

      setEncoded(downloadLink, 'diagram.bpmn', updatedXml);
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


  // When starting simulation
  eventBus.on('tokenSimulation.toggleMode', function() {
    // Move buttons behind logs
    if(!toggleMode._active){
      // Also makes them non-clickable during simulation
      $('.buttons').css('z-index', '-1');
    }else{
      $('.buttons').css('z-index', '');
    }

    const root = elementRegistry.getAll().filter(el => is(el, 'bpmn:Process'))[0];

    // Info for non-executable process
    if(root && !root.businessObject.isExecutable && !toggleMode._active){
      console.warn('Process not marked as executable. Using standard Token Simulation.');
    }
  });

  //// functions to load diagram and control simulation ////

  // LOAD DIAGRAM
  window.loadDiagram = async (bpmnXml) => {
    try {
      console.log(bpmnXml);
      await openDiagram(bpmnXml);
      // Prepare for timer/message start events
      toggleMode.toggleMode(true);

      return 'ok';
    } catch (error) {
      console.error('Error loading BPMN diagram:', error.message);
      return error.message;
    }
  };

  // START SIMULATION
  window.startSimulation = async (waitToFinish) => {
    try{
      if(!toggleMode._active){
        toggleMode.toggleMode(true);
      }
      // Find (the first) start event
      const elements = elementRegistry.getAll();
      const startEvent = elements.find(el => is(el, 'bpmn:StartEvent'));

      // Trigger start event
      simulationSupport.triggerElement(startEvent.id);

      console.log(`Started Simulation at ${startEvent.id}`);

      if (waitToFinish) {
        // Set up listener to detect when the token exits an EndEvent
        let endEventReached = false;
        return new Promise((resolve, reject) => {

          eventBus.on('trace.elementExit', (event) => {
            const element = event.element;

            // Check if the exited element is an EndEvent
            if (is(element, 'bpmn:EndEvent') && !endEventReached) {
              endEventReached = true;
              console.log(`Simulation completed at EndEvent: ${element.id}`);

              resolve('ok');
            }
          });
        });
      }

      return 'ok';
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

      console.log('Paused Simulation.');
      return 'ok';
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

      console.log('Resumed Simulation.');
      return 'ok';
    } catch (error) {
      return 'Resume failed. ' + error.message;
    }
  }

  // RESET SIMULATION
  window.resetSimulation = async () => {
    try {
      // Trigger reset
      eventBus.fire('tokenSimulation.resetSimulation');

      console.log('Reset Simulation.');
      return 'ok';
    }catch (error){
      return 'Reset failed. ' + error.message;
    }
  }

  // SEND MESSAGE
  window.sendMessage = async (messageReference, messageContent) => {
    try {
      eventBus.fire('interpretation.sendMessage',
          {messageReferance: messageReference, messageContent: messageContent});
      return 'ok';

    }catch(error){
      return 'Message could not be processed. ' + error.message;
    }
  }

  // SEND SIGNAL
  window.sendSignal = async (signalReference) => {
    try{
      eventBus.fire('interpretation.sendSignal', {signalReference: signalReference});
      return 'ok';

    }catch(error){
      return 'Signal could not be processed. ' + error.message;
    }
  }

  // TODO broadcast
  eventBus.on('interpretation.broadcastSignal', (event) => {

    const {signalReference} = event;
    console.log(`BROADCAST_SIGNAL: ${signalReference}`);
  })
});
