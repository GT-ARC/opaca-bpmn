import { getVariablesExtension } from "../variables/util";
import {getExtension, getParentElement, getRelevantBusinessObject, createElement} from "../util";

// Get assignment list extension
export function getAssignmentsExtension(element) {
    const businessObject = getRelevantBusinessObject(element);
    return getExtension(businessObject, 'vsdt2:Assignments');
}

// Get assignments extension entries
export function getAssignments(element) {
    const assignments = getAssignmentsExtension(element);
    return assignments && assignments.get('values');
}

// Create new assignment extension
export function createAssignments(properties, parent, bpmnFactory) {
    return createElement('vsdt2:Assignments', properties, parent, bpmnFactory);
}

// Get all defined process/ subprocess variables for drop-down
export function getAllVariables(element) {

    const rootElement = getParentElement(element);

    const variables = [];

    function collectVariables(currentElement) {
        const extension = getVariablesExtension(currentElement);

        if (extension) {
            const currentVariables = extension.values || [];
            variables.push(...currentVariables);
        }

        // Check if the current element has a parent
        const parent = currentElement.$parent;

        if (parent && parent.$parent) {
            collectVariables(parent);
        }
    }
    collectVariables(rootElement);

    return variables;
}