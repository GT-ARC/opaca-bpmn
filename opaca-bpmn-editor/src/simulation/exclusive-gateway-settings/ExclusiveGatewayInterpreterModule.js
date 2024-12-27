import {
    is
} from 'bpmn-js-token-simulation/lib/util/ElementHelper';

import {
    TOGGLE_MODE_EVENT
} from 'bpmn-js-token-simulation/lib/util/EventHelper';

import {evaluateCondition} from "../util";
import {getRootElement} from "../../provider/util";


const SELECTED_COLOR = '--token-simulation-grey-darken-30';
const NOT_SELECTED_COLOR = '--token-simulation-grey-lighten-56';

function getNext(gateway, sequenceFlow) {
    var outgoing = gateway.outgoing.filter(isSequenceFlow);

    var index = outgoing.indexOf(sequenceFlow || gateway.sequenceFlow);

    if (outgoing[index + 1]) {
        return outgoing[index + 1];
    } else {
        return outgoing[0];
    }
}

function getLive(gateway, scope) {
    var outgoing = gateway.outgoing.filter(isSequenceFlow);

    var next = null;
    outgoing.forEach(sequenceFlow => {
       const conditionExpression = sequenceFlow.businessObject.get('conditionExpression');

       // If there is a condition defined, evaluate it
       if(conditionExpression){
           // Return, if the condition holds true
           if(evaluateCondition(conditionExpression.body, scope)){
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

    console.error('No condition evaluates to true - Check defined condition expressions!');
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
        if (event.active) {
            this.setSequenceFlowsDefault();
        } else {
            this.resetSequenceFlows();
        }
    });
    // While exiting a gateway the next sequence flow gets set
    eventBus.on('tokenSimulation.exitExclusiveGateway', event => {

        const root = getRootElement(this._elementRegistry.getAll()[0]);
        if(root.isExecutable){
            const { scope } = event;
            this.setSequenceFlowsLive(scope);
        }
    });
}

ExclusiveGatewaySettings.prototype.setSequenceFlowsDefault = function() {
    const exclusiveGateways = this._elementRegistry.filter(element => {
        return is(element, 'bpmn:ExclusiveGateway');
    });

    for (const gateway of exclusiveGateways) {
        this.setSequenceFlow(gateway, null);
    }
};

ExclusiveGatewaySettings.prototype.setSequenceFlowsLive = function(scope) {
    const exclusiveGateways = this._elementRegistry.filter(element => {
        return is(element, 'bpmn:ExclusiveGateway');
    });

    for (const gateway of exclusiveGateways) {
        this.setSequenceFlow(gateway, scope);
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

ExclusiveGatewaySettings.prototype.setSequenceFlow = function(gateway, scope) {

    const outgoing = gateway.outgoing.filter(isSequenceFlow);

    // not forking
    if (outgoing.length < 2) {
        return;
    }

    let newActiveOutgoing;

    if(scope===null){
        const {
            activeOutgoing
        } = this._simulator.getConfig(gateway);

        if (activeOutgoing) {
            // set next sequence flow
            newActiveOutgoing = getNext(gateway, activeOutgoing);
        } else {
            // set first sequence flow
            newActiveOutgoing = outgoing[ 0 ];
        }
    }else{
        newActiveOutgoing = getLive(gateway, scope);
    }

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