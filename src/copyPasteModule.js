import { getAssignments } from './provider/assignments/util';
import { getVariables } from './provider/variables/util';
import { isPaste } from 'diagram-js/lib/features/keyboard/KeyboardUtil';

// Native Copy-Paste Module
export const nativeCopyModule = {
    __init__: ['nativeCopyPaste'],
    nativeCopyPaste: ['type', function (
        keyboard, eventBus,
        moddle, clipboard, elementRegistry
    ) {

        function collectReferences(elements, references) {
            if (!elements){
                console.error('Expected an array of elements');
                return;
            }

            const process = elementRegistry.get('Process_1');
            const variables = getVariables(process);
            // TODO also collect other references (processes)
            console.log(elements);
            elements.forEach(element => {
                const assignments = getAssignments(element);
                if(assignments){
                    assignments.forEach(assignment => {
                        if(variables){
                            variables.forEach(variable => {
                                if(variable.name === assignment.variable){
                                    references[variable.name] = variable;
                                }
                            });
                        }
                    });
                }
            });
        }

        // Persist into local storage whenever copy takes place
        eventBus.on('copyPaste.elementsCopied', event => {
            const { tree } = event;

            // Collect all references
            const references = {};
            collectReferences(tree[0], references);
            console.log(references);

            // Combine tree and references
            const copyPayload = {
                tree,
                references
            };

            console.log('PUT localStorage', tree, references);

            // Persist in local storage, encoded as JSON
            localStorage.setItem('bpmnClipboard', JSON.stringify(copyPayload));
        });

        // Intercept global paste keybindings and inject reified pasted stack
        keyboard.addListener(2000, event => {
            const { keyEvent } = event;

            if (!isPaste(keyEvent)) {
                return;
            }

            // Retrieve from local storage
            const serializedCopy = localStorage.getItem('bpmnClipboard');

            if (!serializedCopy) {
                return;
            }

            // Parse tree, re-instantiating contained objects
            const { tree, references } = JSON.parse(serializedCopy, createReviver(moddle));

            console.log('GET localStorage', tree, references);

            // TODO make sure it works for processes with other names
            const targetProcess = elementRegistry.get('Process_1');

            console.log('targetProcess', targetProcess);
            // TODO add undo support
            // Add missing variables to the target process
            Object.keys(references).forEach(key => {
                const reference = references[key];

                if(!targetProcess.businessObject.get('extensionElements')){
                    targetProcess.businessObject.extensionElements = moddle.create('bpmn:ExtensionElements', {values : []});
                }
                console.log('target extensionElements', targetProcess.businessObject.extensionElements);
                if (!getVariables(targetProcess)) {
                    targetProcess.businessObject.extensionElements.values.push(moddle.create('vsdt2:Variables', {values: []}));
                }
                console.log('target extensionElements', targetProcess.businessObject.extensionElements);

                if (!getVariables(targetProcess).find(variable => variable.name === key)) {
                    // Add the reference to the target process variables
                    // TODO make sure values[0] is variables extension
                    targetProcess.businessObject.extensionElements.values[0].values.push(reference);
                }
            });
            // Put into clipboard
            clipboard.set(tree);
        });
    }]
};

function createReviver(moddle) {
    var elCache = {};

    return function(key, object) {
        if (typeof object === 'object' && typeof object.$type === 'string') {
            var objectId = object.id;

            if (objectId && elCache[objectId]) {
                return elCache[objectId];
            }

            var type = object.$type;
            var attrs = Object.assign({}, object);

            delete attrs.$type;

            var newEl = moddle.create(type, attrs);

            if (objectId) {
                elCache[objectId] = newEl;
            }

            return newEl;
        }

        return object;
    };
}