from lxml import etree

class ExtensionGenerator:
    def __init__(self, base_xml):
        """
        Initializes the ExtensionGenerator with a BPMN XML string.

        Parameters:
            base_xml (str): The XML string of the BPMN document.
        """
        parser = etree.XMLParser(remove_blank_text=True)

        xml_bytes = base_xml.encode('utf-8')
        self.tree = etree.XML(xml_bytes, parser)
        self.nsmap = self.tree.nsmap

    def add_attribute(self, element_id, namespace, attribute_name, attributes):
        """
        Adds a custom attribute or a list of attributes to the <extensionElements> of an element.

        Parameters:
            element_id (str): The ID of the element to add attributes to.
            namespace (str): The namespace of the attributes.
            attribute_name (str): The name of the custom attribute or element to add.
            attributes (dict or list): If a single attribute, a dictionary of attribute values.
                                       If a list, a list of dictionaries for multiple elements.
        """
        # Find the element by ID
        xpath_expr = f"//*[@id='{element_id}']"
        element = self.tree.xpath(xpath_expr, namespaces=self.nsmap)
        if not element:
            raise ValueError(f"Element with ID '{element_id}' not found.")
        element = element[0]

        # Find or create <extensionElements>
        extension_elements = element.find(f'{{*}}extensionElements', namespaces=self.nsmap)
        if extension_elements is None:
            extension_elements = etree.SubElement(element, f'{{{self.nsmap["bpmn2"]}}}extensionElements')

        # If attributes is a list, add each one as a new element (e.g., <vsdt2:assignment> for each dictionary)
        if isinstance(attributes, list):
            for attr in attributes:
                # Create the parent element (e.g., <vsdt2:assignments>) if necessary
                parent_element = extension_elements.find(f"{{{namespace}}}{attribute_name}")
                if parent_element is None:
                    parent_element = etree.SubElement(extension_elements, f"{{{namespace}}}{attribute_name}")

                # Create the child element (e.g., <vsdt2:assignment>)
                child_element = etree.SubElement(parent_element, f"{{{namespace}}}assignment")
                for key, value in attr.items():
                    child_element.set(key, value)

        # If attributes is a single dictionary (for example, for adding one <vsdt2:assignment> directly)
        elif isinstance(attributes, dict):
            # Create the parent element (e.g., <vsdt2:assignments>) if necessary
            parent_element = extension_elements.find(f"{{{namespace}}}{attribute_name}")
            if parent_element is None:
                parent_element = etree.SubElement(extension_elements, f"{{{namespace}}}{attribute_name}")

            # Create the child element (e.g., <vsdt2:assignment>)
            child_element = etree.SubElement(parent_element, f"{{{namespace}}}assignment")
            for key, value in attributes.items():
                child_element.set(key, value)

        else:
            raise ValueError("The 'attributes' parameter should be a dictionary or a list of dictionaries.")


    def remove_attribute(self, element_id, namespace, attribute_name):
        """
        Removes a custom attribute from an element's <extensionElements>.

        Parameters:
            element_id (str): The ID of the element from which the attribute should be removed.
            namespace (str): The namespace of the attribute.
            attribute_name (str): The name of the custom attribute to remove.
        """
        # Find the element by ID
        xpath_expr = f"//*[@id='{element_id}']"
        element = self.tree.xpath(xpath_expr, namespaces=self.nsmap)
        if not element:
            raise ValueError(f"Element with ID '{element_id}' not found.")
        element = element[0]

        # Find <extensionElements>
        extension_elements = element.find(f'{{*}}extensionElements', namespaces=self.nsmap)
        if extension_elements is None:
            raise ValueError(f"<extensionElements> not found for element ID '{element_id}'.")

        # Remove the custom attribute
        qualified_tag = f"{{{namespace}}}{attribute_name}"
        attribute_to_remove = extension_elements.find(qualified_tag)

        if attribute_to_remove is None:
            raise ValueError(f"Attribute '{attribute_name}' not found in <extensionElements> of element ID '{element_id}'.")

        extension_elements.remove(attribute_to_remove)


    def to_string(self):
        """
        Returns the modified XML as a string.

        Returns:
            str: The updated BPMN XML as a string.
        """
        return etree.tostring(self.tree, pretty_print=True, xml_declaration=True, encoding='UTF-8').decode('UTF-8')