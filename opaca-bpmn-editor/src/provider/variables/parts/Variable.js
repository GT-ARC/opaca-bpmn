import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from "@bpmn-io/properties-panel";
import { getDataTypes } from "../../util";

export default function Variable(props) {

    const {
        idPrefix,
        variable,
        addDescription
    } = props;

    // return entries
    const entries = [
        {
            id: idPrefix + '-name',
            component: Name,
            idPrefix,
            variable
        },
        {
            id: idPrefix + '-type',
            component: Type,
            idPrefix,
            variable
        }
    ];
    if(addDescription){
        entries.push({
            id: idPrefix + '-description',
            component: Description,
            idPrefix,
            variable
        });
    }
    return entries;
}

function Name(props) {
    const {
        idPrefix,
        element,
        variable
    } = props;

    const commandStack = useService('commandStack');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const setValue = (value) => {
        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: variable,
            properties: {
                name: value
            }
        });
    };

    const getValue = (variable) => {
        return variable.name;
    };

    return TextFieldEntry({
        element: variable,
        id: idPrefix + '-name',
        label: translate('Name'),
        getValue,
        setValue,
        debounce
    });
}

function Type(props) {
    const {
        idPrefix,
        element,
        variable
    } = props;

    const commandStack = useService('commandStack');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    // Basic types
    const predefinedTypes = ["integer", "number", "boolean", "string", "array", "object"];
    // Add custom types
    const allTypes = [].concat(getDataTypes(), predefinedTypes);

    const setValue = (value) => {
        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: variable,
            properties: {
                type: value
            }
        });
    };

    const getValue = (variable) => {
        return variable.type;
    };

    const getOptions = () => {
        return allTypes.map(type => ({
            value: type,
            label: type
        }));
    };

    return SelectEntry({
        element: variable,
        id: idPrefix + '-type',
        label: translate('Type'),
        getOptions,
        getValue,
        setValue,
        debounce
    });
}

function Description(props) {
    const {
        idPrefix,
        element,
        variable
    } = props;

    const commandStack = useService('commandStack');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const setValue = (value) => {
        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: variable,
            properties: {
                description: value
            }
        });
    };

    const getValue = (variable) => {
        return variable.description;
    };

    return TextFieldEntry({
        element: variable,
        id: idPrefix + '-description',
        label: translate('Description'),
        getValue,
        setValue,
        debounce
    });
}