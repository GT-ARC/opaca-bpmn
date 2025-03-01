import {is} from "bpmn-js/lib/util/ModelUtil";
import {getRootElement} from "../../provider/util";
import {isAny} from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import {handleEnd, handleStart, initializeVariables} from "../util";
import {handleConditionalEvents} from "../event-based-gateway-handling/EventBasedGatewayHandler";

export default function InterpreterBase(
    eventBus, elementRegistry, simulationSupport, exclusiveGatewaySettings, inclusiveGatewaySettings) {

    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._simulationSupport = simulationSupport;
    this._exclusiveGatewaySettings = exclusiveGatewaySettings;
    this._inclusiveGatewaySettings = inclusiveGatewaySettings;

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

        if(is(element, 'bpmn:ExclusiveGateway')){
            this._exclusiveGatewaySettings.setSequenceFlowsLive(event.scope);
        }
        if(is(element, 'bpmn:InclusiveGateway')){
            this._inclusiveGatewaySettings.setLive(event.scope);
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
    'simulationSupport',
    'exclusiveGatewaySettings',
    'inclusiveGatewaySettings'
];
