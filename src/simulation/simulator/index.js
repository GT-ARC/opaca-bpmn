import Simulator from 'bpmn-js-token-simulation/lib/simulator/Simulator';
import SimulationBehaviorModule from './behaviors';

import {TOGGLE_MODE_EVENT, RESET_SIMULATION_EVENT} from "bpmn-js-token-simulation/lib/util/EventHelper";

const HIGH_PRIORITY = 5000;

export default {
    __depends__: [
        SimulationBehaviorModule
    ],
    __init__: [
        [ 'eventBus', 'simulator', function(eventBus, simulator) {
            eventBus.on([
                TOGGLE_MODE_EVENT,
                RESET_SIMULATION_EVENT
            ], HIGH_PRIORITY, event => {
                simulator.reset();
            });
        } ]
    ],
    simulator: [ 'type', Simulator ]
};