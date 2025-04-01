import {is, isAny} from "bpmn-js/lib/util/ModelUtil";

export default function SignalEventSupport(activationManager, eventBus, elementRegistry, simulationSupport){
    this._elementRegistry = elementRegistry;
    this._simulationSupport = simulationSupport;

    this._isActive = false;

    activationManager.registerModule(this);

    // ON SEND SIGNAL
    eventBus.on('interpretation.sendSignal', (event) => {
        const {
            signalReference
        } = event

        if(this._isActive) {
            this._triggerSignal(signalReference);
        }
    });

    // ON ELEMENT ENTER
    eventBus.on('trace.elementEnter', (event) => {

        const {element} = event;

        if(this._isActive) {
            const possible_outgoing_signals = ['bpmn:IntermediateThrowEvent', 'bpmn:EndEvent'];

            if (isAny(element, possible_outgoing_signals)) {
                const signalRef = element.businessObject.eventDefinitions?.find(def => def.signalRef)?.signalRef;

                if (signalRef) {
                    eventBus.fire('interpretation.broadcastSignal',
                        {signalReference: signalRef.name});
                }
            }
        }
    });
}

// Activate/Deactivate this module
SignalEventSupport.prototype.setActive = function(isExecutable){
    this._isActive = isExecutable;
}

// Trigger all relevant signal events
SignalEventSupport.prototype._triggerSignal = function(signalReference){
    const signalEvents = this._findRelevantSignalEvents(signalReference);

    const successfulElements = [];
    const failedElements = [];

    signalEvents.forEach(signalEvent => {
        try {
            // Trigger events
            this._simulationSupport.triggerElement(signalEvent.id);

            // If this was after gateway inform other possible event handlers
            const previousElement = signalEvent?.incoming?.[0]?.source;
            if(previousElement.type === 'bpmn:EventBasedGateway'){
                this._eventBus.fire('interpretation.eventBasedGatewayLeft', {gatewayId: previousElement.id});
            }

            successfulElements.push(signalEvent.id);
        } catch (error) {
            failedElements.push(signalEvent.id);
        }
    });

    if(successfulElements.length > 0){
        console.log(`Signal sent. Triggered events: ${successfulElements.join(', ')}`);
    }

    if(failedElements.length > 0){
        console.log(`Failed to trigger elements: ${failedElements.join(', ')}
    \nThis could be expected behavior for some events.`);
    }
}

// Find events with given signalRef
SignalEventSupport.prototype._findRelevantSignalEvents = function(signalReference){
    // Get all elements
    const elements = this._elementRegistry.getAll();

    // Filter for events
    const events = elements.filter(el => is(el, 'bpmn:Event'));

    // Filter for events that have the signalReference of our signal
    return events.filter(el =>
        el.businessObject.eventDefinitions?.some(ed => ed.signalRef?.name === signalReference)
    );
}

SignalEventSupport.$inject = [
    'activationManager',
    'eventBus',
    'elementRegistry',
    'simulationSupport'
];
