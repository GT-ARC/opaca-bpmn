import {addFactory, getRelevantServiceProperty, getServices, removeFactory} from "./Services";
import {getRootElement, nextId} from "../../provider/util";
import {getDataTypes} from "../../provider/variables/util";

export default function ServiceView(elementRegistry, injector, eventBus) {
    const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

    const addServiceButton = document.getElementById('addServiceButton');
    addServiceButton.addEventListener('click', createNewService);

    // Create new empty service
    function createNewService() {
        // Get root of diagram
        const firstElement = elementRegistry.getAll()[0];
        const root = getRootElement(firstElement);

        // Get bpmn:Definitions (where we want to define services)
        const element = root.$parent;

        const newService = { type: '', uri: '', name: '', result: {name: '', type: ''}, parameters: [], id: nextId('service_') };
        console.log('CREATE NEW SERVICE:', newService);

        addFactory(element, bpmnFactory, commandStack, newService);

        // Create a new service entry in service view
        createServiceEntry(element, newService);
    }

    // Function to create a service entry
    function createServiceEntry(element, service) {
        // Container for new entry
        const entry = document.createElement('div');
        entry.className = 'service-entry';

        // Input Fields
        const typeInput = createDropdown(element, entry, 'Service-type', service, ['OPACA', 'REST', 'BPMN Process'], (value) => {
            service.type = value;
        });
        const uriInput = createInput(element, entry, 'URI', service);
        const nameInput = createInput(element, entry, 'Name', service);

        const resultInput = createResultGroup(element, entry, service);

        const parametersInput = createParametersGroup(element, entry, service);

        // Button for removing a service
        const removeButton = document.createElement('button');
        removeButton.innerHTML = 'x';
        removeButton.addEventListener('click', () => {
            // Get property by id
            const serviceToRemove = getRelevantServiceProperty(element, service.id);
            // Remove property from XML
            removeFactory(commandStack, element, serviceToRemove);

            // Remove the entry from the DOM
            content.removeChild(entry);
        });

        // Add entry to the content
        entry.appendChild(typeInput);
        entry.appendChild(uriInput);
        entry.appendChild(nameInput);
        entry.appendChild(resultInput);
        entry.appendChild(parametersInput);
        entry.appendChild(removeButton);
        content.appendChild(entry);
    }

    // Function to create an element for URI / name input
    function createInput(element, entry, placeholder, service) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;

        if(placeholder==='URI'){
            input.value = service.uri || '';
        }else if(placeholder==='Name'){
            input.value = service.name || '';
        }else if(placeholder==='Result-name'){
            input.value = service.result.name || '';
        }else{
            // TODO for initialization an index (or something) must be given
            // input.value = service.parameters[index].name || '';
            input.value = 'some parameter name';
        }

        // Add class to the input element based on the placeholder
        input.classList.add(`${placeholder.toLowerCase()}-input`);

        // Add event listener to update the model on blur
        input.addEventListener('change', () => {
            // Get current inputs
            const newService = getCurrentServiceValues(entry, service)

            // Update XML
            updateModel(element, service.id, newService);
        });
        return input;
    }

    // Function to create a dropdown
    function createDropdown(element, entry, placeholder, service, options) {
        const dropdown = document.createElement('select');
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = placeholder;
        dropdown.add(defaultOption);

        dropdown.classList.add('type-input');

        // Add options to pick from
        options.forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.text = option;
            dropdown.add(optionElement);
        });

        if(placeholder==='Service-type'){
            dropdown.value = service.type || '';
        }else if(placeholder==='Result-type'){
            dropdown.value = service.result.type || '';
        }else{
            // TODO for initialization an index (or something) must be given
            // dropdown.value = service.parameters[index].type || '';
            dropdown.value = 'some parameter type';
        }

        // Add event listener to update the model when selection changes
        dropdown.addEventListener('change', (event) => {
            // Current inputs
            const newService = getCurrentServiceValues(entry, service);
            updateModel(element, service.id, newService);
        });
        return dropdown;
    }

    function createResultGroup(element, entry, service){
        const resultInput = document.createElement('div');
        resultInput.classList.add('result-group');

        const resultName = createInput(element, entry, 'Result-name', service);

        // Basic types
        const predefinedTypes = ["int", "long", "double", "float", "boolean", "char", "String"];
        // Add custom types
        const allTypes = [].concat(getDataTypes(), predefinedTypes);

        const resultType = createDropdown(element, entry, 'Result-type', service, allTypes);

        resultInput.appendChild(resultName);
        resultInput.appendChild(resultType);

        return resultInput;
    }

    function createParametersGroup(element, entry, service){
        // TODO parameters must be added on initialization
        const paramsInput = document.createElement('div');
        paramsInput.classList.add('parameters-group');

        const addParameterButton = document.createElement('button');
        addParameterButton.innerHTML = '+';
        addParameterButton.addEventListener('click', () => {

            const paramEntry = document.createElement('div');
            paramEntry.classList.add('param-entry');

            // Create input for parameter name
            const paramName = createInput(element, entry, 'Parameter-name', service);

            // Basic types
            const predefinedTypes = ["int", "long", "double", "float", "boolean", "char", "String"];
            // Add custom types
            const allTypes = [].concat(getDataTypes(), predefinedTypes);
            // Create dropdown for parameter type
            const paramType = createDropdown(element, entry, 'Parameter-type', service, allTypes);

            // Button for removing a parameter
            const removeButton = document.createElement('button');
            removeButton.innerHTML = 'x';
            removeButton.addEventListener('click', () => {
                // Remove the entry from the DOM
                paramsInput.removeChild(paramEntry);

                // Update the XML
                const newService = getCurrentServiceValues(entry, service);
                updateModel(element, service.id, newService);
            });

            // Add to parent
            paramEntry.appendChild(paramName);
            paramEntry.appendChild(paramType);
            paramEntry.appendChild(removeButton);
            paramsInput.appendChild(paramEntry);
        });
        paramsInput.appendChild(addParameterButton);

        return paramsInput;
    }

    // Set up the click event for the label
    const label = document.getElementById('service-view-label');
    label.addEventListener('click', toggleServiceView);

    const content = document.getElementById('service-view-groups');

    // Open / Close service view
    function toggleServiceView() {
        if (content.style.display === 'none' || !content.style.display) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    }

    // Get current values set for a service entry
    function getCurrentServiceValues(entry, service){
        const currentName = entry.querySelector('.name-input').value;
        const currentType = entry.querySelector('.type-input').value;
        const currentUri = entry.querySelector('.uri-input').value;

        const result = entry.querySelector('.result-group');
        const currentResultName = result.querySelector('.result-name-input').value;
        const currentResultType = result.querySelector('.type-input').value;

        const parameters = [];
        const parameterGroup = entry.querySelector('.parameters-group');
        const parameterEntries = parameterGroup.querySelectorAll('.param-entry');
        parameterEntries.forEach(parameterGroup => {
            parameters.push({
                name: parameterGroup.querySelector('.parameter-name-input').value,
                type: parameterGroup.querySelector('.type-input').value
            });
        });

        // return service
        return {
            type: currentType,
            uri: currentUri,
            name: currentName,
            result: {name: currentResultName, type: currentResultType},
            parameters: parameters,
            id: service.id
        }
    }

    // Function to update the XML model with the current services
    function updateModel(element, serviceId, newService) {
        // Remove old entry
        const service = getRelevantServiceProperty(element, serviceId);
        removeFactory(commandStack, element, service);

        // Add new entry
        addFactory(element, bpmnFactory, commandStack, newService);
    }

    // Initial setup
    function initialize() {

        // Listen for the import.done event
        eventBus.on('import.done', (event) => {
            // Get some element
            const firstElement = elementRegistry.getAll()[0];
            // Get root from there (Process / Collaboration)
            const root = getRootElement(firstElement);
            // Get bpmn:Definitions
            const def = root.$parent;

            // Create entries in the service view for initial services (in bpmn:Definitions)
            const services = getServices(def) || [];
            services.forEach((service) => {
                const newEntry = {
                    type: service.type,
                    uri: service.uri,
                    name: service.name,
                    result: service.result,
                    parameters: service.parameters,
                    id: service.id}
                createServiceEntry(def, newEntry);
            });
        });
    }
    // Call the initialize function
    initialize();
}

ServiceView.$inject = ['elementRegistry', 'injector', 'eventBus'];