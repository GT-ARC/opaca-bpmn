import {addFactory, getRelevantServiceProperty, removeFactory} from "./helper";

export default function ServiceView(elementRegistry, injector, translate, eventBus) {
    var container = document.getElementById('service-view');

    const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

    const addServiceButton = document.getElementById('addServiceButton');
    addServiceButton.addEventListener('click', createNewService);

    // Create new empty service
    function createNewService() {
        // Assume process element ID is 'Process_1' for now
        const element = elementRegistry.get('Process_1');

        const newService = { type: '', uri: '', name: '' };

        console.log(newService);
        //services.push(newService);
        addFactory(element, bpmnFactory, commandStack, newService);

        // Create a new service entry
        createServiceEntry(element, newService);
    }

    // Function to create a service entry
    function createServiceEntry(element, service) {
        // Container for new entry
        const entry = document.createElement('div');
        entry.className = 'service-entry';

        // Input Fields
        const typeInput = createDropdown(element, service, '', service.type, ['OPACA', 'REST', 'BPMN Process'], (value) => {
            service.type = value;
        });
        const uriInput = createInput(element, service, 'text', 'URI', service.uri);
        const nameInput = createInput(element, service, 'text', 'Name', service.name);

        // Button for removing entry
        const removeButton = document.createElement('button');
        removeButton.innerHTML = 'x';
        removeButton.addEventListener('click', () => {
            // Remove the group from the DOM
            content.removeChild(entry);
            // Remove property from XML
            const serviceToRemove = getRelevantServiceProperty(service.name);
            removeFactory(commandStack, element, serviceToRemove);
        });

        // Add entry to the content
        entry.appendChild(typeInput);
        entry.appendChild(uriInput);
        entry.appendChild(nameInput);
        entry.appendChild(removeButton);
        content.appendChild(entry);
    }

    // Function to create an input element
    function createInput(element, service, type, placeholder, value) {
        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;
        input.value = value || ''; // Set default value

        // Add event listener to update the model on blur
        input.addEventListener('blur', () => {
            //TODO
            if(placeholder==='URI'){
                updateModel(element, service, {
                    type: service.type,
                    uri: input.value,
                    name: service.name
                });
            }else{
                updateModel(element, service, {
                    type: service.type,
                    uri: service.uri,
                    name: input.value
                });
            }
        });

        return input;
    }

    // Function to create a dropdown
    function createDropdown(element, service, placeholder, selectedValue, options) {
        const dropdown = document.createElement('select');
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = placeholder;
        dropdown.add(defaultOption);

        options.forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.text = option;
            dropdown.add(optionElement);
        });

        dropdown.value = selectedValue || ''; // Set default value

        // Add event listener to update the model when selection changes
        dropdown.addEventListener('change', (event) => {
            // TODO
            updateModel(element, service, {
                type: dropdown.value,
                uri: service.uri,
                name: service.name
            });
        });

        return dropdown;
    }

    /*
    // Listen for 'element.changed' event
    eventBus.on('element.changed', function(event) {
        const element = event.element;

        // Check if the changed element is the one you are interested in
        if (element && element.id === 'Process_1') {
            updateView(element);
        }
    });
     */

    // Set up the click event for the label
    const label = document.getElementById('service-view-label');
    label.addEventListener('click', toggleServiceView);

    const content = document.getElementById('service-view-groups');

    function toggleServiceView() {
        if (content.style.display === 'none' || !content.style.display) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    }

    // Function to update the XML model with the current services
    function updateModel(element, oldService, newService) {
        // Remove old entry
        console.log('updateModel service', oldService);
        console.log('updateModel name', oldService.name);
        const service = getRelevantServiceProperty(element, oldService.name);
        removeFactory(commandStack, element, service);
        // Add new entry
        addFactory(element, bpmnFactory, commandStack, newService);
    }

    // Initial setup
    function initialize() {
        // Assume process element ID is 'Process_1' for illustration purposes
        /*
        const processElement = elementRegistry.get('Process_1');

        // Initialize services from the existing BPMN model
        // This could involve reading from the businessObject or other related structures
        // For simplicity, let's initialize with dummy data
        const services = [
            { type: 'OPACA', uri: 'http://service1', name: 'Service 1' },
        ];

        // Create service entries for the initial services
        services.forEach(processElement, createServiceEntry);

         */
    }

    // Call the initialize function
    initialize();
}

ServiceView.$inject = ['elementRegistry', 'injector', 'translate', 'eventBus'];