import {is} from "bpmn-js/lib/util/ModelUtil";
import {isAny} from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import {handleEnd, handleStart, initializeVariables} from "./util";
import {handleConditionalEvents} from "../event-based-gateway-handling/EventBasedGatewayHandler";

export default function InterpreterBase(activationManager, eventBus, elementRegistry,
    simulationSupport, exclusiveGatewaySettings, inclusiveGatewaySettings, simulator) {

    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._simulationSupport = simulationSupport;
    this._exclusiveGatewaySettings = exclusiveGatewaySettings;
    this._inclusiveGatewaySettings = inclusiveGatewaySettings;

    this._isActive = false;

    activationManager.registerModule(this);

    // ON ELEMENT ENTER
    eventBus.on('trace.elementEnter', async (event) => {
        // Don't do anything, if process is not executable
        if(!this._isActive){
            return;
        }

        const element = event.element;
        const scope = {'parent': event.scope};

        // TODO why is this in enter, in contrast to other gateways?!
        if(is(element, 'bpmn:EventBasedGateway')){
            const triggerElements = getTriggers(element);
            // TODO don't pass simulationSupport like this
            await handleConditionalEvents(triggerElements, scope, this._simulationSupport);
            return;
        }

        // Assignments
        if(isAny(element, ['bpmn:UserTask', 'bpmn:ServiceTask'])){
            // Pause at UserTasks and SeviceTasks until their actions are complete
            simulator.waitAtElement(element);
            // Await results
            await handleStart(element, scope);
            // Trigger to continue simulation
            simulationSupport.triggerElement(element.id);
        }else{
            // No need to pause for other elements
            await handleStart(element, scope);
        }
    });

    // ON ELEMENT EXIT
    eventBus.on('trace.elementExit', async (event) => {
        // Don't do anything, if process is not executable
        if(!this._isActive){
            return;
        }

        const element = event.element;
        const scope = event.scope;

        if(is(element, 'bpmn:StartEvent')){
            initializeVariables(event);
        }

        if(is(element, 'bpmn:ExclusiveGateway')){
            //this._exclusiveGatewaySettings.setSequenceFlowsLive(event.scope);
            // TODO only set flow for this gateway
            this._exclusiveGatewaySettings.setSequenceFlow(element, scope);
        }
        if(is(element, 'bpmn:InclusiveGateway')){
            //this._inclusiveGatewaySettings.setLive(event.scope);
            // TODO only set flow for this gateway
            this._inclusiveGatewaySettings._setGatewayLive(element, scope);
        }
        // Assignments
        await handleEnd(element, event.scope);
    })
}

// Activate/Deactivate this module
InterpreterBase.prototype.setActive = function(isExecutable){
    this._isActive = isExecutable;
}

// Helper for eventBasedGateway
function getTriggers(element) {
    return element.outgoing.map(
        outgoing => outgoing.target
    ).filter(activity => isAny(activity, [
        'bpmn:IntermediateCatchEvent',
        'bpmn:ReceiveTask'
    ]));
}


InterpreterBase.$inject = [
    'activationManager',
    'eventBus',
    'elementRegistry',
    'simulationSupport',
    'exclusiveGatewaySettings',
    'inclusiveGatewaySettings',
    'simulator'
];
