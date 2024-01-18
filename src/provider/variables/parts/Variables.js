import {
    createVariables,
    getVariables,
    getVariablesExtension,
    nextId
} from '../util';
import Variable from './Variable';
import {without} from 'min-dash';
import {getAssignmentsExtension} from "../../assignments/util";
import {is} from "bpmn-js/lib/util/ModelUtil";
import {getRootElement, createElement, getRelevantBusinessObject} from "../../util";


export default function Variables({ element, injector }) {
    const businessObject = getRelevantBusinessObject(element);
    const variables = getVariables(businessObject) || [];

    const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

    const items = variables.map((variable, index) => {
        const id = element.id + '-variable-' + index;

        return {
            id,
            label: variable.get('name') || '',
            entries: Variable({
                idPrefix: id,
                element,
                variable
            }),
            autoFocusEntry: id + '-name',
            remove: removeFactory({ commandStack, element, variable })
        };
    });

    return {
        items,
        add: addFactory({ element, bpmnFactory, commandStack })
    };
}

// Removing an entry of variables list
function removeFactory({ commandStack, element, variable }) {
    return function(event) {
        event.stopPropagation();

        const commands = [];

        const businessObject = getRelevantBusinessObject(element);
        const extensionElements = businessObject.get('extensionElements');
        const extension = getVariablesExtension(businessObject);

        if (!extension) {
            return;
        }
        // Variables list without entry we want to remove
        const variables = without(extension.get('values'), variable);
        // Updating element properties
        commands.push({
            cmd : 'element.updateModdleProperties',
            context : {
                element,
                moddleElement: extension,
                properties: {
                    values: variables
                }
            }
        });
        // Also remove assignments to that variable
        // Getting all flow elements
        const root = getRootElement(element);
        const children = root.get('flowElements');
        // Find elements, that have assignment to the variable we remove
        const isOfType = (element, types) => types.some(type => is(element, type));
        const relevantChildren = children.filter(child => isOfType(child, ['bpmn:SubProcess', 'bpmn:Task', 'bpmn:Event']));
        const hasAssignmentExtension = relevantChildren.filter(child => getAssignmentsExtension(child));

        hasAssignmentExtension.forEach(child => {
            const withoutVar = getAssignmentsExtension(child).get('values').filter(value => value.variable !== variable.name)

            commands.push({
                cmd: 'element.updateModdleProperties',
                context: {
                    element,
                    moddleElement: getAssignmentsExtension(child),
                    properties: {
                        values: withoutVar
                    }
                }
            })
        });

        // Remove if variables list is empty
        if(!variables.length){

            commands.push({
                cmd : 'element.updateModdleProperties',
                context : {
                    element,
                    moddleElement : extensionElements,
                    properties : {
                        values : without(extensionElements.get('values'), extension)
                    }
                }
            })
        }
        commandStack.execute('properties-panel.multi-command-executor', commands);
    };
}

// Adding new variable to variables list
function addFactory({ element, bpmnFactory, commandStack }) {
    return function(event) {
        event.stopPropagation();

        const commands = [];
        const businessObject = getRelevantBusinessObject(element);


        let extensionElements = businessObject.get('extensionElements');

        // (1) ensure extension elements
        if (!extensionElements) {
            extensionElements = createElement(
                'bpmn:ExtensionElements',
                { values: [] },
                businessObject,
                bpmnFactory
            );

            commands.push({
                cmd: 'element.updateModdleProperties',
                context: {
                    element,
                    moddleElement: businessObject,
                    properties: { extensionElements }
                }
            });
        }

        // (2) ensure variables extension
        let extension = getVariablesExtension(businessObject);

        if (!extension) {
            extension = createVariables({
                values: []
            }, extensionElements, bpmnFactory);

            commands.push({
                cmd: 'element.updateModdleProperties',
                context: {
                    element,
                    moddleElement: extensionElements,
                    properties: {
                        values: [ ...extensionElements.get('values'), extension ]
                    }
                }
            });
        }

        // (3) create variable
        const newVariable = createElement('vsdt2:Variable', {
            name: nextId('Variable_'),
            type: ''
        }, extension, bpmnFactory);

        // (4) add variable to list
        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: extension,
                properties: {
                    values: [ ...extension.get('values'), newVariable ]
                }
            }
        });

        commandStack.execute('properties-panel.multi-command-executor', commands);
    };
}