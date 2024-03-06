import {getRootElement} from "../provider/util";
import {getServices} from "../views/services/Services";
import {getVariables} from "../provider/variables/util";
import {getAssignments} from "../provider/assignments/util";

// variable, value
const variableMapping = {};

// Create local mapping for variables defined in root
// and parameters and results of services
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

// Make assignment to a variable
export function updateVariables(element){
    const bpmnElement = element.di.bpmnElement;

    const assignments = getAssignments(bpmnElement);
    if(assignments){
        assignments.forEach(assignment => {
            const processedAssignment = preprocessExpression(assignment.expression);
            variableMapping[assignment.variable] = eval(processedAssignment);
        });
    }
    console.log('variableMapping: ');
    for(let key in variableMapping){
        console.log(key , ', ', variableMapping[key]);
    }
}

// Replace variable names inside expression with local mapping
// Will not work for some variable types (i.e. Collections)
function preprocessExpression(expression){
    for (const variable in variableMapping) {
        const value = variableMapping[variable];
        const regex = new RegExp(`\\b${variable}\\b`, 'g'); // Match whole word
        expression = expression.replace(regex, `variableMapping['${variable}']`);
    }
    return expression;
}