// changed modules
import ExclusiveGatewaySettingsModule from './exclusive-gateway-settings';
import InclusiveGatewaySettingsModule from './inclusive-gateway-settings';
import ContextPadsModule from './context-pads';
import LogModule from './log';

// original modules
import SimulatorModule from 'bpmn-js-token-simulation/lib/simulator';
import AnimationModule from 'bpmn-js-token-simulation/lib/animation';
import ColoredScopesModule from 'bpmn-js-token-simulation/lib/features/colored-scopes';
import SimulationStateModule from 'bpmn-js-token-simulation/lib/features/simulation-state';
import ShowScopesModule from 'bpmn-js-token-simulation/lib/features/show-scopes';
import ElementSupportModule from 'bpmn-js-token-simulation/lib/features/element-support';
import PauseSimulationModule from 'bpmn-js-token-simulation/lib/features/pause-simulation';
import ResetSimulationModule from 'bpmn-js-token-simulation/lib/features/reset-simulation';
import TokenCountModule from 'bpmn-js-token-simulation/lib/features/token-count';
import SetAnimationSpeedModule from 'bpmn-js-token-simulation/lib/features/set-animation-speed';
import NeutralElementColors from 'bpmn-js-token-simulation/lib/features/neutral-element-colors';
import TokenSimulationPaletteModule from 'bpmn-js-token-simulation/lib/features/palette';

// additional
import InterpreterBaseModule from './interpreter-base';
import TimerEventSupportModule from './timer-event-support';
import MessageEventSupportModule from './message-event-support';
import ActivationManagerModule from './activation-manager';
import SignalEventSupportModule from './signal-event-support';

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
        TokenSimulationPaletteModule,
        ActivationManagerModule,
        //InterpreterBaseModule,
        //TimerEventSupportModule,
        //MessageEventSupportModule,
        SignalEventSupportModule
    ]
};