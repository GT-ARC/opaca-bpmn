import {is} from "bpmn-js/lib/util/ModelUtil";
import {handleMessagePayload} from "../interpreter-base/util";
import {getPayloads} from "../../provider/messagePayloads/payloads/util";

export default function MessageEventSupport(activationManager, eventBus, elementRegistry, toggleMode, simulationSupport){
    this._elementRegistry = elementRegistry;
    this._simulationSupport = simulationSupport;
    this._eventBus = eventBus;

    this._isActive = false;

    activationManager.registerModule(this);

    // ON SEND MESSAGE
    eventBus.on('interpretation.sendMessage', (event) => {
        const {
            messageReference,
            messageContent
        } = event

        if(this._isActive) {
            this._triggerMessage(messageReference, messageContent);
        }
    });
}

// Activate/Deactivate this module
MessageEventSupport.prototype.setActive = function(isExecutable){
    this._isActive = isExecutable;
}

// Handle payloads
MessageEventSupport.prototype._handlePayloads = function(messageEvent, messageContent){
    // Get (expected) payloads defined in messageEvent
    const payloads = getPayloads(messageEvent);

    if(!payloads){
        return;
    }

    // Get matching payloads from message
    payloads.forEach(payload => {
        const { name, type } = payload;

        if (messageContent.hasOwnProperty(name)) {
            const assignment = {
                variable: name,
                expression: messageContent[name]
            };
            // Assign payload
            handleMessagePayload(messageEvent, assignment);
        }
    });
}

// Trigger all relevant message events
MessageEventSupport.prototype._triggerMessage = function(messageReference, messageContent){
    const messageEvents = this._findRelevantMessageEvents(messageReference);

    const successfulElements = [];
    const failedElements = [];

    messageEvents.forEach(msgEvent => {
        try {
            // Trigger events
            this._simulationSupport.triggerElement(msgEvent.id);

            // Handle payload assignments
            this._handlePayloads(msgEvent, messageContent);

            // If this was after gateway inform other possible event handlers
            const previousElement = msgEvent?.incoming?.[0]?.source;
            if(previousElement.type === 'bpmn:EventBasedGateway'){
                this._eventBus.fire('interpretation.eventBasedGatewayLeft', {gatewayId: previousElement.id});
            }

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
    \nThis could be expected behavior for some events.`);
    }
}

// Find events with given messageRef
MessageEventSupport.prototype._findRelevantMessageEvents = function(messageReference){
    // Get all elements
    const elements = this._elementRegistry.getAll();

    return elements.filter(el => {
        const bo = el.businessObject;

        if (is(el, 'bpmn:Event')) {
            const eventDefs = bo.eventDefinitions || [];

            // Only include events with a MessageEventDefinition that matches the message reference
            return eventDefs.some(ed =>
                ed.messageRef?.name === messageReference
            );
        }

        if (is(el, 'bpmn:ReceiveTask')) {
            return bo.messageRef?.name === messageReference;
        }

        return false;
    });
}

MessageEventSupport.$inject = [
    'activationManager',
    'eventBus',
    'elementRegistry',
    'toggleMode',
    'simulationSupport'
];
