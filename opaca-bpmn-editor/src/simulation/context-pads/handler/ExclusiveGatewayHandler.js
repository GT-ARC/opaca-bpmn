import {
    is
} from 'bpmn-js-token-simulation/lib/util/ElementHelper';

import {
    ForkIcon
} from 'bpmn-js-token-simulation/lib/icons';
import {getRootElement} from "../../../provider/util";

export default function ExclusiveGatewayHandler(exclusiveGatewaySettings) {
    this._exclusiveGatewaySettings = exclusiveGatewaySettings;
}

ExclusiveGatewayHandler.prototype.createContextPads = function(element) {

    const outgoingFlows = element.outgoing.filter(function(outgoing) {
        return is(outgoing, 'bpmn:SequenceFlow');
    });

    const root = getRootElement(element);

    if (outgoingFlows.length < 2 || root.isExecutable) {
        return;
    }

    const html = `
    <div class="bts-context-pad" title="Set Sequence Flow">
      ${ForkIcon()}
    </div>
  `;

    const action = () => {
        this._exclusiveGatewaySettings.setSequenceFlow(element, null);
    };

    return [
        {
            action,
            element,
            html
        }
    ];
};

ExclusiveGatewayHandler.$inject = [
    'exclusiveGatewaySettings'
];