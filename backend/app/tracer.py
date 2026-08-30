import sys
import io
import traceback
import linecache
import copy
import json
import multiprocessing as mp
from typing import List, Dict, Any, Optional

from .models import TraceRequest, TraceResponse, TraceStep

MAX_TRACE_STEPS = 10_000
STDOUT_LIMIT = 10_000  # characters

def _serialize_value(value: Any) -> Any:
    """Attempt to serialize a value safely for JSON.
    Primitive types are returned as‑is. Mutable containers are deep‑copied and
    recursively serialized. Unsupported objects fall back to a readable string.
    """
    # Primitive JSON‑serializable types
    if isinstance(value, (int, float, str, bool)) or value is None:
        return value
    # Containers – make a deep copy to avoid later mutation side‑effects
    try:
        copied = copy.deepcopy(value)
    except Exception:
        return repr(value)
    if isinstance(copied, (list, tuple, set)):
        return [_serialize_value(v) for v in copied]
    if isinstance(copied, dict):
        return {str(k): _serialize_value(v) for k, v in copied.items()}
    # Fallback for other objects
    try:
        return json.dumps(copied)
    except Exception:
        return repr(copied)

def _tracer_factory(step_list: List[Dict[str, Any]], max_steps: int, stdout_buffer: io.StringIO):
    """Create a sys.settrace compatible tracer that records execution steps.
    ``step_list`` is mutated in‑place. ``stdout_buffer`` captures any prints.
    """
    step_counter = 0

    def tracer(frame, event, arg):
        nonlocal step_counter
        if event not in ("line", "call", "return", "exception"):
            return tracer
        if step_counter >= max_steps:
            raise RuntimeError("Maximum trace steps exceeded")
        step_counter += 1
        # Capture source line text
        filename = frame.f_code.co_filename
        lineno = frame.f_lineno
        line_text = linecache.getline(filename, lineno).strip()
        # Snapshot locals – deep copy each value for safety
        locals_snapshot = {}
        for var, val in frame.f_locals.items():
            if var == "__builtins__":
                continue
            try:
                locals_snapshot[var] = _serialize_value(val)
            except Exception:
                locals_snapshot[var] = repr(val)
        # Capture current stdout (up to limit)
        current_stdout = stdout_buffer.getvalue()
        if len(current_stdout) > STDOUT_LIMIT:
            current_stdout = current_stdout[:STDOUT_LIMIT] + "... (truncated)"
        step = {
            "step": step_counter,
            "event": event,
            "line": lineno,
            "line_text": line_text,
            "locals": locals_snapshot,
            "stdout": current_stdout,
            "exception": None,
        }
        step_list.append(step)
        return tracer

    return tracer

def _worker(request: TraceRequest, conn):
    """Subprocess worker that runs user code under the tracer.
    Results (list of dicts) are sent back through the pipe.
    """
    # Prepare capture objects
    steps: List[Dict[str, Any]] = []
    stdout_capture = io.StringIO()
    sys.stdout = stdout_capture
    sys.stderr = stdout_capture
    # Install tracer
    tracer = _tracer_factory(steps, request.max_steps or MAX_TRACE_STEPS, stdout_capture)
    sys.settrace(tracer)
    try:
        # Execute user code in an isolated global namespace (no builtins removal to keep standard lib usable)
        exec(compile(request.code, "<user_code>", "exec"), {})
    except Exception:
        # Record exception on the last step (or create a step if none yet)
        exc_info = traceback.format_exc()
        if steps:
            steps[-1]["exception"] = exc_info
        else:
            steps.append({
                "step": 1,
                "event": "exception",
                "line": 0,
                "line_text": "",
                "locals": {},
                "stdout": stdout_capture.getvalue(),
                "exception": exc_info,
            })
    finally:
        sys.settrace(None)
        # Ensure any remaining stdout is captured
        final_stdout = stdout_capture.getvalue()
        if steps:
            steps[-1]["stdout"] = final_stdout[:STDOUT_LIMIT]
        else:
            steps.append({
                "step": 1,
                "event": "line",
                "line": 0,
                "line_text": "",
                "locals": {},
                "stdout": final_stdout[:STDOUT_LIMIT],
                "exception": None,
            })
        # Send over pipe
        conn.send(steps)
        conn.close()

def trace_code(request: TraceRequest) -> TraceResponse:
    """Public API used by FastAPI endpoint.
    Runs the user code in a subprocess with timeout and step limits.
    Returns a list of :class:`TraceStep` objects.
    """
    parent_conn, child_conn = mp.Pipe(duplex=False)
    # Ensure defaults
    req = TraceRequest(
        code=request.code,
        timeout_seconds=request.timeout_seconds or 5,
        max_steps=request.max_steps or MAX_TRACE_STEPS,
    )
    proc = mp.Process(target=_worker, args=(req, child_conn), daemon=True)
    proc.start()
    proc.join(req.timeout_seconds)
    if proc.is_alive():
        proc.terminate()
        return TraceResponse(steps=[], completed=False, error="Execution timed out")
    if parent_conn.poll():
        raw_steps = parent_conn.recv()
        # Convert raw dicts to Pydantic models
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
        return TraceResponse(steps=trace_steps, completed=True)
    else:
        return TraceResponse(steps=[], completed=False, error="No trace data received")
