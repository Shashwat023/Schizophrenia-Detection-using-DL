# API Connections & Routes

This document outlines the current API routes available in the backend and how the frontend connects to them.

## Backend Routes (Flask)

The backend (`/backend/app.py`) provides the following endpoints, running by default on `http://127.0.0.1:5000`:

1.  **`GET /`**
    *   **Purpose:** Health check endpoint to verify the API is running.
    *   **Response:** `{"status": "API running", "model": "CNN3D"}`

2.  **`POST /predict`**
    *   **Purpose:** Runs inference on JSON-provided MRI data (array or base64). Generates an AI summary using the Gemini API if available.
    *   **Payload:** JSON body containing either:
        *   `{"input": [[[...]]], "filename": "optional_name"}` (3D Array)
        *   `{"base64": "<base64_encoded_nii_string>", "filename": "optional_name"}`
    *   **Response:** JSON containing `prediction`, `label`, `confidence`, `filename`, and an optional `ai_summary`.

3.  **`POST /upload`**
    *   **Purpose:** Accepts an uploaded `.nii` file directly via multipart form data for inference. Generates an AI summary using the Gemini API if available.
    *   **Payload:** `multipart/form-data` with a `file` field containing the `.nii` file.
    *   **Response:** JSON containing `prediction`, `label`, `confidence`, `filename`, and an optional `ai_summary`.

4.  **`POST /debug`**
    *   **Purpose:** Debug endpoint that accepts a local `.nii` file path on the server and returns full debugging information from the preprocessing and inference steps.
    *   **Payload:** JSON body `{"file_path": "/path/to/local/file.nii"}`
    *   **Response:** JSON containing `prediction`, `label`, `confidence`, `prob_schizo`, and `filename`.

## Frontend to Backend Connection

The frontend (`/frontend/src/pages/Index.tsx`) connects to the backend using the `fetch` API.

*   **Two endpoints are used:**
    *   `API_UPLOAD_URL = http://127.0.0.1:5000/upload` — used when the user uploads a real `.nii` file.
    *   `API_PREDICT_URL = http://127.0.0.1:5000/predict` — used when the user clicks "Test with Dummy Data".

*   **Implementation Details:**
    *   **Real file upload ("Run AI Scan"):** When a file is selected and the user clicks "Run AI Scan", the actual file is sent to `/upload` via `multipart/form-data`. The backend preprocesses and runs inference on the real MRI data.
    *   **Dummy data ("Test with Dummy Data"):** When no real file is needed, a randomly generated 64×64×64 array is sent to `/predict` as a JSON body `{"input": data, "filename": "dummy_input"}`.
    *   The endpoint shown in the UI footer dynamically reflects which endpoint will be used based on whether a file is loaded.

*   **Expected Response Handling:** Both flows expect a JSON response with `prediction`, `label`, `confidence`, `filename`, and optionally `ai_summary`, which are used to update the `ResultCard` and AI Medical Summary sections in the UI.

## Environment Variables

API keys are stored in `/backend/.env`:

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Groq API key for LLM inference |
| `GEMINI_API_KEY` | Google Gemini API key (optional, for AI summaries) |

> **Note:** Never commit `.env` to version control. Add it to `.gitignore`.
