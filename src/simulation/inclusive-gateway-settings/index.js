import InclusiveGatewaySettings from './InclusiveGatewayInterpreterModule';
import ElementColorsModule from 'bpmn-js-token-simulation/lib/features/element-colors';
import SimulationStylesModule from 'bpmn-js-token-simulation/lib/features/simulation-styles';

export default {
    __depends__: [
        ElementColorsModule,
        SimulationStylesModule
    ],
    inclusiveGatewaySettings: [ 'type', InclusiveGatewaySettings ]
};