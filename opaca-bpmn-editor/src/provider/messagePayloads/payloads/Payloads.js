import {
    createPayloads,
    getPayloads,
    getPayloadsExtension
} from './util';

import Variable from '../../variables/parts/Variable'; // Reusing the Variable component
import { without } from 'min-dash';
import { getRelevantBusinessObject, createElement, nextId } from "../../util";

export default function Payloads({ element, injector }) {
    const businessObject = getRelevantBusinessObject(element);
    const payloads = getPayloads(businessObject) || [];

    const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

    const items = payloads.map((payload, index) => {
        const id = element.id + '-payload-' + index;

        return {
            id,
            label: payload.get('name') || '',
            entries: Variable({ // Reusing the Variable component
                idPrefix: id,
                element,
                variable: payload
            }),
            autoFocusEntry: id + '-name',
            remove: removeFactory({ commandStack, element, payload })
        };
    });

    return {
        items,
        add: addFactory({ element, bpmnFactory, commandStack })
    };
}

// Removing a payload entry
function removeFactory({ commandStack, element, payload }) {
    return function(event) {
        event.stopPropagation();

        const commands = [];

        const businessObject = getRelevantBusinessObject(element);
        const extensionElements = businessObject.get('extensionElements');
        const extension = getPayloadsExtension(businessObject);

        if (!extension) {
            return;
        }

        const payloads = without(extension.get('values'), payload);

        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: extension,
                properties: {
                    values: payloads
                }
            }
        });

        if (!payloads.length) {
            commands.push({
                cmd: 'element.updateModdleProperties',
                context: {
                    element,
                    moddleElement: extensionElements,
                    properties: {
                        values: without(extensionElements.get('values'), extension)
                    }
                }
            });
        }

        commandStack.execute('properties-panel.multi-command-executor', commands);
    };
}

// Adding a new payload
function addFactory({ element, bpmnFactory, commandStack }) {
    return function(event) {
        event.stopPropagation();

        const commands = [];
        const businessObject = getRelevantBusinessObject(element);

        let extensionElements = businessObject.get('extensionElements');

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

        let extension = getPayloadsExtension(businessObject);

        if (!extension) {
            extension = createPayloads({
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

        const newPayload = createElement('vsdt2:Payload', {
            name: nextId('Payload_'),
            type: ''
        }, extension, bpmnFactory);

        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: extension,
                properties: {
                    values: [ ...extension.get('values'), newPayload ]
                }
            }
        });

        commandStack.execute('properties-panel.multi-command-executor', commands);
    };
}
