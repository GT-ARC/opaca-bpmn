import {getExtension, getRelevantBusinessObject, createElement} from "../../util";

// Get payloads list extension
export function getPayloadsExtension(element) {
    const businessObject = getRelevantBusinessObject(element);
    return getExtension(businessObject, 'vsdt2:Payloads');
}

// Get payloads extension entries
export function getPayloads(element) {
    const businessObject = getRelevantBusinessObject(element);
    const payloads = getPayloadsExtension(businessObject);
    return payloads && payloads.get('values');
}

// Create new payloads extension
export function createPayloads(properties, parent, bpmnFactory) {
    return createElement('vsdt2:Payloads', properties, parent, bpmnFactory);
}
