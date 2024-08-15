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
        // Filter for start events
        const startEvents = elements.filter(el => is(el, 'bpmn:StartEvent'));

        // Filter for events with timerEventDefinition
        const timerStartEvents = startEvents.filter(el => el.businessObject.eventDefinitions.find(ed => is(ed, 'bpmn:TimerEventDefinition')));

        // Call triggerTimer for each timer event with its eventDefinition
        Promise.all(timerStartEvents.map(event => this.triggerTimerEvent(event.id, event.businessObject.eventDefinitions.find(ed => is(ed, 'bpmn:TimerEventDefinition')))))
            .catch((error) => alert(error));
    });

    this.paused = false;

    // On Pause
    eventBus.on('tokenSimulation.pauseSimulation', () => {
        this.pauseTimers();
        this.paused = true;
    });

    // On Play
    eventBus.on('tokenSimulation.playSimulation', () => {
        /* This hack is needed, because playSimulation gets triggered unexpectedly, when an element is
            triggered for the first time - TODO
         */
        if(this.paused){
            this.resumeTimers();
            this.paused = false;
        }
    });
    
    eventBus.on('trace.elementEnter', (event) => {
        const element = event.element;
        if(is(element, 'bpmn:IntermediateCatchEvent')){
            const timerDefinition = element.businessObject.eventDefinitions.find(ed => is(ed, 'bpmn:TimerEventDefinition'));
            if(timerDefinition){
                console.log('found timer definition', timerDefinition);
                this.triggerTimerEvent(element.id, timerDefinition);
            }
        }
    });
}

// Creates timer for event based on timerDefinition
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
                        this.removeTimer(timeoutId);
                        resolve();
                    }catch(err){
                        this.removeTimer(timeoutId);
                        reject(new Error(`Failed to trigger timer event ${eventId}: ${err}`));
                    }
                }, delay);
                this.activeTimers.push({ id: timeoutId, eventId: eventId, startTime: now, delay});
            }
        } else if (timerDefinition.timeDuration) { // DURATION
            const duration = parseISO8601Duration(timerDefinition.timeDuration.body); // Parse ISO 8601 duration string
            const timeoutId = setTimeout(() => {
                try{
                    this._simulationSupport.triggerElement(eventId);
                    this.removeTimer(timeoutId);
                    resolve();
                }catch(err){
                    this.removeTimer(timeoutId);
                    reject(new Error(`Failed to trigger timer event ${eventId}: ${err}`));
                }
            }, duration);
            this.activeTimers.push({ id: timeoutId, eventId: eventId, startTime: now, delay: duration});
        } else if (timerDefinition.timeCycle) { // CYCLE (INTERVAL)
            const { repetitions, interval, delay } = parseISO8601Cycle(timerDefinition.timeCycle.body); // Parse ISO 8601 cycle string
            for (let i = 0; i < repetitions; i++) {
                const timeoutId = setTimeout(() => {
                    try{
                        this._simulationSupport.triggerElement(eventId);
                        this.removeTimer(timeoutId);
                    }catch(err){
                        this.removeTimer(timeoutId);
                        reject(new Error(`Failed to trigger timer event ${eventId}: ${err}`));
                    }
                }, delay + interval * i);
                this.activeTimers.push({ id: timeoutId, eventId: eventId, startTime: now, delay: delay + interval * i });
            }
            resolve();
        }
    });
}

// Clears and removes all timers
TimerEventSupport.prototype.clearActiveTimers = function() {
    this.activeTimers.forEach(timer => {
        // Clear timers
        clearTimeout(timer.id);
    });
    // Empty list
    this.activeTimers = [];
};

// Clears timers and calculates passed time
TimerEventSupport.prototype.pauseTimers = function() {
    const now = Date.now();
    this.activeTimers.forEach(timer => {
        clearTimeout(timer.id);
        timer.delay = timer.delay - (now - timer.startTime);
    });
};

// Starts paused timers with new delay
TimerEventSupport.prototype.resumeTimers = function() {
    const now = Date.now();

    this.activeTimers.forEach(timer => {
        timer.startTime = now;
        timer.id = setTimeout(() => {
            try {
                this._simulationSupport.triggerElement(timer.eventId);
                this.removeTimer(timer.id);
            } catch (err) {
                this.removeTimer(timer.id);
                alert(`Failed to trigger timer event ${timer.eventId}: ${err}`);
            }
        }, timer.delay);
    });
};

// Clears and removes a timer by id
TimerEventSupport.prototype.removeTimer = function(timeoutId) {
    clearTimeout(timeoutId);
    this.activeTimers = this.activeTimers.filter(timer => timer.id !== timeoutId);
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
    const match = cycle.match(/R(\d*)\/(?:((?:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?))\/)?P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    let repetitions = 100000;
    let interval = 0;
    let delay = 0;
    if (match) {
        if (match[1]) repetitions = parseInt(match[1]);
        if (match[2]) {
            const startTime = new Date(match[2]);
            delay = startTime - new Date();
        }
        if (match[3]) interval += parseInt(match[3]) * 24 * 60 * 60 * 1000; // Days
        if (match[4]) interval += parseInt(match[4]) * 60 * 60 * 1000; // Hours
        if (match[5]) interval += parseInt(match[5]) * 60 * 1000; // Minutes
        if (match[6]) interval += parseInt(match[6]) * 1000; // Seconds
    }
    if(delay === 0){
        delay = interval;
    }
    return { repetitions, interval, delay };
}

TimerEventSupport.$inject = [
    'eventBus',
    'elementRegistry',
    'toggleMode',
    'simulationSupport'
];

// For testing only
export function testTimerDefinition(isCycle, definition){
    if(isCycle){
        return parseISO8601Cycle(definition);
    }else{
        return parseISO8601Duration(definition);
    }
}
