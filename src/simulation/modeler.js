import BaseModule from './base';
import DisableModelingModule from 'bpmn-js-token-simulation/lib/features/disable-modeling';

import ToggleModeModule from 'bpmn-js-token-simulation/lib/features/toggle-mode/modeler';
import TokenSimulationEditorActionsModule from 'bpmn-js-token-simulation/lib/features/editor-actions';
import TokenSimulationKeyboardBindingsModule from 'bpmn-js-token-simulation/lib/features/keyboard-bindings';

export default {
    __depends__: [
        BaseModule,
        DisableModelingModule,
        ToggleModeModule,
        TokenSimulationEditorActionsModule,
        TokenSimulationKeyboardBindingsModule
    ]
};