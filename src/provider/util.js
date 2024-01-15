import {getBusinessObject, is} from "bpmn-js/lib/util/ModelUtil";

export function getRootElement(element) {
    // Implementation to get the root element
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
