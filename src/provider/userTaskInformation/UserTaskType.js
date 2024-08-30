import {isSelectEntryEdited, SelectEntry} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export default function UserTaskType(element) {

    return [
        {
            id: 'userTaskType',
            element,
            component: Type,
            isEdited: isSelectEntryEdited
        }
    ];
}

function Type(props) {
    const {
        element,
        id
    } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => {
        return element.businessObject.userTaskType;
    };

    const setValue = value => {
        return modeling.updateProperties(element, { userTaskType: value });
    };

    // Drop-down options (information/input)
    const getOptions = () => {
        return [{value: 'information', label: 'Information'}, {value: 'input', label: 'Input'}];
    };

    return SelectEntry({
        element: element,
        id: id,
        label: translate('Type'),
        getOptions,
        getValue,
        setValue,
        debounce
    });
}
