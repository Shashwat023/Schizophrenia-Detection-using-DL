from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn.functional as F
import numpy as np
import nibabel as nib
import os
import base64
import traceback
from dotenv import load_dotenv
from PIL import Image

# Load environment variables from .env
load_dotenv()

# Groq setup
try:
    from groq import Groq
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if GROQ_API_KEY:
        groq_client = Groq(api_key=GROQ_API_KEY)
        GROQ_AVAILABLE = True
    else:
        groq_client = None
        GROQ_AVAILABLE = False
except ImportError:
    groq_client = None
    GROQ_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# Load model
from model import CNN3D
model = CNN3D(input_shape=(1, 64, 64, 64))
model.load_state_dict(torch.load("model.pth", map_location="cpu", weights_only=False))
model.eval()

def preprocess_nii_exact(nii_path_or_array):
    """
    Preprocess NIfTI file or array for model inference
    """

    # Load .nii file or use array
    if isinstance(nii_path_or_array, str):
        ext = os.path.splitext(nii_path_or_array)[1].lower()
        if ext in ['.png', '.jpg', '.jpeg']:
            img_2d = Image.open(nii_path_or_array).convert('L')  # Convert to grayscale
            img_2d = img_2d.resize((64, 64))
            img_2d = np.array(img_2d)
            # Stack 2D image to create a 3D volume (64, 64, 64)
            img = np.repeat(img_2d[:, :, np.newaxis], 64, axis=2)
        else:
            img = nib.load(nii_path_or_array).get_fdata()
    else:
        img = np.array(nii_path_or_array)

    # Handle NaN values
    img = np.nan_to_num(img)

    # Normalize: (img - mean) / (std + 1e-5)
    mean_val = np.mean(img)
    std_val = np.std(img) + 1e-5
    img = (img - mean_val) / std_val

    # Convert to tensor + add channel dim -> (1, D, H, W)
    img = torch.tensor(img, dtype=torch.float32).unsqueeze(0)

    # Resize to (64,64,64) if needed
    if img.shape[1:] != (64, 64, 64):
        img = F.interpolate(img.unsqueeze(0), size=(64, 64, 64),
                            mode='trilinear', align_corners=False)
        img = img.squeeze(0)

    # Add batch dim -> (1, 1, 64, 64, 64)
    img = img.unsqueeze(0)

    return img


def generate_groq_summary(label, confidence):
    """
    Generate a medical summary using the Groq API (llama3-8b-8192).
    """
    if not GROQ_AVAILABLE or not groq_client:
        return None

    try:
        prompt = f"""Given the MRI classification result:
Prediction: {label}
Confidence: {confidence:.2%}

Generate a concise medical-style report. Format as JSON only, no extra text:
{{
  "summary": "2-3 line clinical summary",
  "key_takeaways": ["point 1", "point 2", "point 3"],
  "next_steps": ["step 1", "step 2"]
}}"""

        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
        )
        result = chat_completion.choices[0].message.content
        import json
        try:
            return json.loads(result)
        except Exception:
            return result
    except Exception:
        return None


def run_model_on_file(file_path: str) -> tuple[int, str, float]:
    """
    Run the CNN3D model on the given file and return predictions.
    Works with .nii, .png, .jpg files (via preprocess_nii_exact).

    Returns:
        (pred: int, label: str, confidence: float)
    """
    input_tensor = preprocess_nii_exact(file_path)
    with torch.no_grad():
        output = model(input_tensor)
    probabilities = F.softmax(output, dim=1)
    pred_class = output.argmax(dim=1).item()
    prob_schizo = probabilities[0][1].item()
    label = "Schizophrenia (Affected)" if pred_class == 1 else "Healthy (Control)"
    confidence = prob_schizo if pred_class == 1 else (1 - prob_schizo)
    return int(pred_class), label, round(confidence, 4)


def _run_model_on_array(input_array) -> tuple[int, str, float]:
    """
    Run the CNN3D model on a raw 3D array (from the /predict JSON endpoint).

    Returns:
        (pred: int, label: str, confidence: float)
    """
    img = np.array(input_array, dtype=np.float32)

    # Apply same preprocessing as preprocess_nii_exact
    img = np.nan_to_num(img)
    mean_val = np.mean(img)
    std_val = np.std(img) + 1e-5
    img = (img - mean_val) / std_val

    tensor = torch.tensor(img, dtype=torch.float32).unsqueeze(0)  # (1, D, H, W)
    if tensor.shape[1:] != (64, 64, 64):
        tensor = F.interpolate(tensor.unsqueeze(0), size=(64, 64, 64),
                               mode='trilinear', align_corners=False).squeeze(0)
    tensor = tensor.unsqueeze(0)  # (1, 1, 64, 64, 64)

    with torch.no_grad():
        output = model(tensor)
    probabilities = F.softmax(output, dim=1)
    pred_class = output.argmax(dim=1).item()
    prob_schizo = probabilities[0][1].item()
    label = "Schizophrenia (Affected)" if pred_class == 1 else "Healthy (Control)"
    confidence = prob_schizo if pred_class == 1 else (1 - prob_schizo)
    return int(pred_class), label, round(confidence, 4)


@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status": "API running",
        "model": "CNN3D",
        "groq_available": GROQ_AVAILABLE
    })


@app.route("/upload", methods=["POST"])
def upload():
    """Upload endpoint: accepts .nii/.jpg/.png file as multipart form data"""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    f = request.files["file"]
    filename = f.filename or "upload.nii"

    # Save to temp file
    tmp_path = os.path.join("tmp_uploads", filename)
    os.makedirs("tmp_uploads", exist_ok=True)
    f.save(tmp_path)

    try:
        pred, label, confidence = run_model_on_file(tmp_path)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Model inference failed: {str(e)}"}), 500
    finally:
        # Cleanup temp file after inference
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    # Groq summary
    ai_summary = generate_groq_summary(label, confidence)

    response = {
        "prediction": pred,
        "label": label,
        "confidence": round(confidence, 4),
        "filename": filename
    }
    if ai_summary:
        response["ai_summary"] = ai_summary

    return jsonify(response)


@app.route("/predict", methods=["POST"])
def predict():
    """JSON predict endpoint: accepts array or base64 .nii data"""
    data = request.json
    if not data:
        return jsonify({"error": "No JSON data"}), 400

    input_data = None
    filename = "unknown"
    tmp_path = None

    if "input" in data:
        input_data = data["input"]
        filename = data.get("filename", "array_input")
    elif "base64" in data:
        filename = data.get("filename", "nii_base64")
        nii_bytes = base64.b64decode(data["base64"])
        tmp_path = os.path.join("tmp_uploads", filename)
        os.makedirs("tmp_uploads", exist_ok=True)
        with open(tmp_path, "wb") as f:
            f.write(nii_bytes)
        input_data = tmp_path
    else:
        return jsonify({"error": "Missing 'input' (3D array) or 'base64' field"}), 400

    try:
        if isinstance(input_data, str):
            pred, label, confidence = run_model_on_file(input_data)
        else:
            pred, label, confidence = _run_model_on_array(input_data)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Model inference failed: {str(e)}"}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    # Groq summary
    ai_summary = generate_groq_summary(label, confidence)

    response = {
        "prediction": pred,
        "label": label,
        "confidence": round(confidence, 4),
        "filename": filename
    }
    if ai_summary:
        response["ai_summary"] = ai_summary

    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=False, port=5000)