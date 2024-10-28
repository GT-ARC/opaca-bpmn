import ContextPads from './ContextPadsInterpreterModule';

import ScopeFilterModule from 'bpmn-js-token-simulation/lib/features/scope-filter';

export default {
    __depends__: [
        ScopeFilterModule
    ],
    __init__: [
        'contextPads'
    ],
    contextPads: [ 'type', ContextPads ]
};