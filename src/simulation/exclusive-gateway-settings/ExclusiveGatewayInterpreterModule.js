import {
    is
} from 'bpmn-js-token-simulation/lib/util/ElementHelper';

import {
    TOGGLE_MODE_EVENT
} from 'bpmn-js-token-simulation/lib/util/EventHelper';

import {evaluateCondition} from "../util";


const SELECTED_COLOR = '--token-simulation-grey-darken-30';
const NOT_SELECTED_COLOR = '--token-simulation-grey-lighten-56';

function getNext(gateway) {
    var outgoing = gateway.outgoing.filter(isSequenceFlow);

    var next = null;
    outgoing.forEach(sequenceFlow => {
       const conditionExpression = sequenceFlow.businessObject.get('conditionExpression');

       // If there is a condition defined, evaluate it
       if(conditionExpression){
           // Return, if the condition holds true
           if(evaluateCondition(conditionExpression.body)){
               next = sequenceFlow;
           }
       // If there is no condition defined, it is interpreted as default flow
       }else{
           if(next === null){
               next = sequenceFlow;
           }
       }

    });
    // If next is still not set, return first flowSequence
    if(next !== null){
        return next;
    }
    return outgoing[0];
}

function isSequenceFlow(connection) {
    return is(connection, 'bpmn:SequenceFlow');
}

const ID = 'exclusive-gateway-settings';

const HIGH_PRIORITY = 2000;


export default function ExclusiveGatewaySettings(
    eventBus, elementRegistry,
    elementColors, simulator, simulationStyles) {

    this._elementRegistry = elementRegistry;
    this._elementColors = elementColors;
    this._simulator = simulator;
    this._simulationStyles = simulationStyles;

    eventBus.on(TOGGLE_MODE_EVENT, event => {
        if(!event.active){
            this.resetSequenceFlows();
        }
    });
    // While exiting a gateway the next sequence flow gets set
    eventBus.on('tokenSimulation.exitExclusiveGateway', event => {
        this.setSequenceFlowsDefault();
    });
}

ExclusiveGatewaySettings.prototype.setSequenceFlowsDefault = function() {
    const exclusiveGateways = this._elementRegistry.filter(element => {
        return is(element, 'bpmn:ExclusiveGateway');
    });
    console.log('exclusiveGateways', exclusiveGateways);

    for (const gateway of exclusiveGateways) {
        this.setSequenceFlow(gateway);
    }
};

ExclusiveGatewaySettings.prototype.resetSequenceFlows = function() {

    const exclusiveGateways = this._elementRegistry.filter(element => {
        return is(element, 'bpmn:ExclusiveGateway');
    });

    exclusiveGateways.forEach(exclusiveGateway => {
        if (exclusiveGateway.outgoing.filter(isSequenceFlow).length) {
            this.resetSequenceFlow(exclusiveGateway);
        }
    });
};

ExclusiveGatewaySettings.prototype.resetSequenceFlow = function(gateway) {
    this._simulator.setConfig(gateway, { activeOutgoing: undefined });
};

ExclusiveGatewaySettings.prototype.setSequenceFlow = function(gateway) {

    const outgoing = gateway.outgoing.filter(isSequenceFlow);

    console.log('outgoing:', outgoing);

    // not forking
    if (outgoing.length < 2) {
        return;
    }
    console.log('more than 2 outgoing!')

    let newActiveOutgoing;
    newActiveOutgoing = getNext(gateway);

    this._simulator.setConfig(gateway, { activeOutgoing: newActiveOutgoing });

    // set colors
    gateway.outgoing.forEach(outgoing => {

        const style = outgoing === newActiveOutgoing ? SELECTED_COLOR : NOT_SELECTED_COLOR;
        const stroke = this._simulationStyles.get(style);

        this._elementColors.add(outgoing, ID, {
            stroke
        }, HIGH_PRIORITY);
    });
};

ExclusiveGatewaySettings.$inject = [
    'eventBus',
    'elementRegistry',
    'elementColors',
    'simulator',
    'simulationStyles'
];