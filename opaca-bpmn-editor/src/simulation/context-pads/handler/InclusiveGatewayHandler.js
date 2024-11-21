import { getBusinessObject } from 'bpmn-js-token-simulation/lib/util/ElementHelper';
import { isSequenceFlow } from 'bpmn-js-token-simulation/lib/simulator/util/ModelUtil';

import { ForkIcon } from 'bpmn-js-token-simulation/lib/icons';
import {getRootElement} from "../../../provider/util";

export default function InclusiveGatewayHandler(inclusiveGatewaySettings) {
    this._inclusiveGatewaySettings = inclusiveGatewaySettings;
}

InclusiveGatewayHandler.prototype.createContextPads = function(element) {
    const outgoingFlows = element.outgoing.filter(isSequenceFlow);

    const root = getRootElement(element);

    if (outgoingFlows.length < 2 || root.isExecutable) {
        return;
    }

    const nonDefaultFlows = outgoingFlows.filter(outgoing => {
        const flowBo = getBusinessObject(outgoing),
            gatewayBo = getBusinessObject(element);

        return gatewayBo.default !== flowBo;
    });

    const html = `
    <div class="bts-context-pad" title="Set Sequence Flow">
      ${ForkIcon()}
    </div>
    `;

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