import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

export function getAssignmentsExtension(element) {
    const businessObject = getBusinessObject(element);
    return getExtension(businessObject, 'assignments_list:Assignments');
}

export function getAssignments(element) {
    const parameters = getAssignmentsExtension(element);
    return parameters && parameters.get('values');
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