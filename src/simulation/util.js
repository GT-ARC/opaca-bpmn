import {getRootElement} from "../provider/util";
import {getRelevantServiceProperty, getServices} from "../views/services/util";
import {getVariables} from "../provider/variables/util";
import {getAssignments} from "../provider/assignments/util";

// variable, value
const variableMapping = {};

// Create local mapping for variables defined in root
// and parameters and results of services.
// Called in StartEvent
export function initializeVariables(startEventContext){
    const root = getRootElement(startEventContext.element.di.bpmnElement);
    const def = root.$parent;

    const variables = getVariables(root);
    if(variables){
        variables.forEach(variable => {
            variableMapping[variable.name] = {};
        });
    }
    const services = getServices(def);
    if(services){
        services.forEach(service => {
            if(service.parameters){
                service.parameters.forEach(parameter => {
                    variableMapping[parameter.name] = {};
                });
            }
            if(service.result){
                variableMapping[service.result.name] = {};
            }
        });
    }
    console.log('variableMapping: ');
    for(let key in variableMapping){
        console.log(key , ', ', variableMapping[key]);
    }
}

// TODO
// Create local mapping for variables defined in participants and sub-processes
export function addVariables(element){
    const bpmnElement =element.di.bpmnElement;

    getVariables(bpmnElement).forEach(variable => {
        variableMapping[variable.name] = {};
    });
    console.log('variableMapping: ');
    for(let key in variableMapping){
        console.log(key , ', ', variableMapping[key]);
    }
}

// Evaluate condition
export function evaluateCondition(condition){

    console.log('Evaluating condition');
    console.log('condition: ', condition);
    const processedCondition = preprocessExpression(condition);
    console.log('processed condition: ', processedCondition);
    console.log('evaluation: ', eval(processedCondition));
    return eval(processedCondition);
}

// Make assignment to a variable at assignTime
export function updateVariables(element, assignTime){
    const bpmnElement = element.di.bpmnElement;

    const assignments = getAssignments(bpmnElement);
    if(assignments){
        assignments.forEach(assignment => {
            if(assignment.assignTime === assignTime){
                const processedAssignment = preprocessExpression(assignment.expression);
                variableMapping[assignment.variable] = eval(processedAssignment);
                console.log(assignTime, assignment.variable, '->', eval(processedAssignment));
            }
        });
    }
    console.log('at', bpmnElement, 'variableMapping: ');
    for(let key in variableMapping){
        console.log(key , ', ', variableMapping[key]);
    }
}

// Replace variable names inside expression with local mapping.
// Will not work for some variable types (i.e. Collections)
function preprocessExpression(expression){
    for (const variable in variableMapping) {
        const regex = new RegExp(`\\b${variable}\\b`, 'g'); // Match whole word
        expression = expression.replace(regex, `variableMapping['${variable}']`);
    }
    return expression;
}

// Call service defined in ServiceTask.
// Update result value
export function callService(element){
    return new Promise((resolve, reject) => {
        // Get serviceImplementation of service task
        const bpmnElement = element.di.bpmnElement;
        const serviceImpl = bpmnElement.service;
        if(!serviceImpl){
            reject(new Error('Service implementation not found'));
            return;
        }
        console.log('serviceImpl', serviceImpl);

        // Find service in definitions
        const root = getRootElement(element);
        const def = root.$parent;
        const service = getRelevantServiceProperty(def, serviceImpl);
        console.log('service', service);
        const uri = service.uri;
        const resName = service.result.name;
        const params = {};
        service.parameters.forEach(parameter => {
            if(parameter.name in variableMapping){
                params[parameter.name] = variableMapping[parameter.name];
            }
        });

        var result = '';
        // Make service call
        call(uri, params)
            .then((response) => {
                console.log('Response from service:', response);
                // Assign result
                result = response;
                variableMapping[resName] = eval(result); // Assuming the response is a string representing JavaScript code
                resolve(); // Resolve the promise after assigning the result
            })
            .catch((error) => {
                console.error('Error occurred:', error);
                reject(error); // Reject the promise if there's an error
            });
    });
}

function call(uri, params){
    return new Promise((resolve, reject) => {
        // Construct the request URL with parameters
        const url = `${uri}?${new URLSearchParams(params)}`;
        console.log('url ', url);

        // Make a GET request using fetch API
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            });
    });
}
