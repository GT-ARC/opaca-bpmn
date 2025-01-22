#import os
from typing import List

def add_extension_role():
    return (
        "Your role: you are an expert in process modeling and BPMN customization. "
        "Your task is to analyze a BPMN process model and add custom attributes to the model's elements. "
        "You are familiar with BPMN and extension elements. "
        "Be precise in modifying the model and ensure that the extensions comply with BPMN standards. \n\n"
    ) #TODO: try to make sense of the description and see if any extensions are neccessary


#vsdt2_path = os.path.abspath(
    #os.path.join(os.path.dirname(__file__), '../../../opaca-bpmn-editor/src/descriptors/vsdt2.json')
#)

#with open(vsdt2_path, 'r') as vsdt2_json:
    #vsdt2 = vsdt2_json.read()

vsdt2 = """
{
"name": "Vsdt2",
"prefix": "vsdt2",
"uri": "https://gitlab.dai-labor.de/zeki-bmas/tp-processes/bpmn-interpreter-vsdt2/-/raw/main/src/descriptors/vsdt2.json?ref_type=heads",
"xml": {
    "tagAlias": "lowerCase"
},
"associations": [],
"types": [
    {
        "name": "Assignments",
        "superClass": [ "Element" ],
        "properties": [
            {
                "name": "values",
                "isMany": true,
                "type": "Assignment"
            }
        ]
    },
    {
        "name": "Assignment",
        "properties": [
            {
                "name": "variable",
                "isAttr": true,
                "type": "String"
            },
            {
                "name": "expression",
                "isAttr": true,
                "type": "String",
                "description": "Expression you want to assign"
            },
            {
                "name": "assignTime",
                "isAttr": true,
                "type": "String",
                "description": "Assignment at start or end of an activity"
            }
        ]
    },
    {
        "name": "Variables",
        "superClass": [ "Element" ],
        "properties": [
            {
                "name": "values",
                "isMany": true,
                "type": "Variable"
            }
        ]
    },
    {
        "name": "Variable",
        "properties": [
            {
                "name": "name",
                "isAttr": true,
                "type": "String"
            },
            {
                "name": "type",
                "isAttr": true,
                "type": "String",
                "description": "Choose from predefined types or enter a custom type"
            }
        ]
    },
    {
        "name": "ServiceImplementation",
        "extends": [ "bpmn:ServiceTask" ],
        "properties": [
            {
                "name": "serviceImpl",
                "isAttr": true,
                "type": "String"
            }
        ]
    },
    {
        "name": "Services",
        "superClass": [ "Element" ],
        "properties": [
            {
                "name": "values",
                "isMany": true,
                "type": "Service"
            }
        ]
    },
    {
        "name": "Service",
        "properties": [
            {
                "name": "type",
                "isAttr": true,
                "type": "String"
            },
            {
                "name" : "method",
                "isAttr": true,
                "type": "String"
            },
            {
                "name": "uri",
                "isAttr": true,
                "type": "String"
            },
            {
                "name": "name",
                "isAttr": true,
                "type": "String"
            },
            {
                "name": "id",
                "isAttr": true,
                "type": "String"
            },
            {
                "name": "parameters",
                "isMany": true,
                "type": "Parameter"
            },
            {
                "name": "result",
                "isAttr": false,
                "type": "Result"
            }
        ]
    },
    {
        "name": "Parameter",
        "superClass": [ "Variable" ],
        "properties": []
    },
    {
        "name": "Result",
        "superClass": [ "Variable" ],
        "properties": []
    },
    {
        "name": "UserTaskInformation",
        "extends": [ "bpmn:UserTask" ],
        "properties": [
            {
                "name": "type",
                "isAttr": true,
                "type": "String",
                "description": "Information or input"
            },
            {
                "name": "message",
                "isAttr": true,
                "type": "String",
                "description": "Message shown to user in the dialogue"
            }
        ]
    },
    {
        "name": "Targets",
        "superClass": [ "Element" ],
        "properties": [
            {
                "name": "values",
                "isMany": true,
                "type": "Target"
            }
        ]
    },
    {
        "name": "Target",
        "superClass": [ "Variable" ],
        "properties": [
            {
                "name": "description",
                "isAttr": true,
                "type": "String",
                "description": "Description of the expected input"
            }
        ]
    }
]
}
"""

