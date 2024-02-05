import {getBusinessObject} from "bpmn-js/lib/util/ModelUtil";
import {createElement, getExtension} from "../../provider/util";
import {get, without} from "min-dash";

export function addFactory(element, bpmnFactory, commandStack, service) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getBusinessObject(element);
    let extensionElements = businessObject.get('extensionElements');

    // (1) ensure extension elements
    if (!extensionElements) {
        extensionElements = createElement(
            'bpmn:ExtensionElements',
            {values: []},
            businessObject,
            bpmnFactory
        );

        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: businessObject,
                properties: {extensionElements}
            }
        });
    }

    // (2) ensure services extension
    let extension = getServicesExtension(businessObject);

    if (!extension) {
        extension = createServices({
            values: []
        }, extensionElements, bpmnFactory);

        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: extensionElements,
                properties: {
                    values: [...extensionElements.get('values'), extension]
                }
            }
        });
    }

    // (3) create service
    const newService = createElement('vsdt2:Service', {
        type: service.type,
        uri: service.uri,
        name: service.name,
        id: service.id
    }, extension, bpmnFactory);

    // (4) add service to list
    commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
            element,
            moddleElement: extension,
            properties: {
                values: [...extension.get('values'), newService]
            }
        }
    });
    commandStack.execute('properties-panel.multi-command-executor', commands);
}

// Removing an entry of services list
export function removeFactory(commandStack, element, service) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getBusinessObject(element);
    const extensionElements = businessObject.get('extensionElements');
    const extension = getServicesExtension(businessObject);

    if (!extension) {
        return;
    }

    // Services list without entry we want to remove
    const services = without(extension.get('values'), service);
    // Updating element properties
    commands.push({
        cmd : 'element.updateModdleProperties',
        context : {
            element,
            moddleElement: extension,
            properties: {
                values: services
            }
        }
    });

    // Remove if variables list is empty
    if(!services.length){

        commands.push({
            cmd : 'element.updateModdleProperties',
            context : {
                element,
                moddleElement : extensionElements,
                properties : {
                    values : without(extensionElements.get('values'), extension)
                }
            }
        })
    }
    commandStack.execute('properties-panel.multi-command-executor', commands);
}

// Helper

// Get services list extension
export function getServicesExtension(element) {
    const businessObject = getBusinessObject(element);
    return getExtension(businessObject, 'vsdt2:Services');
}

// Get services extension entries
export function getServices(element) {
    const businessObject = getBusinessObject(element);
    const services = getServicesExtension(businessObject);
    return services && services.get('values');
}

// Create new service extension
export function createServices(properties, parent, bpmnFactory) {
    return createElement('vsdt2:Services', properties, parent, bpmnFactory);
}

// Get service by name
export function getRelevantServiceProperty(element, serviceId){
    const services = getServices(element);

    // Find the service with the specified id
    const relevantService = services.find(service => service.id === serviceId);

    // Return the service object or an empty string if not found
    return relevantService || '';
}