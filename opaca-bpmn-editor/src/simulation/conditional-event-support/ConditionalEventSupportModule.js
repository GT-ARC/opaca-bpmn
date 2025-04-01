import {is, isAny} from "bpmn-js/lib/util/ModelUtil";
import {evaluateCondition} from "../interpreter-base/util";

export default function ConditionalEventSupport(activationManager, eventBus, simulationSupport) {
    this._simulationSupport = simulationSupport;
    this._eventBus = eventBus;

    this._isActive = false;

    activationManager.registerModule(this);

    // ON ELEMENT ENTER
    eventBus.on('trace.elementEnter', (event) => {

        const {element} = event;
        const scope = {parent: event.scope};

        // Don't evaluate conditions for non-executable processes
        if (!this._isActive) {
            return;
        }

        // Boundary Events
        if (element.attachers) {
            element.attachers.forEach(attacher => {
                if (is(attacher, 'bpmn:BoundaryEvent')) {
                    const condition = attacher.businessObject.eventDefinitions.find(ed => is(ed, 'bpmn:ConditionalEventDefinition'));
                    // If event is a conditional event
                    if (condition) {
                        this._handleConditionalEvent(attacher.id, scope, condition);
                    }
                }
            });
        }

        // Intermediate Events
        if (!element.businessObject.eventDefinitions) {
            return;
        }
        const condition = element.businessObject.eventDefinitions.find(ed => is(ed, 'bpmn:ConditionalEventDefinition'));

        // If event is a conditional event
        if (condition) {
            this._handleConditionalEvent(element.id, scope, condition);
        }
    });
}

// Activate/Deactivate this module
ConditionalEventSupport.prototype.setActive = function(isExecutable){
    this._isActive = isExecutable;
}

// Trigger event if condition is true Or wait for updates
ConditionalEventSupport.prototype._handleConditionalEvent = function(id, scope, condition, gatewayId = null){

    setTimeout(() => { // small delay for element triggers to be ready

        const conditionExpression = condition.condition.body;

        // If condition is false, wait for updates
        if(!this._handleEvaluation(conditionExpression, scope, id, gatewayId)){

            // Wrapper function for handleEvaluation
            const logAssignmentHandler = (event) => {
                this._handleEvaluation(conditionExpression, scope, id, gatewayId)
            }

            // Alternatively use
            //eventBus.on('variableUpdate', (event) => {
            document.addEventListener('logAssignment', logAssignmentHandler);

            // Keep track of pending gateway
            this._eventBus.on('interpretation.eventBasedGatewayLeft', (event) => {
                if(gatewayId === event.gatewayId){
                    document.removeEventListener('logAssignment', logAssignmentHandler);
                }
            });
        }
    }, 10);
}

ConditionalEventSupport.prototype._handleEvaluation = function(conditionExpression, scope, id, gatewayId){
    // Evaluate condition
    if(evaluateCondition(conditionExpression, scope)){
        // Trigger event
        this._simulationSupport.triggerElement(id);

        if(gatewayId){
            this._eventBus.fire('interpretation.eventBasedGatewayLeft', {gatewayId});
        }

        return true;
    }
    return false;
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
            this._handleConditionalEvent(id, scope, condition, gateway.id);
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
