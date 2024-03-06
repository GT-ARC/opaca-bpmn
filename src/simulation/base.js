// changed module
import ExclusiveGatewaySettingsModule from './exclusive-gateway-settings';
import InclusiveGatewaySettingsModule from './inclusive-gateway-settings';
import ContextPadsModule from './context-pads';
import SimulatorModule from './simulator';

// original modules
//import SimulatorModule from 'bpmn-js-token-simulation/lib/simulator';
import AnimationModule from 'bpmn-js-token-simulation/lib/animation';
import ColoredScopesModule from 'bpmn-js-token-simulation/lib/features/colored-scopes';
//import ContextPadsModule from 'bpmn-js-token-simulation/lib/features/context-pads';
import SimulationStateModule from 'bpmn-js-token-simulation/lib/features/simulation-state';
import ShowScopesModule from 'bpmn-js-token-simulation/lib/features/show-scopes';
import LogModule from 'bpmn-js-token-simulation/lib/features/log';
import ElementSupportModule from 'bpmn-js-token-simulation/lib/features/element-support';
import PauseSimulationModule from 'bpmn-js-token-simulation/lib/features/pause-simulation';
import ResetSimulationModule from 'bpmn-js-token-simulation/lib/features/reset-simulation';
import TokenCountModule from 'bpmn-js-token-simulation/lib/features/token-count';
import SetAnimationSpeedModule from 'bpmn-js-token-simulation/lib/features/set-animation-speed';

//import ExclusiveGatewaySettingsModule from 'bpmn-js-token-simulation/lib/features/exclusive-gateway-settings';
import NeutralElementColors from 'bpmn-js-token-simulation/lib/features/neutral-element-colors';
//import InclusiveGatewaySettingsModule from 'bpmn-js-token-simulation/lib/features/inclusive-gateway-settings';
import TokenSimulationPaletteModule from 'bpmn-js-token-simulation/lib/features/palette';

export default {
    __depends__: [
        SimulatorModule,
        AnimationModule,
        ColoredScopesModule,
        ContextPadsModule,
        SimulationStateModule,
        ShowScopesModule,
        LogModule,
        ElementSupportModule,
        PauseSimulationModule,
        ResetSimulationModule,
        TokenCountModule,
        SetAnimationSpeedModule,
        ExclusiveGatewaySettingsModule,
        NeutralElementColors,
        InclusiveGatewaySettingsModule,
        TokenSimulationPaletteModule
    ]
};