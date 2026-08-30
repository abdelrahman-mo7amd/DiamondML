# Diamond Price Predictor 

![banner](banner.jpg)

### so... how much is that rock actually worth?? 👀

Ngl i was tired of ML projects that go "here's dataset, here's a model, 94% accuracy, peace✌️", and just dip. That is not a project, that's a screenshot.

So i build an actuall little web app that takes a diamond's deets and spits out a real price prediction using machine learning. Not guessing-based, actual math.

So yeah, this is a little web app that takes the details of a diamond and tries to predict its price using machine learning.

basically, you give it the diamond's 4Cs + dimensions, and it does its thing, you get a number (price). That's the whole app.

---

## what does it can do

you throw in: 
- carat: how heavy the lil guy is
- cut: fair, good, very good, premium, ideal (self-explanatory tbh)
- color: D to J, D being basically flawless-invisible, J being "eh"
- clarity: I1 to IF (how clean it is on the inside)
- depth %
- table %
- x, y, z dimensions

Hit predict price and let the model cook

you get back: 
- estimated price based on real math calc
- a price range also not just one number pretending to be certain
- model R² score
- average error (MAE) - so you know how much to trust it
- your carat weight, restated because why not
- diamond volume
- a little quality summary so it doesn't feel like just a number dump

---

## the ML side of things!!!

Model of choice: "LightGPM", fast, solid, with tabular data, doesnot make me wait forever

it have been trained on 53,940 diamonds before, using classic diamonds dataset, nothing fancy, no secret sauce!

``` diamond info -> feature processing -> model comparing -> light GPM -> predicted price ```

nothing magical 
just data + some features + a model trying its best to figure out how diamond prices work lol.

## what actually happend at the start of training and exploring (`main.ipynb`)

before there was an web app, there was a notebook behind, doing the dirty work. here's the whole pipeline, no cap:
1. load the data: the raw Kaggle `diamonds` CSV, straight in with pandas.
2. EDA: checked for nulls, ran `.describe()`, plotted the price in distribution raw log-transformed (price is heavily right-skewed, log fixed that), a correlation heatmap, and average price by cut/color/clarity.
3. cleaning: dropped rows where x/y/z dimensions or price were < 0. Basically 
4. feature eng: add volume (X * Y * Z), `log_Carat`, `log_volume`, and `depth_ratio` (Z relative to the average of X and Y). Little exra signal for the model to chew on.
5. encoding : ordinal-encoded cut, color, clarity in their real quality order (not just alphabetically, that would've been a crime), and saved the encoder for reuse later.
6. train/test split: 80/20, random_state=42, for reproducibility. 
7. model bake-off, ran linear regression, decision tree, random forest, XGBoost, and LightGPM through 5-fold cross-validation and compared R2 scores side by side.
8. picked the winner, the best performaing model got trained on the full training set and evaluted on the helf-out test (r2, rmse, mae, mape), plus actual-vs-predicted and residual/error plots to sanity-check it wasnot just flexing on paper.

spoiler: lightGPM took the W, which is why it's the one running th ewhoe in the app.

--- 
## the actuall app

Frontend: plan HTML / CSS / JS. No framework drama.
Backend: Python + Flask + LightGPM
the frontend just fetches from the Flask API for the dropdown options and to send off predictions. standard stuff.

end points:

GET /options   ---> dropdown values (cut/color/clairy etc.)
GET /api/info  ---> model info / metadata
POST /predict  ---> send diamond details, get a price back

Nothing crazy, just a clean lil API.

---

## running it locally

Clone it: 
```bash
git clone https://github.com/abdelrahman-mo7amd/DiamondML.git
cd diamond-price-predictor
```

Install the stuff it needs:

```bash
pip install -r requirements.txt
```

fire up with the Flask API:
```bash
python api/app.py
```

then just open the frontend and you're locked in.
if you see: 
```
API Offline
```

...that means you forgot to actually start flask. it happens to the best of us 😭

---

## what i actually learnt doing this? 

this whole thing was basically an excuse to figure out what happend when a model escapes the jupyter notebook and has to survive in the real world as an actual app. Learned/Touched:

- data preprocessing 
- machine learning + model evaluation
- lightGPM specifically
- building a flask api
- fetch requests, connecting frontend - backend
turning raw predictions into something human can actually read and use

cuz real talk, a model chilling in a notebook cell isnot a product. you gotta give it a face. a UI. a reason to exist outside of `.ipynb`.

---

## real talk / disclaimer

this is a prediciton, not a diamond-pricing oracle sent from the heavens.
real diamond prices depend on a bunch of stuff this app doesn't even see, certification, retailer markup, market conditions, shape, flourescence, and more. 
so please don't take this number to a jeweler, try to sell your grandma's ring off it, and then come back mad at me. 💀


--- 
# built with

`python, lightGPM, flask, javaScript, html, css`
made with unreasonable amount of coffee and red bulls and some genuinely questionable debugging decisions at 2am ☕

--- 
## if you thought this was kinda cool
feel free to star the repo.
or don't , i am not your dad.
but like... it would be pretty cool 👀