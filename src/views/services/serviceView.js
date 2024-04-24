import {addFactory, removeFactory} from "./Services";
import {getRootElement, nextId} from "../../provider/util";
import {getDataTypes} from "../../provider/variables/util";
import {getRelevantServiceProperty, getServices, } from "./util"

export default function ServiceView(elementRegistry, injector, eventBus) {
    const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

    const addServiceButton = document.getElementById('addServiceButton');
    addServiceButton.addEventListener('click', createNewService);

    const loadServicesButton = document.getElementById('loadServiceButton');
    loadServicesButton.addEventListener('click', loadRunningServices);

    // Create new empty service
    function createNewService() {
        const newService = { type: '', uri: '', method:'', name: '', result: {name: '', type: ''}, parameters: [], id: nextId('service_') };
        createService(newService);
    }

    // Load all OPACA Actions from Runtime Platform
    async function loadRunningServices() {
        // Ask the user for the location, with a default value of 'http://localhost:8000/agents'
        const location = prompt('Load services from:', 'http://localhost:8000/agents');

        // If the user cancels the prompt, exit the function
        if (location === null) {
            return;
        }

        try {
            const response = await fetch(location);
            if (!response.ok) {
                throw new Error(`Failed to load Services: ${response.statusText}`);
            }

            const result = await response.json();
            for (const agent of result) {
                for (const action of agent["actions"]) {
                    const newService = {
                        type: 'OPACA Action',
                        uri: location,
                        method: 'POST',
                        name: action["name"],
                        result: {name: 'result', type: action["result"] != null ? action["result"]["type"] : "void"},
                        parameters: Object.entries(action["parameters"]).map(e => ({"name": e[0], "type": e[1]["type"]})),
                        id: nextId('service_')
                    };
                    createService(newService);
                }
            }
        } catch (error) {
            alert(`Error loading services: ${error.message}`);
        }
    }

    // add service to model and create widgets
    function createService(service) {
        // Get root of diagram
        const firstElement = elementRegistry.getAll()[0];
        const root = getRootElement(firstElement);

        // Get bpmn:Definitions (where we want to define services)
        const element = root.$parent;

        // Get existing services or default to an empty array
        const existingServices = getServices(element) || [];

        // Check if a service with the same name already exists
        const existingService = existingServices.find(existing => existing.name === service.name);
        if (existingService) {
            // Service with the same name already exists, do not add it again
            console.warn('Service with name', service.name, 'already exists.');
            return;
        }

        addFactory(element, bpmnFactory, commandStack, service);

        // Create a new service entry in service view
        createServiceEntry(element, service);
    }

    // Function to create a service entry
    function createServiceEntry(element, service) {
        // Container for new entry
        const entry = document.createElement('div');
        entry.className = 'service-entry';

        // Input Fields
        const typeInput = createDropdown(element, entry, 'Service-type', service, ['OPACA Action', 'REST Service', 'BPMN Process'], service.type);
        const uriInput = createInput(element, entry, 'URI', service, service.uri);
        const methodInput = createDropdown(element, entry, 'Method-type', service, ['GET', 'POST', 'PUT', 'DELETE'], service.method);
        const nameInput = createInput(element, entry, 'Name', service, service.name);

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
        entry.appendChild(methodInput);
        entry.appendChild(nameInput);
        entry.appendChild(resultInput);
        entry.appendChild(parametersInput);
        entry.appendChild(removeButton);
        content.appendChild(entry);

        // Select the correct result type in the dropdown
        resultInput.querySelector('.result-type').value = service.result.type;

        // Select the correct parameter types in the dropdowns
        const parameterEntries = parametersInput.querySelectorAll('.param-entry');
        parameterEntries.forEach((parameterEntry, index) => {
            parameterEntry.querySelector('.parameter-type').value = service.parameters[index].type;
        });
    }


    // Function to create an element for URI / name input
    function createInput(element, entry, placeholder, service, initial_value) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;

        input.value = initial_value;

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
    function createDropdown(element, entry, placeholder, service, options, initial_value) {
        const dropdown = document.createElement('select');
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = placeholder;
        defaultOption.disabled = true;
        dropdown.add(defaultOption);

        dropdown.classList.add(`${placeholder.toLowerCase()}`);

        // Combine all types including the initial value's type
        const allTypes = Array.from(new Set([initial_value, ...options]));

        dropdown.value = initial_value;

        // Add options to pick from
        allTypes.forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.text = option;
            dropdown.add(optionElement);
        });

        // Add a custom option
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.text = 'Custom';
        dropdown.add(customOption);

        // Add event listener to handle custom selection
        dropdown.addEventListener('change', (event) => {
            if (dropdown.value === 'OPACA Action') {
                // Set default URI
                const uriInput = entry.querySelector('.uri-input');
                uriInput.value = 'http://localhost:8000';
                // Set default method
                const methodType = entry.querySelector('.method-type');
                methodType.value = 'POST';
            } else if (dropdown.value === 'Custom') {
                const customValue = prompt('Enter custom value:');
                if (customValue !== null) {
                    // Add the custom value as a new option
                    const customOption = document.createElement('option');
                    customOption.value = customValue;
                    customOption.text = customValue;
                    dropdown.add(customOption);
                    dropdown.value = customValue;
                } else {
                    // Reset to the previous value if user cancels
                    dropdown.value = initial_value;
                }
            } else {
                // Normal option selected
                // Current inputs
                const newService = getCurrentServiceValues(entry, service);
                updateModel(element, service.id, newService);
            }
        });
        return dropdown;
    }

    function createResultGroup(element, entry, service){
        const resultInput = document.createElement('div');
        resultInput.classList.add('result-group');

        const resultName = createInput(element, entry, 'Result-name', service, service.result.name);

        // Basic types
        const predefinedTypes = ["int", "long", "double", "float", "boolean", "char", "String", "Custom"];
        // Add custom types
        const allTypes = [].concat(getDataTypes(), predefinedTypes);

        const resultType = createDropdown(element, entry, 'result-type', service, allTypes, service.result.type);

        resultInput.appendChild(resultName);
        resultInput.appendChild(resultType);

        return resultInput;
    }

    function createParametersGroup(element, entry, service){
        const paramsGroup = document.createElement('div');
        paramsGroup.classList.add('parameters-group');

        // Add initial parameters
        service.parameters.forEach(parameter => {
            const paramEntry = createParameterEntry(element, entry, service, paramsGroup, parameter);
            paramsGroup.appendChild(paramEntry);
        });

        const addParameterButton = document.createElement('button');
        addParameterButton.innerHTML = '+';
        addParameterButton.classList.add('createEntry');
        addParameterButton.title = 'Add parameter';
        addParameterButton.addEventListener('click', () => {
            // Add entry on click
            const paramEntry = createParameterEntry(element, entry, service, paramsGroup, {name: '', type: ''});
            paramsGroup.appendChild(paramEntry);
        });
        paramsGroup.appendChild(addParameterButton);

        return paramsGroup;
    }

    function createParameterEntry(element, entry, service, paramsGroup, initial_param){
        const paramEntry = document.createElement('div');
        paramEntry.classList.add('param-entry');

        // Create input for parameter name
        const paramName = createInput(element, entry, 'Parameter-name', service, initial_param.name);

        // Basic types
        const predefinedTypes = ["int", "long", "double", "float", "boolean", "char", "String", "Custom"];
        // Add custom types
        const allTypes = [].concat(getDataTypes(), predefinedTypes);
        // Create dropdown for parameter type
        const paramType = createDropdown(element, entry, 'parameter-type', service, allTypes, initial_param.type);

        // Button for removing a parameter
        const removeButton = document.createElement('button');
        removeButton.innerHTML = 'x';
        removeButton.addEventListener('click', () => {
            // Remove the entry from the DOM
            paramsGroup.removeChild(paramEntry);

            // Update the XML
            const newService = getCurrentServiceValues(entry, service);
            updateModel(element, service.id, newService);
        });

        // Add to parent
        paramEntry.appendChild(paramName);
        paramEntry.appendChild(paramType);
        paramEntry.appendChild(removeButton);

        return paramEntry;
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
        const currentType = entry.querySelector('.service-type').value;
        const currentUri = entry.querySelector('.uri-input').value;
        const currentMethod = entry.querySelector('.method-type').value;

        const result = entry.querySelector('.result-group');
        const currentResultName = result.querySelector('.result-name-input').value;
        const currentResultType = result.querySelector('.result-type').value;

        const parameters = [];
        const parameterGroup = entry.querySelector('.parameters-group');
        const parameterEntries = parameterGroup.querySelectorAll('.param-entry');
        parameterEntries.forEach(parameterGroup => {
            parameters.push({
                name: parameterGroup.querySelector('.parameter-name-input').value,
                type: parameterGroup.querySelector('.parameter-type').value
            });
        });

        // return service
        return {
            type: currentType,
            uri: currentUri,
            method: currentMethod,
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
                    method: service.method,
                    name: service.name,
                    result: service.result || {name : '', type: ''},
                    parameters: service.parameters || [],
                    id: service.id}
                createServiceEntry(def, newEntry);
            });
        });
    }
    // Call the initialize function
    initialize();
}

ServiceView.$inject = ['elementRegistry', 'injector', 'eventBus'];