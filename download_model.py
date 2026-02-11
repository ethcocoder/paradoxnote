import os
import urllib.request

model_id = "Xenova/whisper-tiny.en"
base_url = f"https://huggingface.co/{model_id}/resolve/main/"

files = [
    "config.json",
    "generation_config.json",
    "tokenizer_config.json",
    "tokenizer.json",
    "preprocessor_config.json",
    "onnx/encoder_model_quantized.onnx",
    "onnx/decoder_model_merged_quantized.onnx"
]

dest_dir = "public/models/whisper-tiny-en"

def download_file(rel_path):
    url = base_url + rel_path
    target_path = os.path.join(dest_dir, rel_path)
    
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    print(f"Downloading {url} to {target_path}...")
    try:
        urllib.request.urlretrieve(url, target_path)
        print(f"Done.")
    except Exception as e:
        print(f"Failed to download {rel_path}: {e}")

if __name__ == "__main__":
    for f in files:
        download_file(f)
