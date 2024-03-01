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

    // TODO test stuff
    // Variable
    var var1 = {name: 'x', type: 'int'};
    var x;

    // Assignment
    var assignment1 = {variable: 'x', expression: '2+1'};
    x = 3;

    var next = null;
    outgoing.forEach(sequenceFlow => {
       //console.log(sequenceFlow.businessObject);

       const con = sequenceFlow.businessObject.get('conditionExpression');
       //console.log('con: ', con);
       //console.log('body: ', con.body);
       //console.log('eval: ', evaluateCondition(con.body));

       // If there is a condition defined, evaluate it
       if(con){
           // Return, if the condition holds true
           if(evaluateCondition(con.body)){
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

    //TODO remove log
    eventBus.on(TOGGLE_MODE_EVENT, event => {
        console.log('TOGGLE MODE EVENT');
        if (event.active) {
            this.setSequenceFlowsDefault();
            console.log('event.active is true');
        } else {
            this.resetSequenceFlows();
        }
    });
}

ExclusiveGatewaySettings.prototype.setSequenceFlowsDefault = function() {
    const exclusiveGateways = this._elementRegistry.filter(element => {
        return is(element, 'bpmn:ExclusiveGateway');
    });

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

    // not forking
    if (outgoing.length < 2) {
        return;
    }

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