import {is} from "bpmn-js/lib/util/ModelUtil";

export default function TimerEventSupport(
    eventBus, elementRegistry, toggleMode, simulationSupport) {

    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._toggleMode = toggleMode;
    this._simulationSupport = simulationSupport;

    // Keep list of running timers
    this.activeTimers = [];

    eventBus.on('tokenSimulation.toggleMode', () => {
        if(this._toggleMode._active){
            // When toggled off, clear running timers
            this.clearActiveTimers();
            return;
        }
        // Get all elements
        const elements = elementRegistry.getAll();
        // Filter for events
        const events = elements.filter(el => is(el, 'bpmn:Event'));
        // Filter for events with timerEventDefinition
        const timerEvents = events.filter(el => el.businessObject.eventDefinitions.find(ed => is(ed, 'bpmn:TimerEventDefinition')));

        // Call triggerTimer for each timer event with its eventDefinition
        Promise.all(timerEvents.map(event => this.triggerTimerEvent(event.id, event.businessObject.eventDefinitions.find(ed => is(ed, 'bpmn:TimerEventDefinition')))))
            .catch((error) => alert(error));
    });
}

TimerEventSupport.prototype.triggerTimerEvent = function(eventId, timerDefinition) {
    return new Promise((resolve, reject) => {
        const now = new Date();

        if (timerDefinition.timeDate) { // DATE
            const triggerTime = new Date(timerDefinition.timeDate.body);
            if (now === triggerTime) {
                try{
                    this._simulationSupport.triggerElement(eventId);
                    resolve();
                }catch(err){
                    reject(new Error(`Failed to trigger timer event ${eventId}: ${err}`));
                }
            } else if (now <= triggerTime) {
                const delay = triggerTime - now;
                const timeoutId = setTimeout(() => {
                    try{
                        this._simulationSupport.triggerElement(eventId);
                        resolve();
                    }catch(err){
                        reject(new Error(`Failed to trigger timer event ${eventId}: ${err}`));
                    }
                }, delay);
                this.activeTimers.push(timeoutId);
            }
        } else if (timerDefinition.timeDuration) { // DURATION
            const duration = parseISO8601Duration(timerDefinition.timeDuration.body); // Parse ISO 8601 duration string
            const timeoutId = setTimeout(() => {
                try{
                    this._simulationSupport.triggerElement(eventId);
                    resolve();
                }catch(err){
                    reject(new Error(`Failed to trigger timer event ${eventId}: ${err}`));
                }
            }, duration);
            this.activeTimers.push(timeoutId);
        } else if (timerDefinition.timeCycle) { // CYCLE (INTERVAL)
            const {repetitions, interval} = parseISO8601Cycle(timerDefinition.timeCycle.body); // Parse ISO 8601 cycle string
            let count = 0;
            const intervalId = setInterval(() => {
                if (count < repetitions) {
                    try{
                        this._simulationSupport.triggerElement(eventId);
                        count++;
                    }catch(err){
                        reject(new Error(`Failed to trigger timer event ${eventId}: ${err}`));
                    }
                } else {
                    clearInterval(intervalId);
                    resolve();
                }
            }, interval);
            this.activeTimers.push(intervalId);
        }
    });
}

TimerEventSupport.prototype.clearActiveTimers = function() {
    this.activeTimers.forEach(timerId => {
        clearTimeout(timerId);
        clearInterval(timerId);
    });
    this.activeTimers = [];
};

function parseISO8601Duration(duration) {
    // Simple parser for ISO 8601 duration strings
    const match = duration.match(/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    let milliseconds = 0;
    if (match) {
        if (match[1]) milliseconds += parseInt(match[1]) * 24 * 60 * 60 * 1000; // Days
        if (match[2]) milliseconds += parseInt(match[2]) * 60 * 60 * 1000; // Hours
        if (match[3]) milliseconds += parseInt(match[3]) * 60 * 1000; // Minutes
        if (match[4]) milliseconds += parseInt(match[4]) * 1000; // Seconds
    }
    return milliseconds;
}

function parseISO8601Cycle(cycle) {
    const match = cycle.match(/R(\d*)\/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    let repetitions = Infinity;
    let milliseconds = 0;
    if (match) {
        if (match[1]) repetitions = parseInt(match[1]); // Repetitions
        if (match[2]) milliseconds += parseInt(match[2]) * 24 * 60 * 60 * 1000; // Days
        if (match[3]) milliseconds += parseInt(match[3]) * 60 * 60 * 1000; // Hours
        if (match[4]) milliseconds += parseInt(match[4]) * 60 * 1000; // Minutes
        if (match[5]) milliseconds += parseInt(match[5]) * 1000; // Seconds
    }
    return { repetitions, interval: milliseconds };
}

TimerEventSupport.$inject = [
    'eventBus',
    'elementRegistry',
    'toggleMode',
    'simulationSupport'
];