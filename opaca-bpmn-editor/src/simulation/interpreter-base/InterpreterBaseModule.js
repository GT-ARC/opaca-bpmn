import {is} from "bpmn-js/lib/util/ModelUtil";
import {isAny} from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import {closeUserTaskDialog, handleEnd, handleStart, initializeVariables} from "./util";

export default function InterpreterBase(activationManager, eventBus,
    simulationSupport, exclusiveGatewaySettings,
    inclusiveGatewaySettings, simulator, conditionalEventSupport) {

    this.simulator = simulator;
    this.simulationSupport = simulationSupport;

    this._isActive = false;

    activationManager.registerModule(this);

    // ON ELEMENT ENTER
    eventBus.on('trace.elementEnter', (event) => {
        // Don't do anything, if process is not executable
        if(!this._isActive){
            return;
        }

        const element = event.element;
        const scope = {'parent': event.scope};

        // Gateways
        if(is(element, 'bpmn:ExclusiveGateway')){
            exclusiveGatewaySettings.setSequenceFlow(element, scope);
        }else

        if(is(element, 'bpmn:InclusiveGateway')){
            inclusiveGatewaySettings.setGatewayLive(element, scope);
        }else

        if(is(element, 'bpmn:EventBasedGateway')){
            conditionalEventSupport.conditionAfterGateway(element, scope);
        }else

        // Assignments
        if(isAny(element, ['bpmn:UserTask', 'bpmn:ServiceTask'])){
            this._handleAsyncTasks(element, scope);
        }else{
            // No need to pause for other elements
            handleStart(element, scope);
        }
    });

    // ON ELEMENT EXIT
    eventBus.on('trace.elementExit', (event) => {
        // Don't do anything, if process is not executable
        if(!this._isActive){
            return;
        }

        const element = event.element;
        const scope = event.scope;

        if(is(element, 'bpmn:StartEvent')){
            initializeVariables(event);
        }

        if(is(element, 'bpmn:BoundaryEvent')){
            // If is attached to UserTask and interrupting
            if(is(element.host, 'bpmn:UserTask') && element.businessObject.cancelActivity){
                // Close User Dialog
                closeUserTaskDialog();
            }
        }

        // Assignments
        handleEnd(element, scope);
    });
}

// Activate/Deactivate this module
InterpreterBase.prototype.setActive = function(isExecutable){
    this._isActive = isExecutable;
}

// Handle User and Service Tasks
InterpreterBase.prototype._handleAsyncTasks = async function(element, scope){
    // Pause at UserTasks and ServiceTasks until their actions are complete
    this.simulator.waitAtElement(element);
    // Await results
    await handleStart(element, scope);
    // Trigger to continue simulation
    this.simulationSupport.triggerElement(element.id);
}


InterpreterBase.$inject = [
    'activationManager',
    'eventBus',
    'simulationSupport',
    'exclusiveGatewaySettings',
    'inclusiveGatewaySettings',
    'simulator',
    'conditionalEventSupport'
];
