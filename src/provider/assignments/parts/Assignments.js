import {
    getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import {
    createElement,
    createAssignments,
    getAssignments,
    getAssignmentsExtension
} from '../util';

import Assignment from './Assignment';

import { without } from 'min-dash';


export default function Assignments({ element, injector }) {

    const assignments = getAssignments(element) || [];

    const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

    const items = assignments.map((assignment, index) => {
        const id = element.id + '-assignment-' + index;

        return {
            id,
            label: assignment.get('assignment') || '',
            entries: Assignment({
                idPrefix: id,
                element,
                assignment
            }),
            autoFocusEntry: id + '-assignment',
            remove: removeFactory({ commandStack, element, assignment })
        };
    });

    return {
        items,
        add: addFactory({ element, bpmnFactory, commandStack })
    };
}

function removeFactory({ commandStack, element, assignment }) {
    return function(event) {
        event.stopPropagation();

        const extension = getAssignmentsExtension(element);

        if (!extension) {
            return;
        }

        const assignments = without(extension.get('values'), assignment);

        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: extension,
            properties: {
                values: assignments
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
        let extension = getAssignmentsExtension(element);

        if (!extension) {
            extension = createAssignments({
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
        const newAssignment = createElement('assignments_list:Assignment', {
            variable : '', //name: nextId('Assignment_'),
            expression: ''
        }, extension, bpmnFactory);

        // (4) add parameter to list
        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: extension,
                properties: {
                    values: [ ...extension.get('values'), newAssignment ]
                }
            }
        });

        commandStack.execute('properties-panel.multi-command-executor', commands);
    };
}