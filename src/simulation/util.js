
// variable, value
const variableMapping = {};

// Create local mapping for all defined variables
export function initializeProperties(businessObject){

    console.log('Initializing variable mapping');

    const variables = [];
    // TODO iterate over XML and get variables
    variables.push({name:'x', type:'int'});

    variables.forEach(variable => {
        variableMapping[variable.name] = 0;
    });
    console.log(variableMapping['x']);
}

// Evaluate condition
export function evaluateCondition(condition){

    console.log('Evaluating condition');
    const processedCondition = preprocessExpression(condition.body);
    console.log('processed condition: ', processedCondition);
    console.log('evaluation: ', eval(processedCondition));
    return eval(processedCondition);
}

// Make assignment to a variable
export function updateVariables(assignment){
    const processedAssignment = preprocessExpression(assignment.expression);
    variableMapping[assignment.variable] = eval(processedAssignment);
}

// Replace variable names inside expression with local mapping
function preprocessExpression(expression){
    for (const variable in variableMapping) {
        const value = variableMapping[variable];
        const regex = new RegExp(`\\b${variable}\\b`, 'g'); // Match whole word
        expression = expression.replace(regex, `variableMapping['${variable}']`);
    }
    return expression;
}