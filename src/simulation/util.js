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
    return restrictedEval(condition, parentScopeId);
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
                //alert(error);
                reject(error); // Reject the promise if there's an error
            });
    });
}


//// Helpers ////

// Evaluate assignment of different expressions
function makeAssignment(assignment, parentScopeId) {
    try {
        variableMapping[parentScopeId][assignment.variable] = restrictedEval(assignment.expression, parentScopeId);
    }catch (err){
        alert(`Assignment failed: ${err}`);
    }
}

// Here we can put functions to be assigned in the process design
const context = {
    log: (msg) => console.log(msg),
    alert: (msg) => alert(msg),
    sum: (a, b) => a+b
}

// List of allowed operators
const operators = ['+', '-', '*', '/', '(', ')', '>', '<', '!', '=', ',', ':', ';', '{', '}', '[', ']', '|', '&'];

function isNumber(token) {
    return !isNaN(parseFloat(token)) && isFinite(token);
}

function isOperator(token) {
    return operators.includes(token);
}

function isBoolean(token) {
    return token === "true" || token === "false";
}

function isString(token){
    return /^("[^"]*"|'[^']*')$/.test(token);
}

// Replace variable by variableMapping or predefined function
function validateAndReplaceTokens(tokens, parentScope){
    return tokens.map(token => {
        if (isNumber(token) || isOperator(token) || isBoolean(token) || isString(token)) {
            return token; // Valid number, operator, boolean or string
        } else if(token.startsWith('.') || token.endsWith(':')) {
            return token; // Property access
        } else if (variableMapping[parentScope] && variableMapping[parentScope].hasOwnProperty(token)) {
            return `variableMapping['${parentScope}']['${token}']`; // Replace with variable mapping
        } else if (context.hasOwnProperty(token)) {
            return `context['${token}']`; // Allow function from context
        } else {
            throw new Error(`No access to ${token}!`); // Invalid token
        }
    });
}

function tokenizeExpression(expression){
    // Split the expression into tokens
    const tokens = expression.match(/("[^"]*"|'[^']*'|\w+:|\d+|\w+|\.\w+|[^\w\s])/g);
    //console.log(tokens);
    return tokens;
}

// Match expression before calling eval
function restrictedEval(expression, parentScope){
    const tokens = tokenizeExpression(expression, parentScope);
    const validatedTokens = validateAndReplaceTokens(tokens, parentScope);
    const validatedExpression = validatedTokens.join('');
    //console.log('Validated: ', validatedExpression);

    // Parentheses ensure it is treated as an expression, not a block
    return eval('(' + validatedExpression + ')');
}

// Create log element with assignment info and trigger log event
function logAssignment(variable, element, parentScope){

    // the " -> ' is needed because otherwise the tooltip ends with the first "
    const readableValue = JSON.stringify(variableMapping[parentScope.id][variable], null, 2).replace(/"/g, "'")
    const log = {
        // indent text
        text: `&nbsp;&nbsp; ${variable} = ${readableValue}`,
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

//// For testing variableUpdates only ////
export function addVariable(variable, parentScopeId){
    if(!variableMapping[parentScopeId]){
        variableMapping[parentScopeId] = {};
    }
    variableMapping[parentScopeId][variable.name] = variable.value;
}

export function assignAndGet(assignment, parentScopeId){
    makeAssignment(assignment, parentScopeId);
    return variableMapping[parentScopeId][assignment.variable];
}