// Import your custom list group entries.
import parametersProps from './parts/Assignments';

// Import the properties panel list group component.
import { ListGroup } from '@bpmn-io/properties-panel';

import { is } from 'bpmn-js/lib/util/ModelUtil';

const LOW_PRIORITY = 500;


/**
 * A provider with a `#getGroups(element)` method
 * that exposes groups for a diagram element.
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} translate
 */
export default function AssignmentsListProvider(propertiesPanel, injector, translate) {

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

            const validElementTypes = ['bpmn:BaseElement', 'bpmn:StartEvent'];

            if (validElementTypes.some(type => is(element, type))) {
                groups.push(createParametersGroup(element, injector, translate));
            }

            return groups;
        };
    };


    // registration ////////

    // Register our custom extra properties provider.
    // Use a lower priority to ensure it is loaded after
    // the basic BPMN properties.
    propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

AssignmentsListProvider.$inject = [ 'propertiesPanel', 'injector', 'translate' ];

// Create the custom parameters list group.
function createParametersGroup(element, injector, translate) {

    // Create a group called "parameters".
    const parametersGroup = {
        id: 'assignments',
        label: translate('Assignments'),
        component: ListGroup,
        ...parametersProps({ element, injector })
    };

    return parametersGroup;
}