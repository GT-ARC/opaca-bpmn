import {
    createElement,
    createVariables, getRelevantBusinessObject,
    getVariables,
    getVariablesExtension,
    nextId
} from '../util';

import Variable from './Variable';

import { without } from 'min-dash';


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

        const variables = without(extension.get('values'), variable);

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
        const newVariable = createElement('variables_list:Variable', {
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