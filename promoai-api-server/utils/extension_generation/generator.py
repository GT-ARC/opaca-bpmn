from lxml import etree


def add_namespaces(xml_bytes, parser):
    new_namespaces = {
        "vsdt2": "https://raw.githubusercontent.com/GT-ARC/opaca-bpmn/refs/heads/main/opaca-bpmn-editor/src/descriptors/vsdt2.json"
    }
    # Parse the base XML
    tree = etree.XML(xml_bytes, parser)
    root_tag = tree.tag

    # Create a new root with updated namespaces
    new_root = etree.Element(root_tag, nsmap={**tree.nsmap, **new_namespaces})

    # Transfer children and attributes from the old root to the new root
    new_root.extend(tree)
    new_root.attrib.update(tree.attrib)

    return new_root


class ExtensionGenerator:
    def __init__(self, base_xml):
        """
        Initializes the ExtensionGenerator with a BPMN XML string.

        Parameters:
            base_xml (str): The XML string of the BPMN document.
        """
        parser = etree.XMLParser(remove_blank_text=True)

        xml_bytes = base_xml.encode('utf-8')
        self.tree = add_namespaces(xml_bytes, parser)
        self.nsmap = self.tree.nsmap


    def add_vsdt_attribute(self, element_id, attribute_name, attributes):
        """
        Adds a custom attribute or a list of attributes to the <extensionElements> of an element.

        Parameters:
            element_id (str): The ID of the element to add attributes to.
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
            extension_elements = etree.SubElement(element, f'{{{self.nsmap["bpmn"]}}}extensionElements')

        # Remove trailing s for child element
        child_element_name = attribute_name.rstrip('s')

        # If attributes is a list, add each one as a new element (e.g., <vsdt2:assignment> for each dictionary)
        if isinstance(attributes, list):
            for attr in attributes:
                # Create the parent element (e.g., <vsdt2:assignments>) if necessary
                parent_element = extension_elements.find(f'{{{self.nsmap["vsdt2"]}}}{attribute_name}')
                if parent_element is None:
                    parent_element = etree.SubElement(extension_elements, f'{{{self.nsmap["vsdt2"]}}}{attribute_name}')

                # Create the child element (e.g., <vsdt2:assignment>)
                child_element = etree.SubElement(parent_element, f'{{{self.nsmap["vsdt2"]}}}{child_element_name}')
                for key, value in attr.items():
                    child_element.set(key, value)

        # If attributes is a single dictionary (for example, for adding one <vsdt2:assignment> directly)
        elif isinstance(attributes, dict):
            # Create the parent element (e.g., <vsdt2:assignments>) if necessary
            parent_element = extension_elements.find(f'{{{self.nsmap["vsdt2"]}}}{attribute_name}')
            if parent_element is None:
                parent_element = etree.SubElement(extension_elements, f'{{{self.nsmap["vsdt2"]}}}{attribute_name}')

            # Create the child element (e.g., <vsdt2:assignment>)
            child_element = etree.SubElement(parent_element, f'{{{self.nsmap["vsdt2"]}}}{child_element_name}')
            for key, value in attributes.items():
                child_element.set(key, value)

        else:
            raise ValueError("The 'attributes' parameter should be a dictionary or a list of dictionaries.")


    def remove_vsdt_attribute(self, element_id, attribute_name):
        """
        Removes a custom attribute from an element's <extensionElements>.

        Parameters:
            element_id (str): The ID of the element from which the attribute should be removed.
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
        qualified_tag = f'{{{self.nsmap["vsdt2"]}}}{attribute_name}'
        attribute_to_remove = extension_elements.find(qualified_tag)

        if attribute_to_remove is None:
            raise ValueError(f"Attribute '{attribute_name}' not found in <extensionElements> of element ID '{element_id}'.")

        extension_elements.remove(attribute_to_remove)


    def add_standard_attribute(self, element_id, attribute_name, attribute_value, attribute_type):
        """
        Adds or updates a standard attribute (e.g., <bpmn:conditionExpression>) in a BPMN element.

        Parameters:
            element_id (str): The ID of the element to add the attribute to.
            attribute_name (str): The name of the standard attribute to add (e.g., "conditionExpression").
            attribute_value (str): The value for the attribute (e.g., the condition expression content).
            attribute_type (str): The xsi:type of the attribute (default is "bpmn:tFormalExpression").
        """
        # Find the element by ID
        xpath_expr = f"//*[@id='{element_id}']"
        element = self.tree.xpath(xpath_expr, namespaces=self.nsmap)
        if not element:
            raise ValueError(f"Element with ID '{element_id}' not found.")
        element = element[0]

        # Check if the attribute already exists
        existing_attribute = element.find(f'{{{self.nsmap["bpmn"]}}}{attribute_name}', namespaces=self.nsmap)
        if existing_attribute is not None:
            # Update the text value of the existing attribute
            existing_attribute.text = attribute_value
        else:
            # Create the new attribute element
            new_attribute = etree.SubElement(
                element,
                f'{{{self.nsmap["bpmn"]}}}{attribute_name}',
                {f'{{{self.nsmap["xsi"]}}}type': attribute_type},
            )
            new_attribute.text = attribute_value



    def to_string(self):
        """
        Returns the modified XML as a string.

        Returns:
            str: The updated BPMN XML as a string.
        """
        return etree.tostring(self.tree, pretty_print=True, xml_declaration=True, encoding='UTF-8').decode('UTF-8')