import {getExtension, getRelevantBusinessObject, createElement, } from "../util";

// Get variables list extension
export function getVariablesExtension(element) {
    const businessObject = getRelevantBusinessObject(element);
    return getExtension(businessObject, 'vsdt2:Variables');
}

// Get variables extension entries
export function getVariables(element) {
    const businessObject = getRelevantBusinessObject(element);
    const variables = getVariablesExtension(businessObject);
    return variables && variables.get('values');
}

// Create new variable extension
export function createVariables(properties, parent, bpmnFactory) {
    return createElement('vsdt2:Variables', properties, parent, bpmnFactory);
}
