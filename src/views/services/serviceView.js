import {addFactory, getRelevantServiceProperty, getServices, removeFactory} from "./helper";
import {getRootElement, nextId} from "../../provider/util";

export default function ServiceView(elementRegistry, injector, eventBus) {
    var container = document.getElementById('service-view');

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

        const newService = { type: '', uri: '', name: '', id: nextId('service_') };

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
        const typeInput = createDropdown(element, entry, '', service, ['OPACA', 'REST', 'BPMN Process'], (value) => {
            service.type = value;
        });
        const uriInput = createInput(element, entry, 'text', 'URI', service);
        const nameInput = createInput(element, entry, 'text', 'Name', service);

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
        entry.appendChild(removeButton);
        content.appendChild(entry);
    }

    // Function to create an input element
    function createInput(element, entry, type, placeholder, service) {
        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;

        if(placeholder==='URI'){
            input.value = service.uri || '';
        }else{
            input.value = service.name || '';
        }

        // Add class to the input element based on the placeholder
        input.classList.add(`${placeholder.toLowerCase()}-input`);

        // Add event listener to update the model on blur
        input.addEventListener('change', () => {
            // Get current inputs
            const currentName = entry.querySelector('.name-input').value;
            const currentType = entry.querySelector('.type-input').value;
            const currentUri = entry.querySelector('.uri-input').value;

            if(placeholder==='URI'){
                updateModel(element, service.id, {
                    type: currentType,
                    uri: input.value,
                    name: currentName,
                    id: service.id
                });
            }else{
                updateModel(element, service.id, {
                    type: currentType,
                    uri: currentUri,
                    name: input.value,
                    id: service.id
                });
            }
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

        dropdown.value = service.type || '';

        // Add event listener to update the model when selection changes
        dropdown.addEventListener('change', (event) => {
            // Current inputs
            const currentName = entry.querySelector('.name-input').value;
            const currentUri = entry.querySelector('.uri-input').value;
            updateModel(element, service.id, {
                type: dropdown.value,
                uri: currentUri,
                name: currentName,
                id: service.id
            });
        });
        return dropdown;
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

            // Create entries in the service view for initial services
            const services = getServices(def) || [];
            services.forEach((service) => {
                const newEntry = {type: service.type, uri: service.uri, name: service.name, id: service.id}
                createServiceEntry(def, newEntry);
            });
        });
    }
    // Call the initialize function
    initialize();
}

ServiceView.$inject = ['elementRegistry', 'injector', 'eventBus'];