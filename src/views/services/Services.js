import {getBusinessObject} from "bpmn-js/lib/util/ModelUtil";
import {createElement} from "../../provider/util";
import {without} from "min-dash";
import {createServices, getServicesExtension} from "./util";

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

    // (3.1) create service
    const newService = createElement('vsdt2:Service', {
        type: service.type,
        uri: service.uri,
        method: service.method,
        name: service.name,
        id: service.id
    }, extension, bpmnFactory);

    if(service.result.name!==''){
        // (3.2) create result
        const newResult = createElement('vsdt2:Result', {
            name: service.result.name,
            type: service.result.type
        }, newService, bpmnFactory);

        // (3.3) add result to service
        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: newService,
                properties: {
                    result: newResult
                }
            }
        });
    }

    if(service.parameters){
        // (3.4) create parameters
        const params = [];
        service.parameters.forEach(param => {
            const newParam = createElement('vsdt2:Parameter', {
                name: param.name,
                type: param.type
            }, newService, bpmnFactory);
            params.push(newParam);
        });
        // (3.5) add parameters to service
        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: newService,
                properties: {
                    parameters: params
                }
            }
        });
    }

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
