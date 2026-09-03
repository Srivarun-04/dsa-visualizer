import sys
import io
import json
import copy
import traceback
from typing import Any, Dict, List

MAX_TRACE_STEPS = 10_000
STDOUT_LIMIT = 10_000

def deterministic_sort_key(item: Any):
    try:
        return (0, item)
    except TypeError:
        return (1, str(type(item)), repr(item))

def serialize_value(val: Any, visited: set = None) -> Any:
    """Recursively and deeply snapshot a value into a deterministic JSON-safe structure.
    Handles primitives, lists, tuples, sets, dicts, and nested combinations.
    Detects circular references and non-serializable objects cleanly.
    """
    if visited is None:
        visited = set()

    if isinstance(val, (int, float, str, bool)) or val is None:
        return val

    val_id = id(val)
    if val_id in visited:
        return "<circular>"
    visited.add(val_id)

    try:
        if isinstance(val, (set, frozenset)):
            try:
                sorted_items = sorted(list(val), key=deterministic_sort_key)
            except Exception:
                sorted_items = list(val)
            return {
                "__type__": "set",
                "items": [serialize_value(x, visited) for x in sorted_items]
            }
        elif isinstance(val, (list, tuple)):
            return [serialize_value(x, visited) for x in val]
        elif isinstance(val, dict):
            return {str(k): serialize_value(v, visited) for k, v in val.items()}
        else:
            return repr(val)
    finally:
        visited.remove(val_id)

def run_trace(code: str, max_steps: int = MAX_TRACE_STEPS) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []
    stdout_capture = io.StringIO()
    code_lines = code.splitlines()

    step_counter = 0

    def tracer(frame, event, arg):
        nonlocal step_counter
        # Only trace the user's compiled code
        if frame.f_code.co_filename != "<user_code>":
            return tracer

        if event not in ("line", "return", "exception"):
            return tracer

        if step_counter >= max_steps:
            raise RuntimeError("Maximum trace steps exceeded")

        step_counter += 1
        lineno = frame.f_lineno
        line_text = code_lines[lineno - 1] if 1 <= lineno <= len(code_lines) else ""

        # Collect local variables
        locals_snapshot: Dict[str, Any] = {}

        # If inside a function frame, also snapshot globals that are user variables
        if frame.f_code.co_name != "<module>":
            for var, val in frame.f_globals.items():
                if not var.startswith("__") and not callable(val):
                    try:
                        locals_snapshot[var] = serialize_value(val)
                    except Exception:
                        locals_snapshot[var] = repr(val)

        for var, val in frame.f_locals.items():
            if var.startswith("__"):
                continue
            # Skip user defined functions that shadow their own name
            if callable(val) and hasattr(val, "__code__") and val.__code__.co_name == var:
                continue
            try:
                locals_snapshot[var] = serialize_value(val)
            except Exception:
                locals_snapshot[var] = repr(val)

        exc_info = None
        if event == "exception" and arg:
            exc_type, exc_val, _ = arg
            exc_info = f"{exc_type.__name__}: {exc_val}"

        current_stdout = stdout_capture.getvalue()
        if len(current_stdout) > STDOUT_LIMIT:
            current_stdout = current_stdout[:STDOUT_LIMIT] + "... (truncated)"

        step = {
            "step": step_counter,
            "event": event,
            "line": lineno,
            "line_text": line_text,
            "locals": locals_snapshot,
            "stdout": current_stdout,
            "exception": exc_info,
        }
        steps.append(step)
        return tracer

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = stdout_capture
    sys.stderr = stdout_capture

    try:
        compiled = compile(code, "<user_code>", "exec")
        sys.settrace(tracer)
        exec(compiled, {})
    except Exception:
        exc_str = traceback.format_exc()
        if steps:
            steps[-1]["exception"] = exc_str
        else:
            steps.append({
                "step": 1,
                "event": "exception",
                "line": 0,
                "line_text": "",
                "locals": {},
                "stdout": stdout_capture.getvalue(),
                "exception": exc_str,
            })
    finally:
        sys.settrace(None)
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    # Ensure stdout at end is updated on last step
    final_stdout = stdout_capture.getvalue()
    if len(final_stdout) > STDOUT_LIMIT:
        final_stdout = final_stdout[:STDOUT_LIMIT] + "... (truncated)"

    if steps:
        steps[-1]["stdout"] = final_stdout

    return {"steps": steps, "completed": True}

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"steps": [], "completed": False, "error": "No input provided"}))
            return
        payload = json.loads(input_data)
        code = payload.get("code", "")
        max_steps = payload.get("max_steps", MAX_TRACE_STEPS)
        result = run_trace(code, max_steps)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"steps": [], "completed": False, "error": str(e)}))

if __name__ == "__main__":
    main()
