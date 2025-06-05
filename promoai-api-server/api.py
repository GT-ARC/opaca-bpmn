from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pm4py.objects.bpmn.exporter.variants.etree import get_xml_string
from fastapi.responses import JSONResponse
import logging, traceback
import os, uuid

from utils import LLMProcessModelGenerator, LLMExtensionGenerator
from pm4py.objects.conversion.powl.variants.to_petri_net import apply as powl_to_pn
from pm4py.objects.conversion.wf_net.variants.to_bpmn import apply as pn_to_bpmn
from utils.bpmn.graphviz import layouter
from pm4py.util import constants


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

logger = logging.getLogger("uvicorn")

class Session(BaseModel):
    process_description: str
    with_extensions: bool = False
    llm: str = os.getenv("LLM_NAME")
    api_key: str = os.getenv("LLM_API_KEY")

class Feedback(BaseModel):
    process_xml: str = None
    feedback_text: str
    session_id: str
    extension_session_id: str
    llm: str = os.getenv("LLM_NAME")
    api_key: str = os.getenv("LLM_API_KEY")


session_store = {}

def store_model_gen_in_cache(model_gen):
    session_id = str(uuid.uuid4())
    session_store[session_id] = model_gen
    return session_id

def get_model_gen_from_cache(session_id):
    return session_store.get(session_id, None)


@app.get("/config")
def get_config():
    try:
        config = {
            "llm_name": os.getenv("LLM_NAME", ""),
            "llm_api_key_present": bool(os.getenv("LLM_API_KEY"))  # To not expose the actual key
        }

        return JSONResponse(content=config, media_type="application/json")
    except Exception as e:
        logger.error("Error retrieving configuration: %s", str(e))
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Could not retrieve configuration.")


@app.post("/generate_process_model")
def generate_model(data: Session):
    logger.info("Generating model for: %s", data.process_description)
    try:
        # First step: generate basic ProMoAI BPMN diagram
        model_gen = LLMProcessModelGenerator(data.process_description, data.api_key, data.llm)
        session_id = store_model_gen_in_cache(model_gen)

        # POWL -> PetriNet -> BPMN model
        powl = model_gen.get_powl()
        pn, im, fm = powl_to_pn(powl)
        bpmn = pn_to_bpmn(pn, im, fm)
        bpmn = layouter(bpmn) # crappy "better-than-nothing" layout, usually overwritten by BPMN.io Auto-Layouter

        # BPMN model -> string
        bpmn_data = get_xml_string(bpmn, parameters={"encoding": constants.DEFAULT_ENCODING}) #returns bytes
        bpmn_str = bpmn_data.decode('utf-8') #here we convert bytes to a string
        logger.debug("The BPMN model after decoding: %s", bpmn_str)
        
        if not data.with_extensions:
            return JSONResponse(content={"bpmn_xml": bpmn_str, "session_id": session_id, "extension_session_id": None}, media_type="application/json")

        # Second step: add custom attributes TODO maybe use separate description
        extension_gen = LLMExtensionGenerator(bpmn_str, data.process_description, data.api_key, data.llm)
        extension_session_id = store_model_gen_in_cache(extension_gen)
        
        bpmn_with_extensions = extension_gen.get_enhanced_bpmn()
        logger.debug("The BPMN model with extensions: %s", bpmn_with_extensions)
        
        return JSONResponse(content={"bpmn_xml": bpmn_with_extensions, "session_id": session_id, "extension_session_id": extension_session_id}, media_type="application/json")
    except Exception as e:
        logger.error("Error generating BPMN model: %s", str(e))
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/update_process_model")
def update_model(data: Feedback):
    logger.info('Updating model with query: %s', data.feedback_text)
    try:
        session_id = data.session_id
        model_gen = get_model_gen_from_cache(session_id)

        extension_session_id = data.extension_session_id
        extension_gen = get_model_gen_from_cache(extension_session_id)

        # When there is no model_gen yet, create a new one using process xml
        if not session_id and data.process_xml:
            model_gen = LLMProcessModelGenerator(data.process_xml, data.api_key, data.llm)
            session_id = store_model_gen_in_cache(model_gen)


        if not model_gen:
            raise HTTPException(status_code=404, detail="Session ID not found or expired.")

        model_gen.update(data.feedback_text)

        powl = model_gen.get_powl()
        pn, im, fm = powl_to_pn(powl)
        bpmn = pn_to_bpmn(pn, im, fm)
        bpmn = layouter(bpmn)

        bpmn_data = get_xml_string(bpmn, parameters={"encoding": constants.DEFAULT_ENCODING})

        bpmn_str = bpmn_data.decode('utf-8')
        logger.debug("The BPMN model after decoding: %s", bpmn_str)

        # When there is no extension_gen yet, create a new one
        if not extension_session_id and data.process_xml:
            extension_gen = LLMExtensionGenerator(bpmn_str, data.feedback_text, data.api_key, data.llm)

            extension_session_id = store_model_gen_in_cache(extension_gen)

        if not extension_gen:
            raise HTTPException(status_code=404, detail="Extension session ID not found or expired.")

        # Second step: add custom attributes
        final_bpmn = extension_gen.update(bpmn_str, data.feedback_text)

        return JSONResponse(content={"bpmn_xml": final_bpmn, "session_id": session_id, "extension_session_id": extension_session_id}, media_type="application/json")
    except Exception as e:
        logger.error("Error processing feedback: %s", str(e))
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
