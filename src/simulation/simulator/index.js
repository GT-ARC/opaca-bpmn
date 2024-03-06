import Simulator from 'bpmn-js-token-simulation/lib/simulator/Simulator';
import SimulationBehaviorModule from './behaviors';

const HIGH_PRIORITY = 5000;

export default {
    __depends__: [
        SimulationBehaviorModule
    ],
    __init__: [
        [ 'eventBus', 'simulator', function(eventBus, simulator) {
            eventBus.on([
                'tokenSimulation.toggleMode',
                'tokenSimulation.resetSimulation'
            ], HIGH_PRIORITY, event => {
                // TODO why does this not work?
                //simulator.reset();
            });
        } ]
    ],
    simulator: [ 'type', Simulator ]
};