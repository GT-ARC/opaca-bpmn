from utils.prompting import create_extension_conversation, update_extension_conversation
from utils.extension_generation.extension_generation import generate_extension


class LLMExtensionGenerator(object):
    def __init__(self, base_bpmn: str, attributes_description: str, api_key: str,
                 openai_model: str = "gpt-4o", api_url: str = "https://api.openai.com/v1"):
        """
        Initializes the extension generator.

        Args:
            base_bpmn (str): The base BPMN XML as a string.
            attributes_description (str): Attributes to include in <extensionElements>.
            api_key (str): API key for the LLM service.
            openai_model (str): The LLM model to use (default: gpt-4o).
            api_url (str): The API URL for the LLM service (default: OpenAI).
        """
        self.__api_url = api_url
        self.__api_key = api_key
        self.__openai_model = openai_model
        self.__base_bpmn = base_bpmn
        self.__attributes_description = attributes_description

        # Create a conversation context for the LLM
        init_conversation = create_extension_conversation(base_bpmn, attributes_description)
        self.__enhanced_bpmn, self.__conversation = generate_extension(init_conversation,
                                                                   api_key=self.__api_key,
                                                                   openai_model=self.__openai_model,
                                                                   api_url=self.__api_url)


    def get_enhanced_bpmn(self):
        """
        Retrieves the enhanced BPMN model with extensions.

        Returns:
            str: Enhanced BPMN XML as a string.
        """
        return self.__enhanced_bpmn


    def update(self, base_bpmn: str, feedback: str):
        """
        Updates the enhanced BPMN model based on user feedback.

        Args:
            base_bpmn (str): The bpmn we want modified
            feedback (str): User feedback on the generated BPMN.
        """
        self.__base_bpmn = base_bpmn
        self.__conversation = update_extension_conversation(self.__conversation, base_bpmn, feedback)
        self.__enhanced_bpmn, self.__conversation = generate_extension(conversation=self.__conversation,
                                                                   api_key=self.__api_key,
                                                                   openai_model=self.__openai_model,
                                                                   api_url=self.__api_url)
        return self.__enhanced_bpmn
