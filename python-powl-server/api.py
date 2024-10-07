from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pm4py.objects.bpmn.exporter.variants.etree import get_xml_string
from fastapi.responses import JSONResponse
import logging, traceback
import os

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

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Session(BaseModel):
    process_description: str
    llm: str = os.getenv("LLM_NAME");
    api_key: str = os.getenv("LLM_API_KEY");

class Feedback(BaseModel):
    feedback_text: str
    llm: str = os.getenv("LLM_NAME");
    api_key: str = os.getenv("LLM_API_KEY");

@app.post("/generate_process_model")
def generate_model(data: Session):
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
            return JSONResponse(content={"bpmn_xml": bpmn_str}, media_type="application/json")
        else:
            raise ValueError("Generated BPMN diagram is None or invalid.")
    except Exception as e:
        logger.error("Error generating BPMN model: %s", str(e))
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/update_process_model")
def update_model(data: Feedback):
    try:
        model_gen = LLMProcessModelGenerator("", data.api_key, data.llm)
        model_gen.update(data.feedback_text)

        if model_gen:
            powl = model_gen.get_powl()
            pn, im, fm = powl_to_pn(powl)
            bpmn = pn_to_bpmn(pn, im, fm)
            bpmn = layouter(bpmn)

            bpmn_data = get_xml_string(bpmn, parameters={"encoding": constants.DEFAULT_ENCODING})
            
            bpmn_str = bpmn_data.decode('utf-8')
            logger.debug("The BPMN model after decoding: %s", bpmn_str)
            return JSONResponse(content={"bpmn_xml": bpmn_str}, media_type="application/json")
        else:
            raise ValueError("Generated BPMN diagram is None or invalid.")
    except Exception as e:
        logger.error("Error processing feedback: %s", str(e))
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/")
def main():
    return {"message": "Hello, this is an API for ProMoAI"}