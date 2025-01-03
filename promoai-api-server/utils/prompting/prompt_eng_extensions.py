def add_extension_role():
    return (
        "Your role: you are an expert in process modeling and BPMN customization. "
        "Your task is to analyze a BPMN process model and add custom attributes to the model's elements. "
        "You are familiar with BPMN libraries and their capabilities for adding extension elements. "
        "Be precise in modifying the model and ensure that the extensions comply with BPMN standards. \n\n"
    )

def add_extension_knowledge():
    return (
        "Use the following knowledge about BPMN extensions:\n"
        "- BPMN models can include custom attributes and extension elements to capture domain-specific information.\n"
        "- Extension elements can be added to tasks, events, gateways, and other BPMN elements.\n"
        "- Ensure that custom attributes are appropriately namespaced to avoid conflicts with standard BPMN attributes.\n"
        "- Use Python libraries such as 'xml.etree.ElementTree' or dedicated BPMN libraries to manipulate the model.\n"
        "- Validate the BPMN model after modifications to ensure it remains executable and well-formed.\n\n"
    )

def add_least_to_most_extensions():
    return (
        "Start with simpler modifications before introducing more complex extensions:\n"
        "- Begin by identifying tasks, events, or gateways that need custom attributes or extensions.\n"
        "- Add basic custom attributes (e.g., priority, estimated_duration) to tasks or events.\n"
        "- If necessary, define more complex extension elements or structures to represent domain-specific information.\n"
        "- Ensure that added attributes and elements are logically grouped and appropriately namespaced.\n"
        "- Validate the modified BPMN model at each step to ensure compliance with BPMN standards.\n\n"
    )


def add_extension_code_generation():
    return (
        "Provide Python code to modify the BPMN model. Use a Python BPMN library to add custom attributes or "
        "extension elements. The code should:\n"
        "- Parse the input BPMN model.\n"
        "- Add or modify attributes or extension elements as specified in the task.\n"
        "- Output the modified BPMN model as a string or file.\n\n"
    )

def add_base_model(base_model: str):
    return f"This is the base model without extensions: {base_model}\n"

def add_process_description_for_extensions(process_description):
    return f"This is the process description: {process_description}\n"

def create_extension_prompt(base_bpmn: str, custom_attributes: dict) -> str:
    prompt = add_extension_role()
    prompt += add_least_to_most_extensions()
    prompt += add_extension_knowledge()
    prompt += add_extension_code_generation()
    prompt += add_base_model(base_bpmn)
    prompt += add_process_description_for_extensions(custom_attributes)
    return prompt


def create_extension_conversation(base_bpmn: str, custom_attributes: dict) -> List[dict[str, str]]:
    prompt = create_extension_prompt(base_bpmn, custom_attributes)
    conversation = [{"role": "user", "content": prompt}]
    print(prompt)
    return conversation


def update_extension_conversation(conversation: List[dict[str, str]], feedback: str) -> List[dict[str, str]]:
    update_prompt = "Please refine the BPMN extensions based on the following feedback. Ensure that the enhanced " \
                    "model continues to adhere to the BPMN standards and incorporates all custom attributes " \
                    "correctly. This is the feedback:\n" + feedback
    conversation.append({"role": "user", "content": update_prompt})
    print(update_prompt)
    return conversation
