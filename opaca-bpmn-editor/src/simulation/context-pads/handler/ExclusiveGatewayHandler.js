import {
    is
} from 'bpmn-js-token-simulation/lib/util/ElementHelper';

export default function ExclusiveGatewayHandler(exclusiveGatewaySettings) {
    this._exclusiveGatewaySettings = exclusiveGatewaySettings;
}

ExclusiveGatewayHandler.prototype.createContextPads = function(element) {

    const outgoingFlows = element.outgoing.filter(function(outgoing) {
        return is(outgoing, 'bpmn:SequenceFlow');
    });

    if (outgoingFlows.length < 2) {
        return;
    }

    // Removed original bts-context-pad element
    // as we do not want to set sequence flows manually
    const html = ``;

    const action = () => {
        this._exclusiveGatewaySettings.setSequenceFlow(element);
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