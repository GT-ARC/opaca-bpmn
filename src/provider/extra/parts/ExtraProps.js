import { html } from 'htm/preact';

import { TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export default function(element) {

    return [
        {
            id: 'extra',
            element,
            component: Extra,
            isEdited: isTextFieldEntryEdited
        }
    ];
}

function Extra(props) {
    const { element, id } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => {
        return element.businessObject.extra || '';
    };

    const setValue = value => {
        return modeling.updateProperties(element, {
            extra: value
        });
    };

    return html`<${TextFieldEntry}
    id=${ id }
    element=${ element }
    description=${ translate('Add an extra property') }
    label=${ translate('Extra') }
    getValue=${ getValue }
    setValue=${ setValue }
    debounce=${ debounce }
    tooltip=${ translate('Check additional properties.') }
  />`;
}