def add_extension_knowledge():
    return (
        "Use the following knowledge about BPMN extensions:\n"
        "- BPMN models can include custom attributes and extension elements to capture domain-specific information.\n"
        "- Extension elements can be added to tasks, events, gateways, and other BPMN elements.\n"
        "- Use our python functions to manipulate the model.\n"
        "- Use these custom attributes: " + vsdt2 + "\n"
    )

import_statement = 'from utils.extension_generation import ExtensionGenerator'

def add_generator_impl():
    return (
        "Provide the Python code that extends the model. Save the final xml string in the" 
        " variable 'final_model'. Do not try to execute the code, just return it. Assume the class ExtensionGenerator" 
        " is properly implemented and can be imported using the import statement:" 
        f" {import_statement}\n"
        "You can assume that our custom namespace is handled by the ExtensionGenerator. Specify names without prefixes."
        "ExtensionGenerator implements following functions:\n"
        " - '__init__(self, base_xml)'\n"
        " - 'add_vsdt_attribute(self, element_id: str, attribute_name: str, attributes: dict or list)'\n"
        " - 'remove_vsdt_attribute(self, element_id: str, attribute_name: str)'\n"
        " - 'add_standard_attribute(self, element_id: str, attribute_name: str, attribute_value: str, attribute_type: str)'"
        " - 'to_string(self)'\n\n"
    )

example_str = """
extension_generator = ExtensionGenerator(xml)
element_id1 = 'Process_1'
variable = {'name': 'var1', 'type': 'integer'}
extension_generator.add_vsdt_attribute(element_id1, 'variables', variable)
element_id2 = 'StartEvent_1'
assignment = {'variable': 'var1', 'expression': 'var1 + 1', 'assignTime': 'END'}
extension_generator.add_vsdt_attribute(element_id1, 'assignments', assignment)
element_id3 = 'SequenceFlow_1'
expression = 'var1 > 5'
extension_generator.add_standard_attribute(element_id3, 'conditionExpression', expression, 'bpmn:tFormalExpression')
element_id4 = 'SequenceFlow_2'
expression2 = 'var1 <= 5'
extension_generator.add_standard_attribute(element_id4, 'conditionExpression', expression2, 'bpmn:tFormalExpression')
"""

def add_examples():
    return (
        "Here is an example on how to add attributes: " + example_str +
        "\nCommon mistakes for this example would be:"
        "- not defining the variable which is referenced in the assignment"
        "- misspelling the attribute name (e.g. they should always be lowercase, without prefix)"
        "- setting an invalid assignTime ('START' or 'END')"
        "- only defining the condition for one of the sequenceFlows after a gateway"
    )


def add_extension_code_generation():
    return (
        "Provide a single Python code snippet (i.e., staring with '```python') that modifies the BPMN model. "
        "Use our defined functions to add or remove attributes or extension elements.\n\n"
    )

def add_base_model(base_model: str):
    return f"This is the base model without extensions: {base_model}\n"

def add_process_description_for_extensions(process_description):
    return f"This is the process description: {process_description}\n"

def create_extension_prompt(base_bpmn: str, custom_attributes: dict) -> str:
    prompt = add_extension_role()
    prompt += add_generator_impl()
    prompt += add_examples()
    prompt += add_extension_knowledge()
    prompt += add_extension_code_generation()
    prompt += add_base_model(base_bpmn)
    prompt += add_process_description_for_extensions(custom_attributes)
    return prompt


def create_extension_conversation(base_bpmn: str, custom_attributes: dict) -> List[dict[str: str]]:
    prompt = create_extension_prompt(base_bpmn, custom_attributes)
    conversation = [{"role": "user", "content": prompt}]
    print(prompt)
    return conversation


def update_extension_conversation(conversation: List[dict[str: str]], base_bpmn: str, feedback: str) -> List[dict[str, str]]:
    update_prompt = "Please refine the BPMN extensions based on the following feedback. The base bpmn will always " \
                    "be without attributes. If we defined any previously, add them back (unless the feedback says otherwise). " \
                    "Ensure that the enhanced model continues to adhere to the BPMN standards correctly. " \
                    "This is the current bpmn:\n" + base_bpmn + \
                    "\nThis is the feedback:\n" + feedback
    conversation.append({"role": "user", "content": update_prompt})
    print(update_prompt)
    return conversation
