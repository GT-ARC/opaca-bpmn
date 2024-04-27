import {isSelectEntryEdited, SelectEntry} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import {useEffect, useState} from '@bpmn-io/properties-panel/preact/hooks';
import {getRootElement} from "../util";
import {getServices} from "../../views/services/util";

export default function ServiceImplementation(element) {

    return [
        {
            id: 'service',
            element,
            component: Service,
            isEdited: isSelectEntryEdited
        }
    ];
}

function Service(props) {
    const {
        element,
        id
    } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => {
        return element.businessObject.service;
    };

    const setValue = value => {
        return modeling.updateProperties(element, { service: value });
    };

    const [services, setServices] = useState([]);

    useEffect(async () => {
        // Retrieve defined services
        try {
            const definitionsElement = getRootElement(element).$parent;
            const definedServices = getServices(definitionsElement) || [];
            setServices(definedServices);

        } catch (error) {
            console.error('Error fetching variables:', error);
        }
    }, [element]);

    // Drop-down options (defined services)
    const getOptions = () => {
        return Array.isArray(services) ? services.map(service => ({
            value: service.id,
            label: service.name + ' (' + service.id + ')'
        })) : [];
    };

    return SelectEntry({
        element: element,
        id: id,
        label: translate('Service'),
        getOptions,
        getValue,
        setValue,
        debounce
    });
}