import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from "@bpmn-io/properties-panel";
import { useEffect, useState } from '@bpmn-io/properties-panel/preact/hooks';
import { getAllVariables } from "../util";
import { is } from 'bpmn-js/lib/util/ModelUtil';

export default function Assignment(props) {

    const {
        idPrefix,
        assignment
    } = props;

    // return entries
    return [
        {
            id: idPrefix + '-variable',
            component: Variable,
            idPrefix,
            assignment
        },
        {
            id: idPrefix + '-expression',
            component: Expression,
            idPrefix,
            assignment
        },
        {
            id: idPrefix + '-assignTime',
            component: AssignTime,
            idPrefix,
            assignment
        }
    ];
}
// Getting and setting variable name of assignment
function Variable(props) {
    const {
        idPrefix,
        element,
        assignment
    } = props;

    const commandStack = useService('commandStack');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const setValue = (value) => {
        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: assignment,
            properties: {
                variable: value
            }
        });
    };

    const getValue = (assignment) => {
        return assignment.variable;
    };

    const [variables, setVariables] = useState([]);

    useEffect(async () => {
        // Retrieve defined variables
        try {
            const definedVariables = getAllVariables(element);
            setVariables(definedVariables);

        } catch (error) {
            console.error('Error fetching variables:', error);
        }
    }, [assignment]);

    // Drop-down options (defined variables)
    const getOptions = () => {
        return Array.isArray(variables) ? variables.map(variable => ({
            value: variable.name,
            label: variable.name + ' (' + variable.type + ')'
        })) : [];
    };

    return SelectEntry({
        element: assignment,
        id: idPrefix + '-variable',
        label: translate('Variable'),
        getOptions,
        getValue,
        setValue,
        debounce
    });
}

// Getting and setting expression of assignment
function Expression(props) {
    const {
        idPrefix,
        element,
        assignment
    } = props;

    const commandStack = useService('commandStack');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const setValue = (value) => {
        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: assignment,
            properties: {
                expression: value
            }
        });
    };

    const getValue = (Assignment) => {
        return Assignment.expression;
    };

    return TextFieldEntry({
        element: assignment,
        id: idPrefix + '-expression',
        label: translate('Expression'),
        getValue,
        setValue,
        debounce
    });
}

// Getting and setting assignTime of assignment
function AssignTime(props){
    const {
        idPrefix,
        element,
        assignment
    } = props;

    const commandStack = useService('commandStack');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const setValue = (value) => {
        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: assignment,
            properties: {
                assignTime: value
            }
        });
    };

    const getValue = (assignment) => {
        return assignment.assignTime;
    };

    // Drop-down options (start or end)
    const getOptions = () => {
        // Only able to assign in StartEvent, when exiting
        // and in EndEvent, when entering
        const types = is(element, 'bpmn:StartEvent')
            ? ["END"]
            : is(element, 'bpmn:EndEvent')
            ? ["START"]
            : ["START", "END"];

        return types.map(type => ({
            value: type,
            label: type
        }));
    };

    return SelectEntry({
        element: assignment,
        id: idPrefix + '-assignTime',
        label: translate('Assign time'),
        getOptions,
        getValue,
        setValue,
        debounce
    });
}
