import {getParentElement, getRootElement} from "../provider/util";
import {getRelevantServiceProperty, getServices} from "../views/services/util";
import {getVariables} from "../provider/variables/util";
import {getAssignments} from "../provider/assignments/util";
import {is} from "bpmn-js/lib/util/ModelUtil";
import {call} from "../opacaUtil";

// variable, value mapped to each scope (variableMapping[scopeId][variableName])
const variableMapping = {};

// Create local mapping for variables defined in root
// and parameters and results of services.
// Called in StartEvent
export function initializeVariables(startEventContext){
    const parentScopeId = startEventContext.parentScope.id;

    if (!variableMapping[parentScopeId]) {
        variableMapping[parentScopeId] = {};
    }
    const root = getRootElement(startEventContext.element.di.bpmnElement);
    const parent = getParentElement(startEventContext.element.di.bpmnElement);

    // if parent is not root, we entered a sub-process
    // which could have additional variables defined
    if(parent!==root){
        const variables = getVariables(parent);
        if(variables){
            variables.forEach(variable => {
                variableMapping[parentScopeId][variable.name] = {};
            });
        }
        return;
    }
    const def = root.$parent;

    const variables = getVariables(root);
    if(variables){
        variables.forEach(variable => {
            variableMapping[parentScopeId][variable.name] = {};
        });
    }
    const services = getServices(def);
    if(services){
        services.forEach(service => {
            if(service.parameters){
                service.parameters.forEach(parameter => {
                    variableMapping[parentScopeId][parameter.name] = {};
                });
            }
            if(service.result){
                variableMapping[parentScopeId][service.result.name] = {};
            }
        });
    }
}

// Evaluate condition
export function evaluateCondition(condition, scope){
    const parentScopeId = scope.parent.id;
    const processedCondition = preprocessExpression(condition, parentScopeId);
    return eval(processedCondition);
}

// Make assignment to a variable at assignTime
export function updateVariables(element, assignTime, scope){
    const parentScope = scope.parent;

    const bpmnElement = element.di.bpmnElement;

    const assignments = getAssignments(bpmnElement);
    if(assignments){
        assignments.forEach(assignment => {
            if(assignment.assignTime === assignTime){
                makeAssignment(assignment, parentScope.id);

                logAssignment(assignment.variable, bpmnElement, parentScope);
            }
        });
    }
}

// Call service defined in ServiceTask.
// Update result value
export function callService(element, scope) {
    const parentScope = scope.parent;
    return new Promise((resolve, reject) => {
        // Get serviceImplementation of service task
        const bpmnElement = element.di.bpmnElement;
        const serviceImpl = bpmnElement.serviceImpl;
        if(!serviceImpl){
            reject(new Error('Service implementation not found'));
            return;
        }

        // Find service in definitions
        const root = getRootElement(element);
        const def = root.$parent;
        const service = getRelevantServiceProperty(def, serviceImpl);

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
            if (parameter.name in variableMapping[parentScope.id]) {
                params[parameter.name] = variableMapping[parentScope.id][parameter.name];
            }
        });

        // Make service call
        call(uri, service.method, params)
            .then((response) => {
                console.log('Response from service:', response);
                // Assign result
                if(resName){
                    makeAssignment({variable: resName, expression: response}, parentScope.id);
                    logAssignment(resName, element, parentScope);
                }
                resolve(); // Resolve the promise after assigning the result
            })
            .catch((error) => {
                alert(error);
                reject(error); // Reject the promise if there's an error
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
        return false;
    }
}

// Replace variable names inside expression with local mapping.
// May not work for some variable types
function preprocessExpression(expression, parentScopeId) {
    for (const variable in variableMapping[parentScopeId]) {
        const regex = new RegExp(`\\b${variable}\\b`, 'g'); // Match whole word
        expression = expression.replace(regex, `variableMapping['${parentScopeId}']['${variable}']`);
    }
    return expression;
}

// Evaluate assignment of different expressions
function makeAssignment(assignment, parentScopeId) {
    try {
        if (isValidJSON(assignment.expression)) {
            // Object (JSON), collection
            variableMapping[parentScopeId][assignment.variable] = JSON.parse(assignment.expression);
        } else if (assignment.expression.startsWith('"')) {
            // String (unquoted)
            variableMapping[parentScopeId][assignment.variable] = assignment.expression.replace(/"(.*)"/g, "$1");
        } else {
            // Other (primitive, operations)
            const processedAssignment = preprocessExpression(assignment.expression, parentScopeId);
            variableMapping[parentScopeId][assignment.variable] = eval(processedAssignment);
        }
    }catch (err){
        alert(`Assignment failed: ${err}`);
    }
}

// Create log element with assignment info and trigger log event
function logAssignment(variable, element, parentScope){

    const log = {
        // indent text
        text: '&nbsp;&nbsp;&nbsp;&nbsp;' + variable + ' = ' + variableMapping[parentScope.id][variable],
        icon: 'bpmn-icon-task',
        scope: parentScope
    }

    // Adjust icon
    if(is(element, 'bpmn:StartEvent')){
        log.icon = 'bpmn-icon-start-event-none';

    }else if(is(element, 'bpmn:ServiceTask')){
        log.icon = 'bpmn-icon-service';

    }else if(is(element, 'bpmn:EndEvent')){
        log.icon = 'bpmn-icon-end-event-none';
    }
    // Dispatch
    document.dispatchEvent(new CustomEvent('logAssignment', {detail: log}));
}