import {is} from "bpmn-js/lib/util/ModelUtil";

export default function SignalEventSupport(activationManager, eventBus, elementRegistry, toggleMode, simulationSupport){
    this._eventBus = eventBus;
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
            this._simulationSupport.triggerElement(signalEvent.id);
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
    \nThis could be expected behavior for some boundary events.`);
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
    'toggleMode',
    'simulationSupport'
];
