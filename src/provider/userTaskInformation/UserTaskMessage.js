import {isSelectEntryEdited, TextFieldEntry} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export default function UserTaskMessage(element) {

    return [
        {
            id: 'userTaskMessage',
            element,
            component: Message,
            isEdited: isSelectEntryEdited
        }
    ];
}

function Message(props) {
    const {
        element,
        id
    } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => {
        return element.businessObject.userTaskMessage;
    };

    const setValue = value => {
        return modeling.updateProperties(element, { userTaskMessage: value });
    };

    return TextFieldEntry({
        element: element,
        id: id,
        label: translate('Message'),
        getValue,
        setValue,
        debounce
    });
}
