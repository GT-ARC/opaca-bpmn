import {getExtension, getRelevantBusinessObject, createElement} from "../util";

// Get targets list extension
export function getTargetsExtension(element) {
    const businessObject = getRelevantBusinessObject(element);
    return getExtension(businessObject, 'vsdt2:Targets');
}

// Get targets extension entries
export function getTargets(element) {
    const businessObject = getRelevantBusinessObject(element);
    const targets = getTargetsExtension(businessObject);
    return targets && targets.get('values');
}

// Create new targets extension
export function createTargets(properties, parent, bpmnFactory) {
    return createElement('vsdt2:Targets', properties, parent, bpmnFactory);
}
