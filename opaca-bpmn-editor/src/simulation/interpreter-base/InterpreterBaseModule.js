import {is} from "bpmn-js/lib/util/ModelUtil";
import {getRootElement} from "../../provider/util";
import {isAny} from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import {handleEnd, handleStart, initializeVariables} from "../util";

export default function InterpreterBase(
    eventBus, elementRegistry) {

    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;

    this.isExecutable = false;

    // ON SIMULATION TOGGLE
    eventBus.on('tokenSimulation.toggleMode', () => {
        // Get all elements
        const elements = elementRegistry.getAll();

        // See if process is executable
        const root = getRootElement(elements[0]);
        this.isExecutable = !!root.isExecutable;
    });

    // ON ELEMENT EXIT
    eventBus.on('trace.elementEnter', (event) => {
        // Don't do anything, if process is not executable
        if(!this.isExecutable){
            return;
        }

        const element = event.element;
        const scope = {'parent': event.scope};

        if(isAny(element, ['bpmn:SequenceFlow', 'bpmn:Gateway'])){
            return;
        }
        // Assignments
        handleStart(element, scope);
    });

    // ON ELEMENT EXIT
    eventBus.on('trace.elementExit', (event) => {
        // Don't do anything, if process is not executable
        if(!this.isExecutable){
            return;
        }

        const element = event.element;

        if(is(element, 'bpmn:StartEvent')){
            initializeVariables(event);
        }
        if(isAny(element, ['bpmn:SequenceFlow', 'bpmn:Gateway'])){
            return;
        }
        // Assignments
        handleEnd(element, event.scope);
    })
}


InterpreterBase.$inject = [
    'eventBus',
    'elementRegistry'
];
