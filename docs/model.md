# BPMN Model Extensions

## ExtensionElements

In the BPMN 2.0 standard an element can be extended with the `<bpmn2:extensionsElements>` property to store additional information, like this:

```xml
<bpmn2:task id="Activity_1" name="example activity">
    <bpmn2:extensionElements>
        <vsdt2:assignments>
            <vsdt2:assignment variable="example variable" expression="4" assignTime="START" />
        </vsdt2:assignments>
    </bpmn2:extensionElements>
    <bpmn2:incoming>Flow_2</bpmn2:incoming>
    <bpmn2:outgoing>Flow_3</bpmn2:outgoing>
</bpmn2:task>
```

## Model Extensions

The additional attributes we need for interpretation are defined in the [`vsdt2.json`](../opaca-bpmn-editor/src/descriptors/vsdt2.json). This makes sure that when a diagram is loaded in the editor, the underlying model recognizes these contained attributes and we/the interpreter can work with them. They are saved in the `vsdt2` namespace. ('VSDT' is the name of an earlier, Eclipse based BPMN editor developed by DAI-Labor, see <https://www.jiac.de/development-tools/jiac-toolipse/> for details.)

The principal new model elements are:

* Variables and Assignments, to store temporary values
* Services Tasks' Implementations, to be called by the interpreter, referring to OPACA actions
* Information to be provided or asked for in User Tasks
* Payloads to be received from messages in MessageEvents

To actually be able to add these to the model in the editor, the needed input fields are provided to the bpmn-js-properties-panel in [`src/provider`](../opaca-bpmn-editor/src/provider). The properties panel should always represent the current model and changes are propagated immediately.  Our model extension is then passed to the modeler in the [`app.js`](../opaca-bpmn-editor/src/app.js).
