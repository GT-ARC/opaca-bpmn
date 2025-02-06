// Import our custom list group entries.
import payloadsList from './payloads/Payloads';

// Import the properties panel list group component.
import {ListGroup} from '@bpmn-io/properties-panel';

import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import {find} from "min-dash";
import {isAny} from "bpmn-js/lib/features/modeling/util/ModelingUtil";

const LOW_PRIORITY = 500;


/**
 * A provider with a `#getGroups(element)` method
 * that exposes groups for a diagram element.
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} translate
 */
export default function PayloadsListProvider(propertiesPanel, injector, translate) {

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

            // Add to existing group (message)
            groups.forEach(group => {
                if(group.id === 'message'){

                    // Payload is needed in ReceiveTasks and MessageCatchEvents
                    if (is(element, 'bpmn:ReceiveTask') || isMessageCatchEvent(element)) {
                        console.log('group entries', group.entries);
                        // Push to existing entries
                        group.entries.push(createPayloadsGroup(element, injector, translate));
                    }
                }
            })

            return groups;
        };
    };


    // registration ////////

    // Register our custom payloads list provider.
    // Use a lower priority to ensure it is loaded after
    // the basic BPMN properties.
    propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

PayloadsListProvider.$inject = [ 'propertiesPanel', 'injector', 'translate' ];

// Create the custom payloads list group.
function createPayloadsGroup(element, injector, translate) {

    // Return a group called "payloads".
    return {
        id: 'payloads',
        label: translate('Payloads'),
        component: ListGroup,
        ...payloadsList({ element, injector })
    };
}

// Helper
function isMessageCatchEvent(element) {
    if(!isAny(element, ['bpmn:StartEvent', 'bpmn:BoundaryEvent', 'bpmn:IntermediateCatchEvent'])){
        return false;
    }
    const businessObject = getBusinessObject(element);
    const eventDefinitions = businessObject.get('eventDefinitions') || [];

    return find(eventDefinitions, ed => is(ed, 'bpmn:MessageEventDefinition'));
}
