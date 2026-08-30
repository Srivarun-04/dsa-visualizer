from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import TraceRequest, TraceResponse
from .tracer import trace_code

app = FastAPI()

# Allow frontend (localhost) to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post('/trace', response_model=TraceResponse)
async def trace(request: TraceRequest):
    return trace_code(request)
