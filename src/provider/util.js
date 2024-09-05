import {getBusinessObject, is} from "bpmn-js/lib/util/ModelUtil";
import Ids from "ids";
import {find} from "min-dash";

// Get diagram root/ element with the greatest scope
export function getRootElement(element) {
    const businessObject = getBusinessObject(element);

    if (is(businessObject, 'bpmn:Participant')) {
        return businessObject.processRef;
    }

    if (is(businessObject, 'bpmn:Process')) {
        return businessObject;
    }

    if(is(businessObject, 'bpmn:Collaboration')){
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

// Get id used for generated names
export function nextId(prefix) {
    const ids = new Ids([ 32,32,1 ]);

    return ids.nextPrefixed(prefix);
}

// Get event definition
export function getEventDefinition(element, eventType) {
    const businessObject = getBusinessObject(element);

    const eventDefinitions = businessObject.get('eventDefinitions') || [];

    return find(eventDefinitions, function(definition) {
        return is(definition, eventType);
    });
}

// Get names of custom datatypes defined in 'resources/datatypes'
export function getDataTypes(){
    // Get context created by Webpack
    const datatypesContext = require.context('datatypes', false, /\.json$/);
    // Return filenames without .json extension
    return datatypesContext.keys().map(key => key.replace(/^\.\//, '').replace(/\.json$/, ''));
}