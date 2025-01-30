import {is} from "bpmn-js/lib/util/ModelUtil";
import {evaluateCondition} from "../util";

export function handleConditionalEvents(outgoingEvents, scope, simulationSupport){
    console.log('Outgoing events:', outgoingEvents);

    outgoingEvents.forEach(event => {
        const id = event.businessObject.id;
        // Elements like ReceiveTask have no EventDefinitions
        if(!event.businessObject.eventDefinitions){
            return;
        }
        const condition = event.businessObject.eventDefinitions.find(ed => is(ed, 'bpmn:ConditionalEventDefinition'));

        // If event is a conditional event
        if(condition){
            setTimeout(() => { // small delay for element triggers to be ready
                //console.log('Found condition', condition);

                const conditionExpression = condition.condition.body;

                // If condition is true, trigger event
                if(evaluateCondition(conditionExpression, scope)){
                    simulationSupport.triggerElement(id);

                // Else wait for variable updates
                }else{
                    // Alternatively use
                    //eventBus.on('variableUpdate', (event) => {
                    document.addEventListener('logAssignment', (log) => {
                        // Optionally, we could also filter the updates for the relevant variable

                        // Evaluate condition again
                        if(evaluateCondition(conditionExpression, scope)){
                            simulationSupport.triggerElement(id);
                        }
                    });
                }
            }, 10);
        }
    })
}
