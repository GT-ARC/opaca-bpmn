// Import serviceImplementation property
import serviceImplementation from './ServiceImplementation';

import { is } from 'bpmn-js/lib/util/ModelUtil';

const LOW_PRIORITY = 500;


/**
 * A provider with a `#getGroups(element)` method
 * that exposes groups for a diagram element.
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} translate
 */
export default function ServiceImplProvider(propertiesPanel, injector, translate) {

    // API ////////

    /**
     * Return the groups provided for the given element.
     *
     * @param {DiagramElement} element
     *
     * @return {(Object[]) => (Object[])} groups middleware
     */
    this.getGroups = function(element) {

        /**
         * We return a middleware that modifies
         * the existing groups.
         *
         * @param {Object[]} groups
         *
         * @return {Object[]} modified groups
         */
        return function(groups) {

            // Add the "ServiceImplementation" group
            if (is(element, 'bpmn:ServiceTask')) {
                groups.push(createServiceImplGroup(element, injector, translate));
            }

            return groups;
        };
    };


    // registration ////////

    // Register custom service provider.
    // Use a lower priority to ensure it is loaded after
    // the basic BPMN properties.
    propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

ServiceImplProvider.$inject = [ 'propertiesPanel', 'injector', 'translate' ];

// Create the "ServiceImplementation" group
function createServiceImplGroup(element, injector, translate) {

    // Return group
    return {
        id: 'serviceImplementation',
        label: translate('Service Implementation'),
        entries: serviceImplementation(element, injector)
    };
}