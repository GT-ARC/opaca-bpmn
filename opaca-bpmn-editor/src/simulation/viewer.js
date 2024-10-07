import ToggleModeModule from 'bpmn-js-token-simulation/lib/features/toggle-mode/viewer';

import BaseModule from './base';

export default {
    __depends__: [
        BaseModule,
        ToggleModeModule
    ]
};