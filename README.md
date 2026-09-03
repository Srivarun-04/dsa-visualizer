# DSA Visualizer

An interactive Python DSA visualizer that lets you execute algorithms step-by-step and visually track arrays, variables, and user-defined pointers.

DSA Visualizer executes genuine Python code in an isolated runtime environment, captures every line-by-line state transition, and renders a live, synchronized visual interface of memory structures, variable mutations, and pointer movements.

---

## Features

- **Step-by-Step Python Execution**: Trace actual Python code line-by-line using `sys.settrace` with full stdout and exception monitoring.
- **Visual Execution Timeline**: Synchronized line-highlighting in a dark-themed Monaco code editor.
- **Array & List Visualization**: Render lists as discrete memory cells with index indicators (`[0]`, `[1]`, `[2]`, ...).
- **Variable State Tracking**: Automatic tracking of primitive scalars (`int`, `float`, `str`, `bool`), dictionaries, and sets with mutation badges.
- **User-Defined Pointer Visualization**: Manually specify which variables represent pointers (e.g. `i`, `j` or `low`, `high`), preventing unrelated variables from cluttering array cells.
- **Set & Mutable Collection Snapshots**: Deep-copy snapshotting ensures historical states remain intact across set additions, deletions, and list modifications.
- **Playback Controls**: Full interactive timeline scrubber, Play, Pause, Next Step, Prev Step, and Reset.
- **Adjustable Speed**: Control execution speed (`0.5x`, `1x`, `2x`) for automated playback.
- **Built-in Examples**:
  - **Two Sum**: Demonstrating array iteration, variable tracking, and dictionary lookup.
  - **Binary Search**: Demonstrating divide-and-conquer on sorted arrays with `low` and `high` pointers.
- **Custom Python Code Support**: Dedicated "Your Code" workspace to write, paste, and visualize any Python DSA algorithm.

---

## How It Works

1. **Write or Load Python Code**: Use the dedicated "Your Code" editor or select a built-in example.
2. **Specify Pointer Variables**: Explicitly define the pointer names used in your algorithm (e.g., `low`, `high`, `left`, `right`).
3. **Run the Code**: The Python backend compiles and executes the code in an isolated subprocess.
4. **Capture Execution States**: Immutable snapshots of memory, local variables, stdout, and call frames are recorded per line.
5. **Step Through Execution**: Use the scrubber, arrow keys, or autoplay to navigate forward and backward in time.
6. **Observe Dynamic Changes**: Watch pointers move, array elements update, and variables mutate in real time.

---

## Example

```python
arr = [1, 2, 3, 4, 5]

left = 0
right = len(arr) - 1

while left < right:
    if arr[left] < arr[right]:
        left += 1
    else:
        right -= 1
```

**Pointer Variables:** `left`, `right`

The visualizer renders:
```text
          left                        right
           ▲                            ▲
         [ 1 ]   [ 2 ]   [ 3 ]   [ 4 ]   [ 5 ]
          [0]     [1]     [2]     [3]     [4]
```

---

## Project Structure

```text
dsa-visualizer/
├── backend/
│   └── app/
│       ├── main.py        # FastAPI server with CORS & health check
│       ├── models.py      # Pydantic schemas for requests and trace steps
│       ├── runner.py      # Subprocess execution worker with deterministic snapshots
│       └── tracer.py      # Isolated process runner with timeouts and IPC
├── src/
│   ├── components/
│   │   ├── Controls.tsx       # Timeline playback and speed controls
│   │   ├── Editor.tsx         # Monaco editor with active line markers
│   │   ├── PointerInput.tsx   # User-defined pointer variable chips
│   │   └── Visualization.tsx  # Array cells, pointers, and variables inspector
│   ├── pages/
│   │   ├── _app.tsx           # Next.js app wrapper
│   │   └── index.tsx          # Main side-by-side workspace
│   └── styles/
│       └── globals.css        # Tailwind CSS and theme definitions
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python**: Version 3.10+
- **Node.js**: Version 18+ and `npm`

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`. You can verify health status at `http://127.0.0.1:8000/health`.

### 2. Frontend Setup

In a separate terminal:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment

### Environment Configuration

By default, the frontend connects to `http://127.0.0.1:8000`. For production, configure the backend API URL:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

### Production Build

```bash
npm run build
npm run start
```

### Backend Production Service

Run Uvicorn with production process management:

```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## License

MIT License. Free for educational and personal use.
