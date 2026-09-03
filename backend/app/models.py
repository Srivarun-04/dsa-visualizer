from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class TraceStep(BaseModel):
    line: int
    line_text: str
    locals: Dict[str, Any]
    stdout: str
    exception: Optional[str] = None

class TraceRequest(BaseModel):
    code: str
    timeout_seconds: Optional[int] = 5
    max_steps: Optional[int] = 10000

class TraceResponse(BaseModel):
    steps: List[TraceStep]
    completed: bool
    error: Optional[str] = None
