import {
    TOGGLE_MODE_EVENT
} from 'bpmn-js-token-simulation/lib/util/EventHelper';


const SELECTED_COLOR = '--token-simulation-grey-darken-30';
const NOT_SELECTED_COLOR = '--token-simulation-grey-lighten-56';

import {
    getBusinessObject,
    is,
    isSequenceFlow
} from 'bpmn-js-token-simulation/lib/simulator/util/ModelUtil';
import {evaluateCondition} from "../util";

const COLOR_ID = 'inclusive-gateway-settings';


export default function InclusiveGatewaySettings(
    eventBus, elementRegistry,
    elementColors, simulator, simulationStyles) {

    this._elementRegistry = elementRegistry;
    this._elementColors = elementColors;
    this._simulator = simulator;
    this._simulationStyles = simulationStyles;

    eventBus.on(TOGGLE_MODE_EVENT, event => {
        if(!event.active){
            this.reset;
        }
    });
    // While exiting a gateway the next sequence flow(s) gets set
    eventBus.on('tokenSimulation.exitInclusiveGateway', event => {
        const { scope } = event;
        this.setDefaults(scope);
    });
}

InclusiveGatewaySettings.prototype.setDefaults = function(scope) {
    const inclusiveGateways = this._elementRegistry.filter(element => {
        return is(element, 'bpmn:InclusiveGateway');
    });

    inclusiveGateways.forEach(inclusiveGateway => {
        if (inclusiveGateway.outgoing.filter(isSequenceFlow).length > 1) {
            this._setGatewayDefaults(inclusiveGateway, scope);
        }
    });
};

InclusiveGatewaySettings.prototype.reset = function() {
    const inclusiveGateways = this._elementRegistry.filter(element => {
        return is(element, 'bpmn:InclusiveGateway');
    });

    inclusiveGateways.forEach(inclusiveGateway => {
        if (inclusiveGateway.outgoing.filter(isSequenceFlow).length > 1) {
            this._resetGateway(inclusiveGateway);
        }
    });
};

InclusiveGatewaySettings.prototype._getActiveOutgoing = function(gateway) {
    const {
        activeOutgoing
    } = this._simulator.getConfig(gateway);

    return activeOutgoing;
};

InclusiveGatewaySettings.prototype._setActiveOutgoing = function(gateway, activeOutgoing) {
    this._simulator.setConfig(gateway, { activeOutgoing });

    const sequenceFlows = gateway.outgoing.filter(isSequenceFlow);

    // set colors
    sequenceFlows.forEach(outgoing => {

        const style = (!activeOutgoing || activeOutgoing.includes(outgoing)) ?
            SELECTED_COLOR : NOT_SELECTED_COLOR;
        const stroke = this._simulationStyles.get(style);

        this._elementColors.add(outgoing, COLOR_ID, {
            stroke
        });
    });
};

InclusiveGatewaySettings.prototype._setGatewayDefaults = function(gateway, scope) {
    const sequenceFlows = gateway.outgoing.filter(isSequenceFlow);

    const validFlows = [];
    const defaultFlows = [];

    sequenceFlows.forEach(flow => {
        const conditionExpression = flow.businessObject.get('conditionExpression');
        if (conditionExpression) {
            // Evaluate the condition expression
            if(evaluateCondition(conditionExpression.body, scope)){
                validFlows.push(flow);
            }
        } else {
            // If no condition expression is defined, consider default
            defaultFlows.push(flow);
        }
    });
    if(validFlows.length >= 1){
        // Valid conditions
        this._setActiveOutgoing(gateway, validFlows);
    }else if(defaultFlows.length >= 1){
        // If none, default
        this._setActiveOutgoing(gateway, defaultFlows);
    }else{
        // If none, first sequenceFlow
        alert('No condition evaluates to true - Check defined condition expressions!');
        this._setActiveOutgoing(sequenceFlows[0]);
    }
};

InclusiveGatewaySettings.prototype._resetGateway = function(gateway) {
    this._setActiveOutgoing(gateway, undefined);
};

InclusiveGatewaySettings.$inject = [
    'eventBus',
    'elementRegistry',
    'elementColors',
    'simulator',
    'simulationStyles'
];