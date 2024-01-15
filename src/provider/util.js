import {getBusinessObject, is} from "bpmn-js/lib/util/ModelUtil";

// Get diagram root/ element with the greatest scope
export function getRootElement(element) {
    const businessObject = getBusinessObject(element);

    if (is(businessObject, 'bpmn:Participant')) {
        return businessObject.processRef;
    }

    if (is(businessObject, 'bpmn:Process')) {
        return businessObject;
    }

    let parent = businessObject;

    while (parent.$parent && !is(parent, 'bpmn:Process')) {
        parent = parent.$parent;
    }
    return parent;
}

// Get parent of element
export function getParentElement(element) {
    const businessObject = getBusinessObject(element);

    if (is(businessObject, 'bpmn:Participant')) {
        return businessObject.processRef;
    }

    if (is(businessObject, 'bpmn:Process')) {
        return businessObject;
    }

    if(is(businessObject, 'bpmn:SubProcess')){
        return businessObject;
    }
    return getParentElement(businessObject.$parent);
}

// If element is participant, get process ref
// Most properties should not be saved for participant, but process instead
export function getRelevantBusinessObject(element) {
    let businessObject = getBusinessObject(element);

    if (is(element, 'bpmn:Participant')) {
        return businessObject.get('processRef');
    }
    return businessObject;
}

// Get extension of type
export function getExtension(element, type) {
    if (!element.extensionElements) {
        return null;
    }

    return element.extensionElements.values.filter(function(e) {
        return e.$instanceOf(type);
    })[0];
}

// Create a new property of specified prototype and add to parent (e.g. extensionElements)
export function createElement(elementType, properties, parent, factory) {
    const element = factory.create(elementType, properties);

    if (parent) {
        element.$parent = parent;
    }
    return element;
}