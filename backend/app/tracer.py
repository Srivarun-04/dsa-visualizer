import sys
import json
import subprocess
from typing import List, Dict, Any, Optional

from .models import TraceRequest, TraceResponse, TraceStep

MAX_TRACE_STEPS = 10_000

def trace_code(request: TraceRequest) -> TraceResponse:
    """Execute Python code in an isolated subprocess with timeout and step limits.
    Returns a TraceResponse containing the structured execution steps.
    """
    timeout = request.timeout_seconds if request.timeout_seconds and request.timeout_seconds > 0 else 5
    max_steps = request.max_steps if request.max_steps and request.max_steps > 0 else MAX_TRACE_STEPS

    payload = json.dumps({
        "code": request.code,
        "max_steps": max_steps,
    })

    try:
        proc = subprocess.Popen(
            [sys.executable, "-m", "backend.app.runner"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
        )
        try:
            stdout, stderr = proc.communicate(input=payload, timeout=timeout)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.communicate()
            return TraceResponse(steps=[], completed=False, error=f"Execution timed out after {timeout} seconds")

        if proc.returncode != 0 and not stdout:
            return TraceResponse(steps=[], completed=False, error=stderr or f"Runner process exited with code {proc.returncode}")

        try:
            data = json.loads(stdout)
        except Exception as e:
            return TraceResponse(steps=[], completed=False, error=f"Failed to parse trace response: {str(e)}\nOutput: {stdout[:500]}")

        raw_steps = data.get("steps", [])
        trace_steps: List[TraceStep] = []
        for s in raw_steps:
            trace_steps.append(
                TraceStep(
                    line=s.get("line", 0),
                    line_text=s.get("line_text", ""),
                    locals=s.get("locals", {}),
                    stdout=s.get("stdout", ""),
                    exception=s.get("exception"),
                )
            )

        return TraceResponse(
            steps=trace_steps,
            completed=data.get("completed", True),
            error=data.get("error"),
        )
    except Exception as e:
        return TraceResponse(steps=[], completed=False, error=f"Unexpected error: {str(e)}")
