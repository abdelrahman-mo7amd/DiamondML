from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib 
import json
import numpy as np
import pandas as pd
import os


app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, '..', 'model')

print('Loading model artifacts...')

model = joblib.load(os.path.join(MODEL_DIR, 'diamond_model.pkl'))
encoder = joblib.load(os.path.join(MODEL_DIR, 'ordinal_encoder.pkl'))

with open(os.path.join(MODEL_DIR, 'metadata.json')) as f:
    meta = json.load(f)

with open(os.path.join(MODEL_DIR, 'feature_names.json')) as f:
    features = json.load(f)

COL_CARAT = meta['col_carat']
COL_CUT = meta['col_cut']
COL_COLOR = meta['col_color']
COL_CLARITY = meta['col_clarity']
COL_DEPTH = meta['col_depth']
COL_TABLE = meta['col_table']
COL_X = meta['col_x']
COL_Y = meta['col_y']
COL_Z = meta['col_z']

model_name = meta['model_name']
r2_score_val = meta['r2_score']
mae_price_val = meta['mae_price']
training_rows_val = meta['training_rows']

print(f'Model Loaded: {model_name}')
print(f'R2 Score: {r2_score_val}')
print(f'MAE: ${mae_price_val:,.0f}')
print(f'Features: {len(features)}')

def build_features(data:dict) -> pd.DataFrame:
    """Enter simple api keys (carat, cut, color, etc.) and returns
    a DataFrame with all engineered features the model needs."""

    carat = float(data['carat'])
    depth = float(data['depth'])
    table = float(data['table'])
    x = float(data['x'])
    y = float(data['y'])
    z = float(data['z'])
    cut = str(data['cut']).strip()
    color = str(data['color']).strip()
    clarity = str(data['clarity']).strip()

    volume = x * y * z
    log_carat = np.log1p(carat)
    log_volume = np.log1p(volume)
    depth_ratio = z / ((x + y) / 2 + 1e-9)

    cats = encoder.transform([[cut, color, clarity]])
    cut_enc, color_enc, clarity_enc = float(cats[0][0]), float(cats[0][1]), float(cats[0][2])

    row = {
        'Carat(Weight of Daimond)': carat,
        'log_carat': log_carat,
        'Depth': depth,
        'Table': table,
        'X(length)': x,
        'Y(width)': y,
        'Z(Depth)': z,
        'volume': volume,
        'log_volume': log_volume,
        'depth_ratio': depth_ratio,
        'cut_enc': cut_enc,
        'color_enc': color_enc,
        'clarity_enc': clarity_enc
    }

    return pd.DataFrame([{f: row[f] for f in features}])

required_fields = ['carat', 'cut', 'color', 'clarity', 'depth', 'table', 'x', 'y', 'z']

def validate(data:dict):
    missing = [f for f in required_fields if f not in data]
    if missing: 
        return f'Missing fields: {missing}'
    
    try:
        carat = float(data['carat'])
        if not (0.1 <= carat <= 10.0):
            return 'Carat must be between 0.1 and 10.0'
        depth = float(data['depth'])
        if not (40.0 <= depth <= 85.0):
            return 'Depth % must be between 40 and 85'
        table = float(data['table'])
        if not (40.0 <= table <= 100.0):
            return 'Table % must be between 40 and 100'
        for dim in ['x', 'y', 'z']:
            if float(data[dim]) <= 0:
                return f'{dim} must be greater than 0'
    except (ValueError, TypeError) as e: 
        return f'Invalid number: {e}'
    
    if data['cut'] not in meta['cut_options']:
        return f"Invalid cut '{data['cut']}'. Valid: {meta['cut_options']}"
    if data['color'] not in meta['color_options']:
        return f"Invalid color '{data['color']}'. Valid: {meta['color_options']}"
    if data['clarity'] not in meta['clarity_options']:
        return f"Invalid clarity '{data['clarity']}'. Valid: {meta['clarity_options']}"
    
    
    return None


@app.route('/')
def index():
    return jsonify({
        'status': 'online',
        'model': meta['model_name'],
        'r2_score': meta['r2_score'],
        'mae': meta['mae_price'],
        'mape': meta['mape'],
        'trained_on': f"{meta['training_rows']:,} diamonds",
        'endpoints': ['/predict', '/options', '/health']
    })

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/options')
def options():
    return jsonify({
        'cut': meta['cut_options'],
        'color': meta['color_options'],
        'clarity': meta['clarity_options']
    })

@app.route('/predict', methods=['POST'])
def predict():
    try: 
        data = request.get_json(silent=True)
        print('Raw request body: ', request.data)
        print('Content-Type header:', request.content_type)
        print('Parsed JSON: ', data)
        print('Type of parsed data: ', type(data))
        if isinstance(data, dict):
            print('Keys recieved: ', list(data.keys()))
        
        if data is None:
            return jsonify({
                'error': 'No valid JSON Recieved. check that Content-Type is application/json.',
                'raw_body': request.data.decode('utf-8', errors='replace')[:300]
            }), 400
        
        if not isinstance(data, dict):
            return jsonify({
                'error': f'Expected a JSON object, got {type(data).__name__}',
                'recieved': data
            }), 400
        
        err = validate(data)

        if err:
            return jsonify({'error': err, 'keys_recieved': list(data.keys())}), 400
        
        X_input = build_features(data)
        log_pred = float(model.predict(X_input)[0])
        price = float(np.expm1(log_pred))

        mae = meta['mae_price']
        price_low = max(0.0, price-mae)
        price_high = price + mae

        return jsonify({
            'Predicted Price': round(price),
            'Price (low)': round(price_low),
            'Price (high)': round(price_high),
            'Model': meta['model_name'],
            'R2 Score': meta['r2_score'],
            'MAPE': meta['mape'],
            'MAE': round(mae)
        })
    
    except KeyError as e: 
        return jsonify({
            'error': f'Missing key in data: {str(e)}',
            'required_fields': required_fields
        }), 400
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server Error: {str(e)}'}), 500
    
if __name__ == '__main__':
    print('\nDiamond Price API -> http://localhost:5000\n')
    app.run(debug=True, host='0.0.0.0', port=5000)