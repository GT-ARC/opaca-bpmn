// Import custom property entries.
// The entry is a text input field with logic attached to create,
// update and delete the "extra" property.
import extraProps from './parts/ExtraProps';

import { is } from 'bpmn-js/lib/util/ModelUtil';

const LOW_PRIORITY = 500;


/**
 * A provider with a `#getGroups(element)` method
 * that exposes groups for a diagram element.
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} translate
 */
export default function AdditionalPropertiesProvider(propertiesPanel, translate) {

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

            // Add the "extra" group
            if (is(element, 'bpmn:StartEvent')) {
                groups.push(createAdditionalGroup(element, translate));
            }

            return groups;
        };
    };


    // registration ////////

    // Register the custom propertiesProvider.
    // Use a lower priority to ensure it is loaded after
    // the basic BPMN properties.
    propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

AdditionalPropertiesProvider.$inject = [ 'propertiesPanel', 'translate' ];

// Create the custom group
function createAdditionalGroup(element, translate) {

    // create a group called "Extra properties".
    const additionalGroup = {
        id: 'extra',
        label: translate('Extra properties'),
        entries: extraProps(element),
        tooltip: translate('Show a hint here!')
    };

    return additionalGroup;
}