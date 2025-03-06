import {is} from "bpmn-js/lib/util/ModelUtil";

export default function MessageEventSupport(activationManager, eventBus, elementRegistry, toggleMode, simulationSupport){
    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._simulationSupport = simulationSupport;

    this._isActive = false;

    activationManager.registerModule(this);

    // ON SEND MESSAGE
    eventBus.on('interpretation.sendMessage', (event) => {
        const {
            messageReference,
            messageContent
        } = event

        if(this._isActive) {
            this._triggerMessage(messageReference);
        }
    });
}

// Activate/Deactivate this module
MessageEventSupport.prototype.setActive = function(isExecutable){
    this._isActive = isExecutable;
}

// TODO handle message payloads

// Trigger all relevant message events
MessageEventSupport.prototype._triggerMessage = function(messageReference){
    const messageEvents = this._findRelevantMessageEvents(messageReference);

    const successfulElements = [];
    const failedElements = [];

    messageEvents.forEach(msgEvent => {
        try {
            this._simulationSupport.triggerElement(msgEvent.id);
            successfulElements.push(msgEvent.id);
        } catch (error) {
            failedElements.push(msgEvent.id);
        }
    });

    if(successfulElements.length > 0){
        console.log(`Message sent. Triggered events: ${successfulElements.join(', ')}`);
    }

    if(failedElements.length > 0){
        console.log(`Failed to trigger elements: ${failedElements.join(', ')}
    \nThis could be expected behavior for some boundary events.`);
    }
}

// Find events with given messageRef
MessageEventSupport.prototype._findRelevantMessageEvents = function(messageReference){
    // Get all elements
    const elements = this._elementRegistry.getAll();

    // Filter for events
    const events = elements.filter(el => is(el, 'bpmn:Event') || is(el, 'bpmn:ReceiveTask'));

    // Filter for events that have the messageReference of our message
    return events.filter(el =>
        (el.businessObject.eventDefinitions?.some(ed => ed.messageRef?.name === messageReference)) ||
        // Or ReceiveTask with the reference
        (el.businessObject.messageRef?.name === messageReference)
    );
}

MessageEventSupport.$inject = [
    'activationManager',
    'eventBus',
    'elementRegistry',
    'toggleMode',
    'simulationSupport'
];
