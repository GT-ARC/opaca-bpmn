import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { getVariablesExtension } from "../variables/util";

export function getAssignmentsExtension(element) {
    const businessObject = getBusinessObject(element);
    return getExtension(businessObject, 'assignments_list:Assignments');
}

export function getAssignments(element) {
    const assignments = getAssignmentsExtension(element);
    return assignments && assignments.get('values');
}


export function getExtension(element, type) {
    if (!element.extensionElements) {
        return null;
    }

    return element.extensionElements.values.filter(function(e) {
        return e.$instanceOf(type);
    })[0];
}

export function createElement(elementType, properties, parent, factory) {
    const element = factory.create(elementType, properties);

    if (parent) {
        element.$parent = parent;
    }

    return element;
}

export function createAssignments(properties, parent, bpmnFactory) {
    return createElement('assignments_list:Assignments', properties, parent, bpmnFactory);
}

export function getParentElement(element) {
    // Implementation to get the parent element
    const businessObject = getBusinessObject(element);

    if (is(businessObject, 'bpmn:Participant')) {
        return businessObject.processRef;
        // TODO
    }

    if (is(businessObject, 'bpmn:Process')) {
        return businessObject;
    }

    if(is(businessObject, 'bpmn:SubProcess')){
        return businessObject;
    }
    return getParentElement(businessObject.$parent);
}


export function getAllVariables(element) {

    const rootElement = getParentElement(element);

    const variables = [];

    function collectVariables(currentElement) {
        //const extension = getAssignmentsExtension(currentElement);
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