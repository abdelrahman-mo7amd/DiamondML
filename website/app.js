const API = '';

let CUT_ORDER = [];
let COLOR_ORDER = [];
let CLARITY_ORDER = [];

let selected = {
    cut: 'Ideal',
    color: 'E',
    clarity: 'VVS1'
};


async function loadOptions() {
    try {
        const response = await fetch(API + '/options');

        if (!response.ok) {
            throw new Error('API is offline');
        }

        const data = await response.json();

        CUT_ORDER = data.cut;
        COLOR_ORDER = data.color;
        CLARITY_ORDER = data.clarity;

        buildPills('pills-cut', data.cut, 'cut', selected.cut);
        buildPills('pills-color', data.color, 'color', selected.color);
        buildPills('pills-clarity', data.clarity, 'clarity', selected.clarity);
        const infoResponse = await fetch(API + '/api/info');

        if (infoResponse.ok) {
            const modelInfo = await infoResponse.json();

            document.getElementById('badge-txt').textContent =
                modelInfo.model + ' | R²=' + modelInfo.r2_score;

            document.getElementById('foot-model').textContent =
                modelInfo.model;
        }

    } catch (error) {
        document.getElementById('badge-txt').textContent = 'API Offline';
    }
}

function buildPills(containerId, values, field, defaultValue) {

    const container = document.getElementById(containerId);

    container.innerHTML = '';

    values.forEach(function(value) {

        const button = document.createElement('button');

        button.type = 'button';
        button.textContent = value;

        if (value === defaultValue) {
            button.classList.add('selected');
        }

        button.onclick = function() {

            const buttons = container.querySelectorAll('button');

            buttons.forEach(function(button) {
                button.classList.remove('selected');
            });

            button.classList.add('selected');

            selected[field] = value;

            document.getElementById(field).value = value;
        };

        container.appendChild(button);
    });
}


function onSlider(slider) {

    const carat = parseFloat(slider.value);

    document.getElementById('sl-val').textContent =
        carat.toFixed(2) + ' ct';

    const approximateSize = carat * 4.43 + 2.0;

    document.getElementById('x').value =
        approximateSize.toFixed(2);

    document.getElementById('y').value =
        (approximateSize - 0.03).toFixed(2);

    document.getElementById('z').value =
        (carat * 2.73 + 1.2).toFixed(2);

    updateSlider(slider);
}


function updateSlider(slider) {

    const percent =
        (slider.value - slider.min) /
        (slider.max - slider.min) * 100;

    slider.style.background =
        'linear-gradient(to right, #a34d45 ' +
        percent + '%, #c7c0b0 ' +
        percent + '%)';
}


updateSlider(document.getElementById('sl-carat'));


function formatMoney(number) {

    return '$' + Math.round(number).toLocaleString('en-US');
}


function getPercentage(value, order) {

    const index = order.indexOf(value);

    if (index === -1) {
        return 0;
    }

    return Math.round(
        ((index + 1) / order.length) * 100
    );
}


function animateNumber(element, target) {

    const oldNumber =
        parseInt(element.textContent.replace(/\D/g, '')) || 0;

    const startTime = performance.now();

    const duration = 700;

    function update(time) {

        const progress =
            Math.min((time - startTime) / duration, 1);

        const smoothProgress =
            1 - Math.pow(1 - progress, 3);

        const number =
            oldNumber +
            (target - oldNumber) * smoothProgress;

        element.textContent = formatMoney(number);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}


async function predict() {

    const button = document.getElementById('btn');
    const spinner = document.getElementById('spin');
    const buttonText = document.getElementById('btn-txt');
    const errorBox = document.getElementById('err');

    const data = {
        carat: parseFloat(
            document.getElementById('sl-carat').value
        ),

        cut: selected.cut,

        color: selected.color,

        clarity: selected.clarity,

        depth: parseFloat(
            document.getElementById('depth').value
        ),

        table: parseFloat(
            document.getElementById('table').value
        ),

        x: parseFloat(
            document.getElementById('x').value
        ),

        y: parseFloat(
            document.getElementById('y').value
        ),

        z: parseFloat(
            document.getElementById('z').value
        )
    };


    button.disabled = true;

    spinner.style.display = 'block';

    buttonText.textContent = 'Predicting';

    errorBox.style.display = 'none';


    try {

        const response = await fetch(API + '/predict', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(data)
        });


        const result = await response.json();


        if (!response.ok) {
            throw new Error(
                result.error || 'Prediction failed'
            );
        }

        document.getElementById('ph').style.display = 'none';
        document.getElementById('res').style.display = 'block';
        animateNumber(
            document.getElementById('pv'),
            result['Predicted Price']
        );

        document.getElementById('p-lo').textContent =
            formatMoney(result['Price (low)']);

        document.getElementById('p-hi').textContent =
            formatMoney(result['Price (high)']);
        document.getElementById('s-r2').textContent =
            (result['R2 Score'] * 100).toFixed(1) + '%';

        document.getElementById('s-mae').textContent =
            formatMoney(result['MAE']);

        document.getElementById('s-ct').textContent =
            data.carat.toFixed(2) + ' ct';

        document.getElementById('s-vol').textContent =
            (data.x * data.y * data.z).toFixed(1);
        document.getElementById('b-cut').style.width =
            getPercentage(data.cut, CUT_ORDER) + '%';

        document.getElementById('b-col').style.width =
            getPercentage(data.color, COLOR_ORDER) + '%';

        document.getElementById('b-cla').style.width =
            getPercentage(data.clarity, CLARITY_ORDER) + '%';

        document.getElementById('v-cut').textContent =
            data.cut;

        document.getElementById('v-col').textContent =
            data.color;

        document.getElementById('v-cla').textContent =
            data.clarity;


    } catch (error) {

        errorBox.textContent =
            'Something went wrong: ' + error.message;

        errorBox.style.display = 'block';

    } finally {

        button.disabled = false;

        spinner.style.display = 'none';

        buttonText.textContent = 'Predict Price';
    }
}

document.addEventListener('keydown', function(event) {

    if (event.key === 'Enter') {
        predict();
    }

});


loadOptions();