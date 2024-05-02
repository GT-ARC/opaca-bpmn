import {getParentElement, getRootElement} from "../provider/util";
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
    const parent = getParentElement(startEventContext.element.di.bpmnElement);

    // if parent is not root, we entered a sub-process
    // which could have additional variables defined
    if(parent!==root){
        const variables = getVariables(parent);
        if(variables){
            variables.forEach(variable => {
                variableMapping[variable.name] = {};
            });
        }
        return;
    }
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
                makeAssignment(assignment);

                const log = {
                    text: assignment.variable + '=' + variableMapping[assignment.variable],
                    icon: 'bpmn-icon-task',
                    scope: {}
                }
                document.dispatchEvent(new CustomEvent('logAssignment', {detail: log}));
            }
        });
    }
    console.log('at', bpmnElement, 'variableMapping: ');
    for(let key in variableMapping){
        console.log(key , ', ', variableMapping[key]);
    }
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

        // Find service in definitions
        const root = getRootElement(element);
        const def = root.$parent;
        const service = getRelevantServiceProperty(def, serviceImpl);
        console.log('service', service);

        // In case we want to call an opaca action /invoke/action is added
        var uri = service.uri;
        if(service.type==='OPACA Action'){
            uri = service.uri + '/invoke/' + service.name;
        }

        var resName;
        if(service.result){
            resName = service.result.name;
        }

        // Collect parameters needed for the request
        const params = {};
        service.parameters.forEach(parameter => {
            if(parameter.name in variableMapping){
                params[parameter.name] = variableMapping[parameter.name];
            }
        });

        // Make service call
        call(uri, service.method, params)
            .then((response) => {
                console.log('Response from service:', response);
                // Assign result
                if(resName){
                    makeAssignment({variable: resName, expression: response});
                }
                resolve(); // Resolve the promise after assigning the result
            })
            .catch((error) => {
                console.error('Error occurred:', error);
                reject(error); // Reject the promise if there's an error
            });
    });
}

// TODO: Error Handling -> Message, Symbol or something?
function call(uri, serviceMethod, params){
    return new Promise((resolve, reject) => {
        var url = uri;
        // In case of GET request, add query parameters
        if (serviceMethod === 'GET' && params) {
            url += `?${new URLSearchParams(params)}`;
        }
        console.log('url ', url);
        console.log('body ', params);

        // Make a request using fetch API
        fetch(url, {
            method: serviceMethod,
            // In case of POST/ PUT/ DELETE add body with parameters
            body: serviceMethod !== 'GET' ? JSON.stringify(params) : undefined,
            headers: {
                "Content-Type": "application/json"
            }
        })
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

//// Helpers ////

// Check if string is valid JSON
function isValidJSON(str) {
    try {
        const parsedJSON = JSON.parse(str);
        return parsedJSON && typeof parsedJSON === 'object';
    } catch (e) {
        console.log(e);
        return false;
    }
}

// Replace variable names inside expression with local mapping.
// May not work for some variable types
function preprocessExpression(expression){
    for (const variable in variableMapping) {
        const regex = new RegExp(`\\b${variable}\\b`, 'g'); // Match whole word
        expression = expression.replace(regex, `variableMapping['${variable}']`);
    }
    return expression;
}

// Evaluate assignment of different expressions
function makeAssignment(assignment){
    if(isValidJSON(assignment.expression)){
        // Object (JSON), collection
        variableMapping[assignment.variable] = JSON.parse(assignment.expression);
    }else if(assignment.expression.startsWith('"')){
        // String
        variableMapping[assignment.variable] = assignment.expression;
    }else{
        // Other (primitive, operations)
        const processedAssignment = preprocessExpression(assignment.expression);
        variableMapping[assignment.variable] = eval(processedAssignment);
    }
}