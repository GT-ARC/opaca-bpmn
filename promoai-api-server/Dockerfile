FROM python:3.10-slim

RUN apt-get update
RUN apt-get install -y graphviz

WORKDIR /app

RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

ENTRYPOINT ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "5000", "--log-level", "debug"]
