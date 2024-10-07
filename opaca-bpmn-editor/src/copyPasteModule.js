import { getAssignments } from './provider/assignments/util';
import {getVariables, getVariablesExtension} from './provider/variables/util';
import { isPaste } from 'diagram-js/lib/features/keyboard/KeyboardUtil';
import {is} from "bpmn-js-token-simulation/lib/simulator/util/ModelUtil";
import {getServices, getServicesExtension} from "./views/services/util";
import {createElement, getRootElement} from "./provider/util";

// Native Copy-Paste Module
export const nativeCopyModule = {
    __init__: ['nativeCopyPaste'],
    nativeCopyPaste: ['type', function (
        keyboard, eventBus,
        moddle, clipboard, elementRegistry, bpmnFactory, commandStack
    ) {

        function collectReferences(elements) {
            // Here elements are only the copied elements
            if (!elements){
                console.error('Expected an array of elements');
                return;
            }
            const varRefs = {}, serviceRefs = {};

            const firstElement = elements[0];
            const process = getRootElement(elementRegistry.get(firstElement.id));
            const variables = getVariables(process);

            const definitions = process.$parent;
            const services = getServices(definitions);

            elements.forEach(element => {
                // See which variables have assignments in copied elements
                const assignments = getAssignments(element);
                if(assignments){
                    assignments.forEach(assignment => {
                        if(variables){
                            variables.forEach(variable => {
                                if(variable.name === assignment.variable){
                                    varRefs[variable.name] = variable;
                                }
                            });
                        }
                    });
                }
                // See which services are referenced in copied service tasks
                if(is(element, 'bpmn:ServiceTask')){
                    const serviceImpl = element.businessObject.serviceImpl;
                    services.forEach(service => {
                        if(service.id === serviceImpl){
                            // Service is referenced by id, but we use name as key
                            serviceRefs[service.name] = service;
                        }
                    })
                }
            });
            return {varRefs, serviceRefs};
        }

        // Persist into local storage whenever copy takes place
        eventBus.on('copyPaste.elementsCopied', event => {
            const { tree } = event;

            // Collect all references
            const {varRefs, serviceRefs} = collectReferences(tree[0]);

            // Combine tree and references
            const copyPayload = {
                tree,
                varRefs,
                serviceRefs
            };
            //console.log('PUT localStorage', tree, varRefs, serviceRefs);

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
            const { tree, varRefs, serviceRefs } = JSON.parse(serializedCopy, createReviver(moddle));
            //console.log('GET localStorage', tree, varRefs, serviceRefs);

            if (Object.keys(varRefs).length < 1 && Object.keys(serviceRefs).length < 1) {
                clipboard.set(tree);
                //console.log('no refs found.');
                return;
            }

            const commands = [];

            const targetProcess = elementRegistry.getAll()[0];
            const processBusinessObj = targetProcess.businessObject;
            const definitions = processBusinessObj.$parent;

            // Ensure extensionElements for process
            let extensionElements = processBusinessObj.get('extensionElements');
            if (!extensionElements && Object.keys(varRefs).length > 0) {
                extensionElements = createElement(
                    'bpmn:ExtensionElements',
                    { values: [] },
                    processBusinessObj,
                    bpmnFactory
                );
                commands.push({
                    cmd: 'element.updateModdleProperties',
                    context: {
                        element: targetProcess,
                        moddleElement: processBusinessObj,
                        properties: { extensionElements }
                    }
                });
            }
            // Ensure extensionElements for definitions
            let defExtensionElements = definitions.get('extensionElements');
            if (!defExtensionElements && Object.keys(serviceRefs).length > 0) {
                defExtensionElements = createElement(
                    'bpmn:ExtensionElements',
                    { values: [] },
                    definitions,
                    bpmnFactory
                );

                commands.push({
                    cmd: 'element.updateModdleProperties',
                    context: {
                        element: targetProcess,
                        moddleElement: definitions,
                        properties: { extensionElements: defExtensionElements }
                    }
                });
            }

            // Ensure variablesExtension
            let variablesExtension = getVariablesExtension(processBusinessObj);
            if (!variablesExtension && Object.keys(varRefs).length > 0) {
                variablesExtension = createElement(
                    'vsdt2:Variables',
                    { values: [] },
                    extensionElements,
                    bpmnFactory
                );
                commands.push({
                    cmd: 'element.updateModdleProperties',
                    context: {
                        element: targetProcess,
                        moddleElement: extensionElements,
                        properties: {
                            values: [...extensionElements.get('values'), variablesExtension]
                        }
                    }
                });
            }

            // Ensure servicesExtension
            let servicesExtension = getServicesExtension(definitions);
            if (!servicesExtension && Object.keys(serviceRefs).length > 0) {
                servicesExtension = createElement(
                    'vsdt2:Services',
                    { values: [] },
                    defExtensionElements,
                    bpmnFactory
                );

                commands.push({
                    cmd: 'element.updateModdleProperties',
                    context: {
                        element: targetProcess,
                        moddleElement: defExtensionElements,
                        properties: {
                            values: [...defExtensionElements.get('values'), servicesExtension]
                        }
                    }
                });
            }

            // Create new variables
            const newVariables = Object.keys(varRefs).map(key => {

                const reference = varRefs[key];
                // If not already existing
                if(!getVariables(targetProcess) || !getVariables(targetProcess).find(variable => variable.name === key)){

                    return createElement('vsdt2:Variable', {
                        name: reference.name,
                        type: reference.type
                    }, variablesExtension, bpmnFactory);
                }
            }).filter(Boolean);  // Remove undefined/null entries

            // Create new services
            const newServices = Object.keys(serviceRefs).map(key => {

                const reference = serviceRefs[key];
                const existingServices = getServices(definitions);
                // If not already existing
                if(!existingServices || !existingServices.find(service => service.name === key)){
                    const newService = createElement('vsdt2:Service', {
                        type: reference.type,
                        uri: reference.uri,
                        method: reference.method,
                        name: reference.name,
                        id: reference.id
                    }, servicesExtension, bpmnFactory);

                    if (reference.result && reference.result.name !== '') {
                        const newResult = createElement('vsdt2:Result', {
                            name: reference.result.name,
                            type: reference.result.type
                        }, newService, bpmnFactory);

                        newService.result = newResult;
                    }

                    if (reference.parameters) {
                        const params = reference.parameters.map(param =>
                            createElement('vsdt2:Parameter', {
                                name: param.name,
                                type: param.type
                            }, newService, bpmnFactory)
                        );
                        newService.parameters = params;
                    }
                    return newService;
                }else{
                    // Adjust serviceImpl to existing service

                    const existingService = existingServices.find(service => service.name === key);

                    // In tree, find serviceTask with serviceImpl === reference.id
                    tree[0].forEach(element => {
                        if (element.businessObject.$type === 'bpmn:ServiceTask' && element.businessObject.serviceImpl === reference.id) {
                            // Set serviceImpl of serviceTask to the existing service's id
                            element.businessObject.serviceImpl = existingService.id;
                            console.log(`Updated serviceImpl of ServiceTask to ${existingService.id}`);
                        }
                    });
                }
            }).filter(Boolean);  // Remove undefined/null entries

            // Update variablesExtension
            if(newVariables && newVariables.length > 0){
                commands.push({
                    cmd: 'element.updateModdleProperties',
                    context: {
                        element: targetProcess,
                        moddleElement: variablesExtension,
                        properties: {
                            values: [...variablesExtension.get('values'), ...newVariables]
                        }
                    }
                });
            }

            // Update servicesExtension
            if(newServices && newServices.length > 0){
                commands.push({
                    cmd: 'element.updateModdleProperties',
                    context: {
                        element: targetProcess,
                        moddleElement: servicesExtension,
                        properties: {
                            values: [...servicesExtension.get('values'), ...newServices]
                        }
                    }
                });
            }

            // Execute commands (Set properties)
            commandStack.execute('properties-panel.multi-command-executor', commands);

            // Create entries in service view
            eventBus.fire('import.done');

            // Put into clipboard (Paste elements)
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