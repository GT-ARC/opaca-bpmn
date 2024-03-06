import {
    filterSequenceFlows
} from 'bpmn-js-token-simulation/lib/simulator/util/ModelUtil';


export default function ExclusiveGatewayBehavior(simulator, scopeBehavior, eventBus) {
    this._scopeBehavior = scopeBehavior;
    this._simulator = simulator;
    this._eventBus = eventBus;

    simulator.registerBehavior('bpmn:ExclusiveGateway', this);
}

ExclusiveGatewayBehavior.prototype.enter = function(context) {
    this._simulator.exit(context);
};

ExclusiveGatewayBehavior.prototype.exit = function(context) {

    const {
        element,
        scope
    } = context;

    this._eventBus.fire('tokenSimulation.exitExclusiveGateway');

    // depends on UI to properly configure activeOutgoing for
    // each exclusive gateway

    const outgoings = filterSequenceFlows(element.outgoing);

    if (outgoings.length === 1) {
        return this._simulator.enter({
            element: outgoings[0],
            scope: scope.parent
        });
    }

    const {
        activeOutgoing
    } = this._simulator.getConfig(element);

    const outgoing = outgoings.find(o => o === activeOutgoing);

    if (!outgoing) {
        return this._scopeBehavior.tryExit(scope.parent, scope);
    }

    return this._simulator.enter({
        element: outgoing,
        scope: scope.parent
    });
};

ExclusiveGatewayBehavior.$inject = [
    'simulator',
    'scopeBehavior',
    'eventBus'
];