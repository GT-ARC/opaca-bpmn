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
import {evaluateCondition, initializeProperties} from "../util";

const COLOR_ID = 'inclusive-gateway-settings';


export default function InclusiveGatewaySettings(
    eventBus, elementRegistry,
    elementColors, simulator, simulationStyles) {

    this._elementRegistry = elementRegistry;
    this._elementColors = elementColors;
    this._simulator = simulator;
    this._simulationStyles = simulationStyles;

    eventBus.on(TOGGLE_MODE_EVENT, event => {
        initializeProperties('XML'); // TODO remove
        if (event.active) {
            this.setDefaults();
        } else {
            this.reset();
        }
    });
}

InclusiveGatewaySettings.prototype.setDefaults = function() {
    const inclusiveGateways = this._elementRegistry.filter(element => {
        return is(element, 'bpmn:InclusiveGateway');
    });

    inclusiveGateways.forEach(inclusiveGateway => {
        if (inclusiveGateway.outgoing.filter(isSequenceFlow).length > 1) {
            this._setGatewayDefaults(inclusiveGateway);
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
/*
InclusiveGatewaySettings.prototype.toggleSequenceFlow = function(gateway, sequenceFlow) {
    const activeOutgoing = this._getActiveOutgoing(gateway),
        defaultFlow = getDefaultFlow(gateway),
        nonDefaultFlows = getNonDefaultFlows(gateway);

    let newActiveOutgoing;
    if (activeOutgoing.includes(sequenceFlow)) {
        newActiveOutgoing = without(activeOutgoing, sequenceFlow);
    } else {
        newActiveOutgoing = without(activeOutgoing, defaultFlow).concat(sequenceFlow);
    }

    // make sure at least one flow is active
    if (!newActiveOutgoing.length) {

        // default flow if available
        if (defaultFlow) {
            newActiveOutgoing = [ defaultFlow ];
        } else {

            // or another flow which is not the one toggled
            newActiveOutgoing = [ nonDefaultFlows.find(flow => flow !== sequenceFlow) ];
        }
    }

    this._setActiveOutgoing(gateway, newActiveOutgoing);
};

 */

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

InclusiveGatewaySettings.prototype._setGatewayDefaults = function(gateway) {
    const sequenceFlows = gateway.outgoing.filter(isSequenceFlow);

    //const defaultFlow = getDefaultFlow(gateway);
    //const nonDefaultFlows = without(sequenceFlows, defaultFlow);
    const validFlows = sequenceFlows.filter(flow => {
        const conditionExpression = flow.businessObject.get('conditionExpression');
        if (conditionExpression) {
            // Evaluate the condition expression
            return evaluateCondition(conditionExpression);
        } else {
            // If no condition expression is defined, consider the flow valid
            return true;
        }
    });

    //this._setActiveOutgoing(gateway, nonDefaultFlows);
    this._setActiveOutgoing(gateway, validFlows);
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

function getDefaultFlow(gateway) {
    const defaultFlow = getBusinessObject(gateway).default;

    if (defaultFlow) {
        return gateway.outgoing.find(flow => {
            const flowBo = getBusinessObject(flow);
            return flowBo === defaultFlow;
        });
    } else {
        // TODO does not seem to work
        // If no default flow is specified, return a random sequence flow
        const sequenceFlows = gateway.outgoing.filter(isSequenceFlow);

        return sequenceFlows[Math.floor(Math.random() * sequenceFlows.length)];
    }
}

function getNonDefaultFlows(gateway) {
    const defaultFlow = getDefaultFlow(gateway);

    return gateway.outgoing.filter(flow => {
        const flowBo = getBusinessObject(flow);

        return flowBo !== defaultFlow;
    });
}

function without(array, element) {
    return array.filter(arrayElement => arrayElement !== element);
}
