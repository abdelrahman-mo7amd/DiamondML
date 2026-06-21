# Diamond Price Predictor

"How much is this diamond worth?" | every jeweler, ever, right before quoting you a number that may or may not be made up.

A full end-to-end Machine Learning project that predicts diamond prices from their physical specs: carat, cut, color, clarity, and dimensions. With 99.3% accuracy (R2 = 0.9931). Built from raw CSV to a deployed, interactive website, with zero crystals harmed in the process.

This is not a toy demo. This is a real ML pipeline, cleaning data, engineering features, five models cross-validated and benchmarked against each other in a fair fight, the winner deployed behind a REST API, and a frontend pretty enough that you'll actually want to show it to people.

---

### What this project actually does?
You give it: 
- **Carat** (how big "size")
- **Cut** (how well-proportioned - Fair to Ideal)
- **Color** (how colorless - J to D, yes D is better than A, diamonds don't follow normal alphabet rules)
- **Clarity** (how flawless - I1 to IF)
- **Depth %, Table %** (proportions that affect sparkle)
- **X, Y, Z** (physical dimensions in mm)

It gives you back: 
- A predicted market price in **under 50 milliseconds!!!:)**
- A confidence range (because even a 99.3% R2 Model isn't a psychic)
- A visual quality breakdown so you can see *why* the price is what it is

No human jeweler required. No squinting through a loupe. Just math, doing what math does best | judging your rocks.

---
## Architecture -> The three-act structure
### The notebook (jupyter + sklearn): 
Where the model is born, trained, and judged.

### The API (flask + joblib):
Where the model lives and answers questions.

### The website (html + css + js):
Where humans actually use the thing


---

## The numbers (because nothing says "trust me" like metrics): 

```
Trained on: 53,940 diamonds (minus 20 cleaned-out impossible ones)
Features used: 13 (9 raw + 4 engineered)
Best model: LightGBM
R2 Score: 0.9931
RMSE: $519.95
MAE: $257.47
MAPE: 6.02%
Price range covered: $326 - $18,823
```

In plain english: give it a diamond's specs, and on average, it'll be within about **$257** of the real price. For a market where prices range from $326 to nearly $19,000, that's a genuinely strong model | not "good for a school project" strong, "could plausibly be used by an actual jeweler" strong.

---

## Running:
```bash
# Install dependencies:
pip install -r requirements.txt

# train the model
jupyter notebook notebooks/diamond_ml_pipeline.ipynb

# Start the API
cd api
python app.py

# Serve the website (don't just double-click the html - browsers get cranky about that)
cd website
python -m http.server 8000
```

Then open `http://localhost:8000`, make sure Flaskk is humming along on port 5000, and start pricing imaginary diamonds yo your heart's content.

You can try the API by Postman requests or using this curl command 
```bash
curl -X POST http://localhost:5000/predict -H "Content-Type: application/json" -d "{\"carat\":1.0,\"cut\":\"Ideal\",\"color\":\"E\",\"clarity\":\"VVS1\",\"depth\":61.5,\"table\":55,\"x\":6.5,\"y\":6.5,\"z\":4.0}"
```

---

## Tech Stack
- **Data and Modeling:** pandas, NumPy, scikit-learn, XGBoost, LightGBM
- **Visualization:** seaborn
- **Backend:** Flask
- **Frontend:** HTML, CSS, JavaScript

---
## What this project demonstrates
 
- A complete ML pipeline, not a Kaggle-notebook-and-stop situation
- Proper feature engineering reasoning
- Real model comparison with cross-validation, not "I picked the first one that ran"
- A production-style REST API with validation and error handling
- A frontend that doesn't look like it was built to satisfy a rubric
- The patience of a saint, demonstrated through extensive and very real debugging


---
 
*Built with Python, patience, and a healthy respect for what 0.04% of "removed outlier rows" can do to a perfectly good Tuesday.*