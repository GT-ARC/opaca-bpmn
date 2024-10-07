import ExclusiveGatewaySettings from './ExclusiveGatewayInterpreterModule';
import ElementColorsModule from 'bpmn-js-token-simulation/lib/features/element-colors';
import SimulationStylesModule from 'bpmn-js-token-simulation/lib/features/simulation-styles';

export default {
    __depends__: [
        ElementColorsModule,
        SimulationStylesModule
    ],
    exclusiveGatewaySettings: [ 'type', ExclusiveGatewaySettings ]
};