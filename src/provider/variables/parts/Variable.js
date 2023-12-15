import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry} from "@bpmn-io/properties-panel";


export default function Variable(props) {

    const {
        idPrefix,
        variable
    } = props;

    // return entries
    return [
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

    const predefinedTypes = ["String", "Integer", "Boolean", "Date"];

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
        return predefinedTypes.map(type => ({
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