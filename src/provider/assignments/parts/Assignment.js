import { TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

//import ExtensionList from './ExtensionList';
//import { Importer } from 'bpmn-js/lib/import'

import { SelectEntry} from "@bpmn-io/properties-panel";
import {getBusinessObject, is} from "bpmn-js/lib/util/ModelUtil";


export default function Assignment(props) {

    const {
        idPrefix,
        assignment
    } = props;

    const entries = [
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
        }/*,
        {
            id: idPrefix + '-extensions',
            component: ExtensionList,
            idPrefix,
            parameter
        }
        */
    ];

    return entries;
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

    /*
    return TextFieldEntry({
        element: variable,
        id: idPrefix + '-name',
        label: translate('Name'),
        getValue,
        setValue,
        debounce
    });
     */

    // find parent containing variables
    var parent = element;
    const possibleParents = ['bpmn:Process', 'bpmn:SubProcess', 'bpmn:Participant', 'bpmn:Collaboration'];

    while (parent) {
        if (possibleParents.some(type => is(parent, type))) {
            break;
        }

        parent = parent.$parent;
    }
    console.log(parent);
    console.log(getBusinessObject(parent));
    const definedVariables = parent?.businessObject?.variables || [];


    const getOptions = () => {
        return definedVariables.map(variable => ({
            value: variable.name,
            label: variable.name
        }));
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