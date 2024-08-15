import { getVariablesExtension } from "../variables/util";
import {getExtension, getParentElement, getRelevantBusinessObject, createElement} from "../util";
import {getServices, getServicesExtension} from "../../views/services/util";

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
            variables.push(...currentVariables.map(variable => ({
                name: variable.name,
                type: variable.type,
                category: 'variable' // Mark as a standard variable
            })));
        }

        // Check if the current element has a parent
        const parent = currentElement.$parent;

        if (parent && parent.$parent) {
            collectVariables(parent);
        } else {
            // No parent means we are in bpmn:Definitions
            // Get parameters and results from services
            const servicesExtension = getServicesExtension(parent);
            if (servicesExtension) {
                getServices(parent).forEach(service => {

                    // Add service parameters
                    service.parameters.forEach(param => {
                        variables.push({
                            name: param.name,
                            type: param.type, // Keep the data type
                            category: 'serviceParameter',
                            serviceName: service.name
                        });
                    });

                    // Add service result if it exists
                    if (service.result) {
                        variables.push({
                            name: service.result.name,
                            type: service.result.type, // Keep the data type
                            category: 'serviceResult',
                            serviceName: service.name
                        });
                    }
                });
            }
        }
    }
    collectVariables(rootElement);

    return variables;
}