import {
    getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import {
    createElement,
    createVariables,
    getVariables,
    getParametersExtension,
    nextId
} from '../util';

import Variable from './Variable';

import { without } from 'min-dash';


export default function Variables({ element, injector }) {

    const variables = getVariables(element) || [];

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

        const extension = getParametersExtension(element);

        if (!extension) {
            return;
        }

        const variables = without(extension.get('values'), variable);

        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: extension,
            properties: {
                values: variables
            }
        });
    };
}

function addFactory({ element, bpmnFactory, commandStack }) {
    return function(event) {
        event.stopPropagation();

        const commands = [];

        const businessObject = getBusinessObject(element);

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

        // (2) ensure parameters extension
        let extension = getParametersExtension(element);

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

        // (3) create parameter
        const newVariable = createElement('variables_list:Variable', {
            name: nextId('Variable_'),
            type: ''
        }, extension, bpmnFactory);

        // (4) add parameter to list
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