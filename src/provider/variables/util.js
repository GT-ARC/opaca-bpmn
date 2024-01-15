import Ids from 'ids';
import {getExtension, getRelevantBusinessObject, createElement, } from "../util";

// Get variables list extension
export function getVariablesExtension(element) {
    const businessObject = getRelevantBusinessObject(element);
    return getExtension(businessObject, 'variables_list:Variables');
}

// Get variables extension entries
export function getVariables(element) {
    const businessObject = getRelevantBusinessObject(element);
    const variables = getVariablesExtension(businessObject);
    return variables && variables.get('values');
}

// Create new variable extension
export function createVariables(properties, parent, bpmnFactory) {
    return createElement('variables_list:Variables', properties, parent, bpmnFactory);
}

// Get id used for generated names
export function nextId(prefix) {
    const ids = new Ids([ 32,32,1 ]);

    return ids.nextPrefixed(prefix);
}

// Get names of custom datatypes defined in 'resources/datatypes'
export function getDataTypes(){
    // Get context created by Webpack
    const datatypesContext = require.context('datatypes', false, /\.json$/);
    // Return filenames without .json extension
    return datatypesContext.keys().map(key => key.replace(/^\.\//, '').replace(/\.json$/, ''));
}