import {is} from "bpmn-js/lib/util/ModelUtil";
import {getRootElement} from "../../provider/util";
import {isAny} from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import {handleEnd, handleStart, initializeVariables} from "../util";
import {handleConditionalEvents} from "../event-based-gateway-handling/EventBasedGatewayHandler";

export default function InterpreterBase(
    eventBus, elementRegistry, simulationSupport) {

    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._simulationSupport = simulationSupport;

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

        // TODO why is this in enter, in contrast to other gateways?!
        if(is(element, 'bpmn:EventBasedGateway')){
            const triggerElements = getTriggers(element);
            // TODO don't pass simulationSupport like this
            handleConditionalEvents(triggerElements, scope, this._simulationSupport);
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
        // TODO don't use fire here
        if(is(element, 'bpmn:ExclusiveGateway')){
            eventBus.fire('tokenSimulation.exitExclusiveGateway', {scope: event.scope});
        }
        if(is(element, 'bpmn:InclusiveGateway')){
            eventBus.fire('tokenSimulation.exitInclusiveGateway', {scope: event.scope});
        }
        // Assignments
        handleEnd(element, event.scope);
    })
}


function getTriggers(element) {
    return element.outgoing.map(
        outgoing => outgoing.target
    ).filter(activity => isAny(activity, [
        'bpmn:IntermediateCatchEvent',
        'bpmn:ReceiveTask'
    ]));
}


InterpreterBase.$inject = [
    'eventBus',
    'elementRegistry',
    'simulationSupport'
];
