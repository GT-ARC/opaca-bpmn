import {is, isAny} from "bpmn-js/lib/util/ModelUtil";
import {evaluateCondition} from "../interpreter-base/util";

export default function ConditionalEventSupport(activationManager, eventBus, simulationSupport){
    this._simulationSupport = simulationSupport;

    this._isActive = false;

    activationManager.registerModule(this);

    // ON ELEMENT ENTER
    eventBus.on('trace.elementEnter', (event) => {

        const {element} = event;
        const scope = {parent: event.scope};

        if(this._isActive) {

            const id = element.businessObject.id;

            if(!element.businessObject.eventDefinitions){
                return;
            }
            const condition = element.businessObject.eventDefinitions.find(ed => is(ed, 'bpmn:ConditionalEventDefinition'));

            // If event is a conditional event
            if(condition){
                this._handleConditionalEvent(id, scope, condition);
            }
        }
    });
}

// Activate/Deactivate this module
ConditionalEventSupport.prototype.setActive = function(isExecutable){
    this._isActive = isExecutable;
}

// Trigger event if condition is true Or wait for updates
ConditionalEventSupport.prototype._handleConditionalEvent = function(id, scope, condition){

    setTimeout(() => { // small delay for element triggers to be ready

        const conditionExpression = condition.condition.body;

        // If condition is true, trigger event
        if(evaluateCondition(conditionExpression, scope)){
            this._simulationSupport.triggerElement(id);

            // Else wait for variable updates
        }else{
            // Alternatively use
            //eventBus.on('variableUpdate', (event) => {
            document.addEventListener('logAssignment', (log) => {
                // Optionally, we could also filter the updates for the relevant variable

                // Evaluate condition again
                if(evaluateCondition(conditionExpression, scope)){
                    this._simulationSupport.triggerElement(id);
                }
            });
        }
    }, 10);
}

ConditionalEventSupport.prototype.conditionAfterGateway = function(gateway, scope){

    const outgoingEvents = getTriggers(gateway);

    outgoingEvents.forEach(event => {

        const id = event.businessObject.id;
        // Elements like ReceiveTask have no EventDefinitions
        if(!event.businessObject.eventDefinitions){
            return;
        }
        const condition = event.businessObject.eventDefinitions.find(ed => is(ed, 'bpmn:ConditionalEventDefinition'));

        // If event is a conditional event
        if(condition){
            this._handleConditionalEvent(id, scope, condition);
        }
    })
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


ConditionalEventSupport.$inject = [
    'activationManager',
    'eventBus',
    'simulationSupport'
];
