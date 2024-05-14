import Log from './Log';

import ScopeFilterModule from 'bpmn-js-token-simulation/lib/features/scope-filter';
import NotificationsModule from 'bpmn-js-token-simulation/lib/features/notifications';

export default {
    __depends__: [
        NotificationsModule,
        ScopeFilterModule
    ],
    __init__: [
        'log'
    ],
    log: [ 'type', Log ]
};