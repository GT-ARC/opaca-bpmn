// Get services list extension
import {getBusinessObject} from "bpmn-js/lib/util/ModelUtil";
import {getExtension, createElement} from "../../provider/util";

export function getServicesExtension(element) {
    const businessObject = getBusinessObject(element);
    return getExtension(businessObject, 'vsdt2:Services');
}

// Get services extension entries
export function getServices(element) {
    const businessObject = getBusinessObject(element);
    const services = getServicesExtension(businessObject);
    return services && services.get('values');
}

// Create new service extension
export function createServices(properties, parent, bpmnFactory) {
    return createElement('vsdt2:Services', properties, parent, bpmnFactory);
}

// Get service by name
export function getRelevantServiceProperty(element, serviceId){
    const services = getServices(element);

    // Find the service with the specified id
    const relevantService = services.find(service => service.id === serviceId);

    // Return the service object or an empty string if not found
    return relevantService || '';
}
