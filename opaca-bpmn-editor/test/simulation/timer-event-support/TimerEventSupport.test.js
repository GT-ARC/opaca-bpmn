import { testTimerDefinition } from "../../../src/simulation/timer-event-support/TimerEventSupportModule";

const cycle = true;
const duration = false;

test('CycleSimple', () => {
    // Define the timer definition
    const timerDefinition = 'R4/PT20M30S';

    const result = testTimerDefinition(cycle, timerDefinition);

    const expectedInterval = 20 * 60 * 1000 + 30 * 1000;

    //const expectedDelay = new Date().getTime();

    expect(result.repetitions).toBe(4);
    expect(result.interval).toBe(expectedInterval);
    expect(result.delay).toBe(expectedInterval);
});

test('CycleWithDateUTC', () => {
    // Define the timer definition
    const timerDefinition = 'R4/2021-12-31T23:55:00Z/PT5M';

    // Get the current time at the start of the test
    const currentTime = Date.now();

    // Call the function to test
    const result = testTimerDefinition(cycle, timerDefinition);

    // Expected values
    const expectedRepetitions = 4;
    const expectedInterval = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Calculate the expected delay range
    const timerStartTime = new Date('2021-12-31T23:55:00Z').getTime();
    const expectedDelayMin = timerStartTime - currentTime - 100;  // Add a tolerance of ±10 ms
    const expectedDelayMax = timerStartTime - currentTime + 100;

    // Check repetitions and interval
    expect(result.repetitions).toBe(expectedRepetitions);
    expect(result.interval).toBe(expectedInterval);

    // Check that the delay is within the acceptable range
    expect(result.delay).toBeGreaterThanOrEqual(expectedDelayMin);
    expect(result.delay).toBeLessThanOrEqual(expectedDelayMax);
});

test('CycleWithDateUTC2', () => {
    // Define another timer definition
    const timerDefinition = 'R2/2021-12-31T23:50:00Z/PT10M';

    // Get the current time at the start of the test
    const currentTime = Date.now();

    // Call the function to test
    const result = testTimerDefinition(cycle, timerDefinition);

    // Expected values
    const expectedRepetitions = 2;
    const expectedInterval = 10 * 60 * 1000; // 10 minutes in milliseconds

    // Calculate the expected delay range
    const timerStartTime = new Date('2021-12-31T23:50:00Z').getTime();
    const expectedDelayMin = timerStartTime - currentTime - 100;  // Add a tolerance of ±10 ms
    const expectedDelayMax = timerStartTime - currentTime + 100;

    // Check repetitions and interval
    expect(result.repetitions).toBe(expectedRepetitions);
    expect(result.interval).toBe(expectedInterval);

    // Check that the delay is within the acceptable range
    expect(result.delay).toBeGreaterThanOrEqual(expectedDelayMin);
    expect(result.delay).toBeLessThanOrEqual(expectedDelayMax);
});

test('Duration', () => {
    // Define the timer definition
    const timerDefinition = 'PT1H12M30S';

    // Call the function to test
    const result = testTimerDefinition(duration, timerDefinition);

    // Expected duration
    const expected = 60 * 60 * 1000 + 12 * 60 * 1000 + 30 * 1000

    // Check that the delay is within the acceptable range
    expect(result).toBe(expected);
});

test('CycleWithDateOffset', () => {
    // Define another timer definition
    const timerDefinition = 'R6/2024-08-31T23:50:00+02:00/PT15M';

    // Get the current time at the start of the test
    const currentTime = new Date();

    // Call the function to test
    const result = testTimerDefinition(cycle, timerDefinition);

    // Expected values
    const expectedRepetitions = 6;
    const expectedInterval = 15 * 60 * 1000; // 10 minutes in milliseconds

    // Calculate the expected delay range
    const timerStartTime = new Date('2024-08-31T23:50:00+02:00').getTime();
    const expectedDelayMin = timerStartTime - currentTime - 100;  // Add a tolerance of ±10 ms
    const expectedDelayMax = timerStartTime - currentTime + 100;

    // Check repetitions and interval
    expect(result.repetitions).toBe(expectedRepetitions);
    expect(result.interval).toBe(expectedInterval);

    // Check that the delay is within the acceptable range
    expect(result.delay).toBeGreaterThanOrEqual(expectedDelayMin);
    expect(result.delay).toBeLessThanOrEqual(expectedDelayMax);
});
