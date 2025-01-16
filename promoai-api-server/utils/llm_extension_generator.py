from utils.prompting import create_extension_conversation, update_extension_conversation
from utils.extension_generation.extension_generation import generate_extension
from pm4py.util import constants


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

    def __create_extension_prompt(self):
        """
        Creates the initial conversation prompt for enhancing the BPMN with extensions.

        Returns:
            str: The conversation prompt.
        """
        return f"""
        Enhance the following BPMN model by adding <extensionElements> with these attributes:
        {self.__attributes_description}

        Input BPMN XML:
        {self.__base_bpmn}

        Enhanced BPMN XML:
        """

    def get_enhanced_bpmn(self):
        """
        Retrieves the enhanced BPMN model with extensions.

        Returns:
            str: Enhanced BPMN XML as a string.
        """
        return self.__enhanced_bpmn

    def update(self, feedback: str):
        """
        Updates the enhanced BPMN model based on user feedback.

        Args:
            feedback (str): User feedback on the generated BPMN.
        """
        self.__conversation = update_extension_conversation(self.__conversation, feedback)
        self.__enhanced_bpmn, self.__conversation = generate_extension(conversation=self.__conversation,
                                                                   api_key=self.__api_key,
                                                                   openai_model=self.__openai_model,
                                                                   api_url=self.__api_url)

    def view_bpmn(self, image_format: str = "svg"):
        """
        Visualizes the enhanced BPMN model in the specified format.

        Args:
            image_format (str): The format for visualization (default: svg).
        """
        image_format = str(image_format).lower()
        from pm4py.visualization.bpmn import visualizer as bpmn_visualizer
        parameters = bpmn_visualizer.Variants.CLASSIC.value.Parameters
        visualization = bpmn_visualizer.apply(self.get_enhanced_bpmn(),
                                              parameters={parameters.FORMAT: image_format})
        bpmn_visualizer.view(visualization)

    def export_bpmn(self, file_path: str, encoding: str = constants.DEFAULT_ENCODING):
        """
        Exports the enhanced BPMN model to a file.

        Args:
            file_path (str): The path to save the BPMN file (must end with .bpmn).
            encoding (str): The encoding for the file (default: UTF-8).
        """
        if not file_path.lower().endswith("bpmn"):
            raise Exception("The provided file path does not have the '.bpmn' extension!")
        from pm4py.objects.bpmn.exporter import exporter
        exporter.apply(self.get_enhanced_bpmn(), file_path, parameters={"encoding": encoding})
