from typing import List

from utils.general_utils.openai_connection import generate_result_with_error_handling
from utils.extension_generation.code_extraction import extract_final_python_code, execute_code_and_get_variable


def extract_extension_from_response(response: str, iteration: int) -> str:
    extracted_code = extract_final_python_code(response)
    variable_name = 'final_model'
    result = execute_code_and_get_variable(extracted_code, variable_name)

    return result


def generate_extension(conversation: List[dict[str:str]], api_key: str, openai_model: str, api_url: str) \
        -> tuple[str, List[dict[str:str]]]:
    return generate_result_with_error_handling(conversation=conversation,
                                               extraction_function=extract_extension_from_response,
                                               api_key=api_key,
                                               openai_model=openai_model,
                                               api_url=api_url,
                                               max_iterations=5)
