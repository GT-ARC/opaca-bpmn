from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pm4py.objects.bpmn.exporter.variants.etree import get_xml_string
from fastapi.responses import JSONResponse
import logging, traceback
import os, uuid

from utils import LLMProcessModelGenerator
from utils.petrinet.to_petri_net import apply as powl_to_pn
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
    llm: str = os.getenv("LLM_NAME")
    api_key: str = os.getenv("LLM_API_KEY")

class Feedback(BaseModel):
    process_xml: str = None
    feedback_text: str
    session_id: str
    llm: str = os.getenv("LLM_NAME")
    api_key: str = os.getenv("LLM_API_KEY")

session_store = {}

def store_model_gen_in_cache(model_gen):
    session_id = str(uuid.uuid4())
    session_store[session_id] = model_gen
    return session_id

def get_model_gen_from_cache(session_id):
    return session_store.get(session_id, None)

@app.post("/generate_process_model")
def generate_model(data: Session):
    logger.debug("Received data for generating model: %s", data)
    try:
        model_gen = LLMProcessModelGenerator(data.process_description, data.api_key, data.llm)

        if model_gen:
            powl = model_gen.get_powl()
            pn, im, fm = powl_to_pn(powl)
            bpmn = pn_to_bpmn(pn, im, fm)
            bpmn = layouter(bpmn)

            bpmn_data = get_xml_string(bpmn, parameters={"encoding": constants.DEFAULT_ENCODING}) #returns bytes

            bpmn_str = bpmn_data.decode('utf-8') #here we convert bytes to a string
            logger.debug("The BPMN model after decoding: %s", bpmn_str)

            session_id = store_model_gen_in_cache(model_gen)

            return JSONResponse(content={"bpmn_xml": bpmn_str, "session_id": session_id}, media_type="application/json")
        else:
            raise ValueError("Generated BPMN diagram is None or invalid.")
    except Exception as e:
        logger.error("Error generating BPMN model: %s", str(e))
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update_process_model")
def update_model(data: Feedback):
    #logger.info('UPDATE MODEL, data: ', data)
    try:
        session_id = data.session_id

        model_gen = get_model_gen_from_cache(session_id)

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
        return JSONResponse(content={"bpmn_xml": bpmn_str, "session_id": session_id}, media_type="application/json")
    except Exception as e:
        logger.error("Error processing feedback: %s", str(e))
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def main():
    return {"message": "Hello, this is an API for ProMoAI"}