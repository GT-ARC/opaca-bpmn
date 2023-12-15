import { TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry} from "@bpmn-io/properties-panel";
import {getBusinessObject, is} from "bpmn-js/lib/util/ModelUtil";
import { useEffect, useState } from '@bpmn-io/properties-panel/preact/hooks';

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
        }
    ];
}

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
        // Retrieve variables for the current scope
        const scope = getScope(element);
        const rootElement = getRootElement(element);

        try {
            //const definedVariables = await customGetVariablesForScope(scope, rootElement) || [];
            const definedVariables = rootElement.extensionElements.values[0].values || [];
            setVariables(definedVariables);
            // NOTE: This works for now, but is not that elegant
            // values[0] should be the variables_list:variables (but may change with additional extensionElements)
            // values[0].values gives the entries of that list
            // TODO: use scopes, make it more readable and stable, clean-up

        } catch (error) {
            console.error('Error fetching variables:', error);
        }
    }, [assignment]);

    const getOptions = () => {
        return Array.isArray(variables) ? variables.map(variable => ({
            value: variable.name,
            label: variable.name
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

// TODO maybe move these to util
function getRootElement(element) {
    // Implementation to get the root element
    const businessObject = getBusinessObject(element);

    if (is(businessObject, 'bpmn:Participant')) {
        return businessObject.processRef;
    }

    if (is(businessObject, 'bpmn:Process')) {
        return businessObject;
    }

    let parent = businessObject;

    while (parent.$parent && !is(parent, 'bpmn:Process')) {
        parent = parent.$parent;
    }

    return parent;
}

function getScope(element) {
    // Implementation to get the scope
    const bo = getBusinessObject(element);

    if (is(element, 'bpmn:Participant')) {
        return bo.processRef.id;
    }

    return bo.id;
}