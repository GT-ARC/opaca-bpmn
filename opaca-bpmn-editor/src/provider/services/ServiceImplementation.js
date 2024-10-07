import {isSelectEntryEdited, SelectEntry} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import {useEffect, useState} from '@bpmn-io/properties-panel/preact/hooks';
import {createElement, getRelevantBusinessObject, getRootElement} from "../util";
import {getServices} from "../../views/services/util";
import {createAssignments, getAssignmentsExtension} from "../assignments/util";

export default function ServiceImplementation(element, injector) {

    return [
        {
            id: 'serviceImpl',
            element,
            injector,
            component: Service,
            isEdited: isSelectEntryEdited
        }
    ];
}

function Service(props) {
    const {
        element,
        id,
        injector
    } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => {
        return element.businessObject.serviceImpl;
    };

    const setValue = value => {

        // Confirm window for automatic parameter assignment
        if(confirm('Create empty assignments for service parameters?')){
            const service = services.find(service => service.id === value);
            service.parameters.forEach(param => {
                simpleParameterAssignments(element, injector, param.name);
            });
        }
        return modeling.updateProperties(element, { serviceImpl: value });
    };

    const [services, setServices] = useState([]);

    useEffect(async () => {
        // Retrieve defined services
        try {
            const definitionsElement = getRootElement(element).$parent;
            const definedServices = getServices(definitionsElement) || [];
            setServices(definedServices);

        } catch (error) {
            console.error('Error fetching services:', error);
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



/// Create empty parameter assignments

function simpleParameterAssignments(element, injector, paramName){
    const commands = [];

    const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

    const businessObject = getRelevantBusinessObject(element);

    let extensionElements = businessObject.get('extensionElements');

    // (1) ensure extension elements
    if (!extensionElements) {
        extensionElements = createElement(
            'bpmn:ExtensionElements',
            { values: [] },
            businessObject,
            bpmnFactory
        );

        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: businessObject,
                properties: { extensionElements }
            }
        });
    }

    // (2) ensure assignments extension
    let extension = getAssignmentsExtension(element);

    if (!extension) {
        extension = createAssignments({
            values: []
        }, extensionElements, bpmnFactory);

        commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
                element,
                moddleElement: extensionElements,
                properties: {
                    values: [ ...extensionElements.get('values'), extension ]
                }
            }
        });
    }

    // (3) create assignment
    const newAssignment = createElement('vsdt2:Assignment', {
        variable : paramName,
        expression: '',
        assignTime: 'START'
    }, extension, bpmnFactory);

    // (4) add assignment to list
    commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
            element,
            moddleElement: extension,
            properties: {
                values: [ ...extension.get('values'), newAssignment ]
            }
        }
    });

    commandStack.execute('properties-panel.multi-command-executor', commands);
}