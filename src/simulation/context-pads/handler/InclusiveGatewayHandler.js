import { getBusinessObject } from 'bpmn-js-token-simulation/lib/util/ElementHelper';
import { isSequenceFlow } from 'bpmn-js-token-simulation/lib/simulator/util/ModelUtil';

export default function InclusiveGatewayHandler(inclusiveGatewaySettings) {
    this._inclusiveGatewaySettings = inclusiveGatewaySettings;
}

InclusiveGatewayHandler.prototype.createContextPads = function(element) {
    const outgoingFlows = element.outgoing.filter(isSequenceFlow);

    if (outgoingFlows.length < 2) {
        return;
    }

    const nonDefaultFlows = outgoingFlows.filter(outgoing => {
        const flowBo = getBusinessObject(outgoing),
            gatewayBo = getBusinessObject(element);

        return gatewayBo.default !== flowBo;
    });

    // Removed original bts-context-pad element
    // as we do not want to set sequence flows manually
    const html = ``;

    return nonDefaultFlows.map(sequenceFlow => {
        const action = () => {
            this._inclusiveGatewaySettings.toggleSequenceFlow(element, sequenceFlow);
        };

        return {
            action,
            element: sequenceFlow,
            html
        };
    });
};

InclusiveGatewayHandler.$inject = [
    'inclusiveGatewaySettings'
];