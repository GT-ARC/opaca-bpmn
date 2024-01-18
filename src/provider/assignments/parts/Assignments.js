import {
    createAssignments,
    getAssignments,
    getAssignmentsExtension
} from '../util';
import {
    createElement, getRelevantBusinessObject
} from '../../util';

import Assignment from './Assignment';

import { without } from 'min-dash';


export default function Assignments({ element, injector }) {

    const assignments = getAssignments(getRelevantBusinessObject(element)) || [];

    const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

    const items = assignments.map((assignment, index) => {
        const id = element.id + '-assignment-' + index;

        return {
            id,
            label: assignment.get('variable') || '',
            entries: Assignment({
                idPrefix: id,
                element,
                assignment
            }),
            autoFocusEntry: id + '-variable',
            remove: removeFactory({ commandStack, element, assignment })
        };
    });

    return {
        items,
        add: addFactory({ element, bpmnFactory, commandStack })
    };
}

// Removing an entry of assignments list
function removeFactory({ commandStack, element, assignment }) {
    return function(event) {
        event.stopPropagation();

        const commands = [];

        const businessObject = getRelevantBusinessObject(element);
        const extensionElements = businessObject.get('extensionElements');
        const extension = getAssignmentsExtension(businessObject);

        if (!extension) {
            return;
        }
        // assignments list without the entry we want to remove
        const assignments = without(extension.get('values'), assignment);

        commands.push({
            cmd : 'element.updateModdleProperties',
            context : {
                element,
                moddleElement: extension,
                properties: {
                    values: assignments
                }
            }
        });

        // Remove if assignments list is empty
        if(!assignments.length){

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

// Adding new assignment to assignments list
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

        // (2) ensure assignments extension
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

        // (3) create assignment
        const newAssignment = createElement('vsdt2:Assignment', {
            variable : '', // default
            expression: ''
        }, extension, bpmnFactory);

        // (4) add assignment to list
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