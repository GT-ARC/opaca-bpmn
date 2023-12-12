import Ids from 'ids';

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

export function getParametersExtension(element) {
    const businessObject = getBusinessObject(element);
    return getExtension(businessObject, 'assignments_list:Assignments');
}

export function getAssignments(element) {
    const parameters = getParametersExtension(element);
    return parameters && parameters.get('values');
}

export function getExtensionVariables(element){
    //TODO
    const businessObject = getBusinessObject(element).getElementsByTagName('bpmn:Process');

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


export function nextId(prefix) {
    const ids = new Ids([ 32,32,1 ]);

    return ids.nextPrefixed(prefix);
}