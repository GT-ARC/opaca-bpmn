import { html } from 'htm/preact';

import { TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export default function(element) {

    return [
        {
            id: 'serviceImplementation',
            element,
            component: ServiceImplementation,
            isEdited: isTextFieldEntryEdited
        }
    ];
}

function ServiceImplementation(props) {
    const { element, id } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => {
        return element.businessObject.serviceImplementation || '';
    };

    const setValue = value => {
        return modeling.updateProperties(element, {
            serviceImplementation: value
        });
    };

    return html`<${TextFieldEntry}
    id=${ id }
    element=${ element }
    description=${ translate('Define service implementation') }
    label=${ translate('Service Implementation') }
    getValue=${ getValue }
    setValue=${ setValue }
    debounce=${ debounce }
  />`;
}