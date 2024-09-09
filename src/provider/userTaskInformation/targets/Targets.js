import {
    createTargets,
    getTargets,
    getTargetsExtension
} from './util';

import Variable from '../../variables/parts/Variable'; // Reusing the Variable component
import { without } from 'min-dash';
import { getRelevantBusinessObject, createElement, nextId } from "../../util";

export default function Targets({ element, injector }) {
    const businessObject = getRelevantBusinessObject(element);
    const targets = getTargets(businessObject) || [];

    const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

    const items = targets.map((target, index) => {
        const id = element.id + '-target-' + index;

        return {
            id,
            label: target.get('name') || '',
            entries: Variable({ // Reusing the Variable component
                idPrefix: id,
                element,
                variable: target,
                addDescription: true // Adding description
            }),
            autoFocusEntry: id + '-name',
            remove: removeFactory({ commandStack, element, target })
        };
    });

    return {
        items,
        add: addFactory({ element, bpmnFactory, commandStack })
    };
}

// Removing a target entry
function removeFactory({ commandStack, element, target }) {
    return function(event) {
        event.stopPropagation();

        const commands = [];

        const businessObject = getRelevantBusinessObject(element);
        const extensionElements = businessObject.get('extensionElements');
        const extension = getTargetsExtension(businessObject);

        if (!extension) {
            return;
        }

        const targets = without(extension.get('values'), target);

        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: extension,
                properties: {
                    values: targets
                }
            }
        });

        if (!targets.length) {
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

// Adding a new target
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

        let extension = getTargetsExtension(businessObject);

        if (!extension) {
            extension = createTargets({
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

        const newTarget = createElement('vsdt2:Target', {
            name: nextId('Target_'),
            type: '',
            description: ''
        }, extension, bpmnFactory);

        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: extension,
                properties: {
                    values: [ ...extension.get('values'), newTarget ]
                }
            }
        });

        commandStack.execute('properties-panel.multi-command-executor', commands);
    };
}
