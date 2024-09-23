import {addFactory, removeFactory} from "./Services";
import {addDatatype, getRootElement, nextId, getDataTypes} from "../../provider/util";
import {getRelevantServiceProperty, getServices, } from "./util";
import {fetchOpacaServices} from "../../opacaUtil";

export default function ServiceView(elementRegistry, injector, eventBus) {
    // For the model
    const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

    // Set up the click event for the toggleView Button inside the label
    const toggleViewButton = document.getElementById('toggle-service-view');
    toggleViewButton.addEventListener('click', toggleServiceView);

    const content = document.getElementById('service-view-groups');

    // Open / Close service view
    function toggleServiceView() {
        const arrowSvg = toggleViewButton.querySelector('svg');
        if (content.style.display === 'none' || !content.style.display) {
            if(content.childElementCount === 0){
                return; // Nothing to show
            }
            content.style.display = 'block';
            arrowSvg.classList.remove('bio-properties-panel-arrow-right');
            arrowSvg.classList.add('bio-properties-panel-arrow-down');
        } else {
            content.style.display = 'none';
            arrowSvg.classList.remove('bio-properties-panel-arrow-down');
            arrowSvg.classList.add('bio-properties-panel-arrow-right');
        }
    }

    // Set up the click event for adding a service
    const addServiceButton = document.getElementById('addServiceButton');
    addServiceButton.addEventListener('click', function (){
        createNewService();
        if(content.style.display !== 'block'){
            toggleServiceView();
        }
    });

    // Create or get group for services with the same URI
    function createServicesGroup(uri){
        // Return empty group for new services
        if(uri===''){
            const emptyGroup = document.createElement('div');
            emptyGroup.id = 'empty-services-group';
            return emptyGroup;
        }
        // Check if the group already exists
        const existingGroups = content.children;
        const foundGroup = Array.from(existingGroups).find(group => group.id === uri);
        if(foundGroup){
            return foundGroup;
        }

        // TODO play with classes, also unify class names
        // If not create it
        const servicesGroup = document.createElement('div');
        servicesGroup.id = uri;
        servicesGroup.className = 'services-group';
        // Group Header
        const servicesGroupHeader = document.createElement('div');
        servicesGroupHeader.className = 'view-header service-entry-header';
        // GroupLabel
        const servicesGroupLabel = document.createElement('span');
        servicesGroupLabel.innerHTML = uri;
        // Use Auth Checkbox
        const useAuthContainer = document.createElement('div');
        useAuthContainer.className = 'use-auth-container';
        const useAuthLabel = document.createElement('span');
        useAuthLabel.className = 'use-auth-label';
        useAuthLabel.innerHTML = 'Use Auth';
        const useAuthBox = document.createElement('input');
        useAuthBox.type = 'checkbox';
        useAuthBox.className = 'use-auth-checkbox view-button';
        useAuthBox.title = 'Login for authentication?';
        useAuthBox.id = `use-auth-${uri}`;

        useAuthBox.addEventListener('click', () => {
            if(useAuthBox.checked){
                loginContainer.style.display = 'block';
            }else{
                loginContainer.style.display = 'none';
            }
        })
        // Login
        const loginContainer = document.createElement('div');
        loginContainer.className = 'login-field collapsible-content';

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.id = 'username-' + uri;
        usernameInput.className = 'login-input-field';
        usernameInput.placeholder = 'admin';
        usernameInput.value = 'admin';
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.id = 'password-' + uri;
        passwordInput.className = 'login-input-field';
        passwordInput.placeholder = 'password';

        // Put together
        useAuthContainer.appendChild(useAuthLabel);
        useAuthContainer.appendChild(useAuthBox);

        loginContainer.appendChild(usernameInput);
        loginContainer.appendChild(passwordInput);

        servicesGroupHeader.appendChild(servicesGroupLabel);
        servicesGroupHeader.appendChild(useAuthContainer);

        servicesGroup.appendChild(servicesGroupHeader);
        servicesGroup.appendChild(loginContainer);

        content.appendChild(servicesGroup);

        return servicesGroup;
    }

    // Set up the click event for loading OPACA Actions
    const loadServicesButton = document.getElementById('load-services-button');
    loadServicesButton.addEventListener('click', loadRunningServices);

    // Create new empty service
    function createNewService() {
        const newService = { type: '', uri: '', method:'', name: '', result: {name: '', type: ''}, parameters: [], id: nextId('service_') };
        createService(newService);
    }

    // Load all OPACA Actions from Runtime Platform
    async function loadRunningServices() {
        // Show the dialog and wait for user input
        const location = await showLoadServicesDialog();

        // If the user cancels the dialog, formData will be null
        if (location === null) {
            return;
        }

        try {
            const result = await fetchOpacaServices(location);
            for (const agent of result) {

                if (agent.actions && agent.actions.length > 0) {

                    for (const action of agent["actions"]) {
                        const newService = {
                            type: 'OPACA Action',
                            uri: location.split('/agents', 1)[0],
                            method: 'POST',
                            name: `${agent.agentId}::${action["name"]}`,
                            result: {
                                name: 'result',
                                type: action["result"] != null ? action["result"]["type"] : "void"
                            },
                            parameters: Object.entries(action["parameters"]).map(e => ({
                                "name": e[0],
                                "type": e[1]["type"]
                            })),
                            id: nextId('service_')
                        };
                        createService(newService);
                    }
                }
            }
        } catch (error) {
            alert(error.message);
        }
    }

    function showLoadServicesDialog(){
        return new Promise((resolve) => {
            const dialog = document.getElementById('load-services-dialog');
            const form = document.getElementById('load-services-form');
            const cancelButton = document.getElementById('cancel-load-services');
            const locationInput = document.getElementById('load-services-location');

            // Show the dialog
            dialog.showModal();

            // Handle form submission
            form.addEventListener('submit', () => {
                // Gather the form data and resolve the Promise
                const location = locationInput.value
                dialog.close();
                resolve(location);
            }, { once: true });

            // Handle cancel button click
            cancelButton.addEventListener('click', () => {
                dialog.close();
                resolve(null);
            }, { once: true });
        });
    }

    // add service to model and create widgets
    function createService(service) {
        // Get root of diagram
        const firstElement = elementRegistry.getAll()[0];
        const root = getRootElement(firstElement);

        // (TODO): Maybe element should be RootImpl, its bO would then be a process/collaboration
        // Get bpmn:Definitions (where we want to define services)
        const element = root.$parent;

        // Get existing services or default to an empty array
        const existingServices = getServices(element) || [];

        // Check if a service with the same name already exists
        const existingService = existingServices.find(existing => existing.name === service.name);
        if (existingService) {
            // Service with the same name already exists, do not add it again
            console.warn('Service with name ', service.name, ' already exists.');
            return false;
        }

        addFactory(element, bpmnFactory, commandStack, service);

        // Create a new service entry in service view
        createServiceEntry(element, service);
        return true;
    }

    // Function to create a service entry
    function createServiceEntry(element, service) {
        // Container for new entry
        const entry = document.createElement('div');
        entry.className = 'service-entry';

        // Create label for displaying the name (always visible)
        const serviceEntryHeader = document.createElement('div');
        serviceEntryHeader.className = 'service-entry-header';

        // Button for opening/closing the service
        const collapseButton = document.createElement('button');
        collapseButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="bio-properties-panel-arrow-right">
                            <path fill-rule="evenodd" d="m11.657 8-4.95 4.95a1 1 0 0 1-1.414-1.414L8.828 8 5.293 4.464A1 1 0 1 1 6.707 3.05L11.657 8Z"></path>
                        </svg>`;
        collapseButton.className = 'view-button collapse-service-button bio-properties-panel-collapsible-entry-arrow';
        collapseButton.addEventListener('click', toggleServiceEntry);

        // Span for the service name (this will update, but buttons remain)
        const serviceNameSpan = document.createElement('span');
        serviceNameSpan.textContent = service.name ? service.name : 'New Service';
        serviceNameSpan.className = 'service-label';

        // Button for removing a service
        const removeButton = document.createElement('button');
        removeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                <path fill-rule="evenodd" d="M12 6v7c0 1.1-.4 1.55-1.5 1.55h-5C4.4 14.55 4 14.1 4 13V6h8Zm-1.5 1.5h-5v4.3c0 .66.5 1.2 1.111 1.2H9.39c.611 0 1.111-.54 1.111-1.2V7.5ZM13 3h-2l-1-1H6L5 3H3v1.5h10V3Z"></path>
              </svg>`;
        removeButton.title = 'Delete service';
        removeButton.className = 'bio-properties-panel-remove-entry remove-item-button';
        removeButton.addEventListener('click', () => {
            // Get property by id
            const serviceToRemove = getRelevantServiceProperty(element, service.id);
            // Remove property from XML
            removeFactory(commandStack, element, serviceToRemove);
            // Remove the entry from the DOM
            const parentGroup = entry.parentElement;
            entry.remove();
            // If no more entry in group, remove it as well
            // < 3, because it always contains a header and login field
            if((parentGroup.id === 'empty-services-group' && parentGroup.childElementCount < 1) || parentGroup.childElementCount < 3){
                parentGroup.remove();
            }
            // If no groups are left, close service view
            if(content.childElementCount === 0){
                toggleServiceView();
            }
        });

        // Put together the label (collapse button, service name, remove button)
        serviceEntryHeader.appendChild(collapseButton);
        serviceEntryHeader.appendChild(serviceNameSpan);
        serviceEntryHeader.appendChild(removeButton);

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'input-wrapper collapsible-content';
        if (!service.name) {
            toggleServiceEntry();  // If it's a new service, expand it
        }

        // Input Fields
        const typeInput = createDropdown(element, entry, 'Service-type', service, ['OPACA Action', 'REST Service', 'BPMN Process'], service.type);
        const uriInput = createInput(element, entry, 'URI', service, service.uri);
        const methodInput = createDropdown(element, entry, 'Method-type', service, ['GET', 'POST', 'PUT', 'DELETE'], service.method);
        const nameInput = createInput(element, entry, 'Name', service, service.name);
        const resultInput = createResultGroup(element, entry, service);
        const parametersInput = createParametersGroup(element, entry, service);

        // When the service name input changes, update only the service name span
        nameInput.addEventListener('input', () => {
            serviceNameSpan.textContent = nameInput.value;
        });

        uriInput.addEventListener('blur', handleUriChange);
        typeInput.addEventListener('change', handleUriChange);

        function handleUriChange(){
            const previousGroup = entry.parentElement;

            const changeGroup = createServicesGroup(uriInput.value);
            changeGroup.appendChild(entry);

            // If old group is now empty, remove it.
            // < 3, because it always contains a header and login field
            if((previousGroup.id === 'empty-services-group' && previousGroup.childElementCount < 1) || previousGroup.childElementCount < 3){
                previousGroup.remove();
            }
        }

        // Build the input wrapper
        inputWrapper.appendChild(nameInput);
        inputWrapper.appendChild(typeInput);
        inputWrapper.appendChild(uriInput);
        inputWrapper.appendChild(methodInput);
        inputWrapper.appendChild(resultInput);
        inputWrapper.appendChild(parametersInput);

        // Add everything to the entry
        entry.appendChild(serviceEntryHeader);
        entry.appendChild(inputWrapper);

        // Add new entry to the top of the list
        const findGroup = createServicesGroup(service.uri);
        findGroup.appendChild(entry);
        content.insertBefore(findGroup, content.firstChild);

        // Select the correct result type in the dropdown
        resultInput.querySelector('.result-type').value = service.result.type;

        // Select the correct parameter types in the dropdowns
        const parameterEntries = parametersInput.querySelectorAll('.param-entry');
        parameterEntries.forEach((parameterEntry, index) => {
            parameterEntry.querySelector('.parameter-type').value = service.parameters[index].type;
        });

        // Function to toggle the collapse/expand of the service entry
        function toggleServiceEntry() {
            const computedStyle = window.getComputedStyle(inputWrapper);
            if (computedStyle.display === 'none' || !computedStyle.display) {
                inputWrapper.style.display = 'block';
                collapseButton.classList.remove('bio-properties-panel-arrow-right');
                collapseButton.classList.add('bio-properties-panel-arrow-down');
                collapseButton.title = 'Close';
            } else {
                inputWrapper.style.display = 'none';
                collapseButton.classList.remove('bio-properties-panel-arrow-down');
                collapseButton.classList.add('bio-properties-panel-arrow-right');
                collapseButton.title = 'Open';
            }
        }
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
        const allTypes = Array.from(new Set([initial_value, ...options].filter(Boolean)));

        dropdown.value = initial_value;

        // Add options to pick from
        allTypes.forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.text = option;
            dropdown.add(optionElement);
        });

        if(placeholder === 'result-type' || placeholder === 'parameter-type'){
            // Add a custom option
            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.text = 'Custom';
            dropdown.add(customOption);
        }

        // Add event listener to handle custom selection
        dropdown.addEventListener('change', (event) => {
            if (dropdown.value === 'OPACA Action') {
                // Set default URI
                const uriInput = entry.querySelector('.uri-input');
                uriInput.value = 'http://localhost:8000';
                // Set default method
                const methodType = entry.querySelector('.method-type');
                methodType.value = 'POST';
            } else if (dropdown.value === 'custom') {
                const customValue = prompt('Enter custom value:');
                if (customValue !== null) {
                    // Add the custom value as a new option (to existing dropdowns)
                    const allDropDowns = document.querySelectorAll('select.result-type, select.parameter-type');
                    allDropDowns.forEach(dd => {
                        const customOption = document.createElement('option');
                        customOption.value = customValue;
                        customOption.text = customValue;
                        dd.add(customOption);
                    });
                    // Also add it for future variables
                    addDatatype(customValue);

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
        // Header for label
        const resultHeader = document.createElement('div');
        resultHeader.id = 'entry-group-header';
        // Label
        const resultLabel = document.createElement('span');
        resultLabel.innerHTML = 'Result';
        // Input
        const resultInput = document.createElement('div');
        resultInput.classList.add('result-group');

        const resultName = createInput(element, entry, 'Result-name', service, service.result.name);

        // Basic types
        const predefinedTypes = ["integer", "number", "boolean", "string", "array", "object"];
        // Add custom types
        const allTypes = [].concat(getDataTypes(), predefinedTypes);

        const resultType = createDropdown(element, entry, 'result-type', service, allTypes, service.result.type);

        resultHeader.appendChild(resultLabel);

        resultInput.appendChild(resultHeader);
        resultInput.appendChild(resultName);
        resultInput.appendChild(resultType);

        return resultInput;
    }

    function createParametersGroup(element, entry, service){
        const paramsGroup = document.createElement('div');
        paramsGroup.classList.add('parameters-group');

        // Header for label and add button
        const paramsHeader = document.createElement('div');
        paramsHeader.id = 'entry-group-header';
        // Label
        const paramsLabel = document.createElement('span');
        paramsLabel.innerHTML = 'Parameters';

        const addParameterButton = document.createElement('button');
        addParameterButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                            <path fill-rule="evenodd" d="M9 13V9h4a1 1 0 0 0 0-2H9V3a1 1 0 1 0-2 0v4H3a1 1 0 1 0 0 2h4v4a1 1 0 0 0 2 0Z"></path>
                        </svg>`
        addParameterButton.className = 'add-item-button view-button bio-properties-panel-add-entry';
        addParameterButton.title = 'Add parameter';
        addParameterButton.addEventListener('click', () => {
            // Add entry on click
            const paramEntry = createParameterEntry(element, entry, service, paramsGroup, {name: '', type: ''});
            paramsGroup.appendChild(paramEntry);
        });
        // Put together header
        paramsHeader.appendChild(paramsLabel);
        paramsHeader.appendChild(addParameterButton);
        // Add header to group
        paramsGroup.appendChild(paramsHeader);

        // Add initial parameters
        service.parameters.forEach(parameter => {
            const paramEntry = createParameterEntry(element, entry, service, paramsGroup, parameter);
            paramsGroup.appendChild(paramEntry);
        });

        return paramsGroup;
    }

    function createParameterEntry(element, entry, service, paramsGroup, initial_param){
        const paramEntry = document.createElement('div');
        paramEntry.classList.add('param-entry');

        // Create input for parameter name
        const paramName = createInput(element, entry, 'Parameter-name', service, initial_param.name);

        // Basic types
        const predefinedTypes = ["integer", "number", "boolean", "string", "array", "object"];
        // Add custom types
        const allTypes = [].concat(getDataTypes(), predefinedTypes);
        // Create dropdown for parameter type
        const paramType = createDropdown(element, entry, 'parameter-type', service, allTypes, initial_param.type);

        // Button for removing a parameter
        const removeButton = document.createElement('button');
        removeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                <path fill-rule="evenodd" d="M12 6v7c0 1.1-.4 1.55-1.5 1.55h-5C4.4 14.55 4 14.1 4 13V6h8Zm-1.5 1.5h-5v4.3c0 .66.5 1.2 1.111 1.2H9.39c.611 0 1.111-.54 1.111-1.2V7.5ZM13 3h-2l-1-1H6L5 3H3v1.5h10V3Z"></path>
              </svg>`;
        removeButton.title = 'Delete parameter';
        //removeButton.type = 'button';
        removeButton.className = 'bio-properties-panel-remove-entry remove-item-button';
        removeButton.addEventListener('click', () => {
            // Remove the entry from the DOM
            paramEntry.remove();

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

            // Remove existing entries
            content.replaceChildren();

            // Create entries in the service view for initial/copied services (in bpmn:Definitions)
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