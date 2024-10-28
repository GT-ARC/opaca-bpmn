import {ConditionProps} from './ConditionProps';
import {Group} from '@bpmn-io/properties-panel';
const LOW_PRIORITY = 500;

/**
 * A provider with a `#getGroups(element)` method
 * that exposes groups for a diagram element.
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} translate
 */
export default function ConditionPropsProvider(propertiesPanel, injector, translate) {

    /**
     * Return the groups provided for the given element.
     *
     * @param {DiagramElement} element
     *
     * @return {(Object[]) => (Object[])} groups middleware
     */
    this.getGroups = function(element) {

        //const groups = [];
        return function (groups){
            // (1) add only the ConditionGroup
            const conditionGroup = ConditionGroup(element, injector, translate);
            if (conditionGroup) {
                groups.push(conditionGroup);
            }
            return groups;
        }

    }
    propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

ConditionPropsProvider.$inject = [ 'propertiesPanel', 'injector', 'translate'];

function ConditionGroup(element, injector, translate) {
    //const translate = injector.get('translate');
    const group = {
        label: translate('Condition'),
        id: 'CamundaPlatform__Condition',
        component: Group,
        entries: [
            ...ConditionProps({ element })
        ]
    };

    if (group.entries.length) {
        return group;
    }

    return null;
}