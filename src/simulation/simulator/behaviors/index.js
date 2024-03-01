// Original behaviors
import StartEventBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/StartEventBehavior';
import EndEventBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/EndEventBehavior';
import BoundaryEventBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/BoundaryEventBehavior';
import IntermediateCatchEventBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/IntermediateCatchEventBehavior';
import IntermediateThrowEventBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/IntermediateThrowEventBehavior';

import ExclusiveGatewayBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/ExclusiveGatewayBehavior';
import ParallelGatewayBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/ParallelGatewayBehavior';
import EventBasedGatewayBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/EventBasedGatewayBehavior';
import InclusiveGatewayBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/InclusiveGatewayBehavior';

import SubProcessBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/SubProcessBehavior';
import TransactionBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/TransactionBehavior';

import SequenceFlowBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/SequenceFlowBehavior';
import MessageFlowBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/MessageFlowBehavior';

import EventBehaviors from 'bpmn-js-token-simulation/lib/simulator/behaviors/EventBehaviors';
import ScopeBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/ScopeBehavior';

import ProcessBehavior from 'bpmn-js-token-simulation/lib/simulator/behaviors/ProcessBehavior';


// Changed behavior
import ActivityBehavior from './ActivityBehavior';

export default {
    __init__: [
        'startEventBehavior',
        'endEventBehavior',
        'boundaryEventBehavior',
        'intermediateCatchEventBehavior',
        'intermediateThrowEventBehavior',
        'exclusiveGatewayBehavior',
        'parallelGatewayBehavior',
        'eventBasedGatewayBehavior',
        'inclusiveGatewayBehavior',
        'subProcessBehavior',
        'sequenceFlowBehavior',
        'messageFlowBehavior',
        'processBehavior'
    ],
    startEventBehavior: [ 'type', StartEventBehavior ],
    endEventBehavior: [ 'type', EndEventBehavior ],
    boundaryEventBehavior: [ 'type', BoundaryEventBehavior ],
    intermediateCatchEventBehavior: [ 'type', IntermediateCatchEventBehavior ],
    intermediateThrowEventBehavior: [ 'type', IntermediateThrowEventBehavior ],
    exclusiveGatewayBehavior: [ 'type', ExclusiveGatewayBehavior ],
    parallelGatewayBehavior: [ 'type', ParallelGatewayBehavior ],
    eventBasedGatewayBehavior: [ 'type', EventBasedGatewayBehavior ],
    inclusiveGatewayBehavior: [ 'type', InclusiveGatewayBehavior ],
    activityBehavior: [ 'type', ActivityBehavior ],
    subProcessBehavior: [ 'type', SubProcessBehavior ],
    sequenceFlowBehavior: [ 'type', SequenceFlowBehavior ],
    messageFlowBehavior: [ 'type', MessageFlowBehavior ],
    eventBehaviors: [ 'type', EventBehaviors ],
    scopeBehavior: [ 'type', ScopeBehavior ],
    processBehavior: [ 'type', ProcessBehavior ],
    transactionBehavior: [ 'type', TransactionBehavior ]
};