import {addVariable, assignAndGet, evaluateCondition} from '../../src/simulation/util';

//// These tests are only meant to validate the evaluation of expressions ////
//// They don't test the actual assignments etc. as these would depend on elements of a diagram ////

// Mock opacaUtil to prevent its code from running
jest.mock('../../src/opacaUtil', () => ({
    setupDOMInteractions: jest.fn(), // Mock functions or methods as needed
}));

window.alert = jest.fn();

// Create a mock scope
const scope = {};
scope.id = 'scope001';
scope.parent = scope;

const int1 = {name: 'int1', value: 1};
const str1 = { name: 'str1', value: 'hello' };
const bool1 = { name: 'bool1', value: true };
const obj1 = { name: 'obj1', value: { field1: 10, field2: 'world' } };

beforeEach(() => {
    // Always have these variables for testing
    // (they are overwritten before each test)
    addVariable(int1, scope.id);
    addVariable(str1, scope.id);
    addVariable(bool1, scope.id);
    addVariable(obj1, scope.id);
});

test('simpleAddition', () => {
    const assignment = {variable: 'int1', expression: 'int1+5'};
    // 1 + 5 = 6
    expect(assignAndGet(assignment, scope.id)).toBe(6);

    assignment.expression = 'int1+int1';
    // 6 + 6 = 12
    expect(assignAndGet(assignment, scope.id)).toBe(12);
});

test('simpleMultiplication', () => {
    const assignment = {variable: 'int1', expression: 'int1*3'};
    // 1 * 3 = 3
    expect(assignAndGet(assignment, scope.id)).toBe(3);

    assignment.expression = 'int1*int1';
    // 3 * 3 = 9
    expect(assignAndGet(assignment, scope.id)).toBe(9);
});

test('stringConcatenation', () => {
    const assignment = { variable: 'str1', expression: 'str1 + " world"' };
    // 'hello' + ' world' = 'hello world'
    expect(assignAndGet(assignment, scope.id)).toBe('hello world');

    assignment.expression = 'str1 + "!"';
    // 'hello world' + '!' = 'hello world!'
    expect(assignAndGet(assignment, scope.id)).toBe('hello world!');

    assignment.expression = 'str1.toUpperCase() + "!!"';
    // 'HELLO WORLD!' + '!!' = 'HELLO WORLD!!!'
    expect(assignAndGet(assignment, scope.id)).toBe('HELLO WORLD!!!');
});

test('booleanOperations', () => {
    const assignment = { variable: 'bool1', expression: '!bool1' };
    // !true = false
    expect(assignAndGet(assignment, scope.id)).toBe(false);

    assignment.expression = 'bool1 && false';
    // false && false = false
    expect(assignAndGet(assignment, scope.id)).toBe(false);

    assignment.expression = 'bool1 || true';
    // false || true = true
    expect(assignAndGet(assignment, scope.id)).toBe(true);

    assignment.expression = 'bool1 && !((5-2)===3)';
    // true && !true = false
    expect(assignAndGet(assignment, scope.id)).toBe(false);
});

test('mixedConcatenation', () => {
    const assignment = { variable: 'str1', expression: 'str1 + ", this is " + 9 + int1 + int1' };
    // 'hello' + ', this is ' + 9 + 1 +1 = 'hello, this is 911'
    expect(assignAndGet(assignment, scope.id)).toBe('hello, this is 911');
});

test('objectFieldAccess', () => {
    const assignment = { variable: 'int1', expression: 'obj1.field1' };
    // obj1.field1 = 10
    expect(assignAndGet(assignment, scope.id)).toBe(10);

    assignment.variable = 'str1';
    assignment.expression = 'obj1.field2';
    // obj1.field2 = 'world'
    expect(assignAndGet(assignment, scope.id)).toBe('world');
});

test('complexExpression', () => {
    const assignment = { variable: 'int1', expression: '(int1 + 2) * obj1.field1' };
    // (1 + 2) * 10 = 30
    expect(assignAndGet(assignment, scope.id)).toBe(30);

    assignment.variable = 'str1';
    assignment.expression = '("" + int1).repeat(3)';
    // '30'.repeat(3) = '303030'
    expect(assignAndGet(assignment, scope.id)).toBe('303030');

    assignment.variable = 'obj1';
    assignment.expression = '{field1: +str1 / 10, field2: obj1.field2 + " hello"}';
    // +'303030' / 10 = 30303
    // world = world
    expect(assignAndGet(assignment, scope.id)).toStrictEqual({field1: 30303, field2: 'world hello'});
});

test('evaluateCondition', () => {
    var condition = '2+2 === 4';
    expect(evaluateCondition(condition, scope)).toBe(true);

    condition = 'str1 === "hello"';
    expect(evaluateCondition(condition, scope)).toBe(true);

    condition = 'obj1.field2 === "hello"';
    expect(evaluateCondition(condition, scope)).toBe(false);

    condition = 'obj1.field1 - 1 < 10 && obj1.field1 >= 9';
    expect(evaluateCondition(condition, scope)).toBe(true);
})