import UserTaskType from './UserTaskType';
import UserTaskMessage from './UserTaskMessage';
import targetsList from './targets/Targets';
import { ListGroup } from '@bpmn-io/properties-panel';
import { is } from 'bpmn-js/lib/util/ModelUtil';

const LOW_PRIORITY = 500;


/**
 * A provider with a `#getGroups(element)` method
 * that exposes groups for a diagram element.
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} injector
 * @param {Function} translate
 */
export default function UserTaskInfoProvider(propertiesPanel, injector, translate) {

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

            // Add the "UserTaskInfo" group
            if (is(element, 'bpmn:UserTask')) {
                groups.push(createUserTaskInfoGroup(element, injector, translate));
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

UserTaskInfoProvider.$inject = [ 'propertiesPanel', 'injector', 'translate' ];

// Create the "UserTaskInfo" group
function createUserTaskInfoGroup(element, injector, translate) {

    const userTaskTypeEntry = UserTaskType(element);
    const userTaskMessageEntry = UserTaskMessage(element);

    const entries = [...userTaskTypeEntry, ...userTaskMessageEntry];

    if(element.businessObject.type === 'input'){
        // Generate the Targets list component
        const targetsGroup = {
            id: 'targets',
            label: translate('Targets'),
            component: ListGroup,
            ...targetsList({ element, injector })
        };
        entries.push(targetsGroup);
    }

    // Return group
    return {
        id: 'userTaskInformation',
        label: translate('UserTask Information'),
        entries: entries
    };
}