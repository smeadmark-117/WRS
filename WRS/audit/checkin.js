// Wizard State
let currentStep = 'challenge';
let currentLanguage = 'en';
let signaturePad;
let isRepeatDriver = false;
let driverData = {};

// Policy Text
const policyEN = `Please read and check the following load requirements:<br><br>
1. Remove any trash or debris before entering the loading dock. (Please sweep anything into the dock after backing in. Do NOT sweep into the parking lot.)<br>
2. Brakes must be set while in the loading dock.<br>
3. Make sure your tandems are to the back.<br>
4. Your truck is required to stay in the dock until you are told that it is safe to leave!<br><br>
By signing I state that I have read, understood, and agree to comply with these regulations and guidelines.`;

const policyES = `Por favor lea y marque los siguientes requisitos de carga:<br><br>
1. Elimine cualquier basura o escombros antes de ingresar al muelle de carga. (Por favor barra todo hacia el muelle después de retroceder. NO barra hacia el estacionamiento).<br>
2. Los frenos deben estar puestos mientras se encuentre en el muelle de carga.<br>
3. Asegúrese de que sus ejes tándem estén hacia atrás.<br>
4. ¡Se requiere que su camión permanezca en el muelle hasta que se le informe que es seguro salir!<br><br>
Al firmar, declaro que he leído, entendido y acepto cumplir con estas regulaciones y pautas.`;

// Challenge Code
const CHALLENGE_CODE = "organic potatoes";

document.addEventListener('DOMContentLoaded', () => {
    initSignaturePad();
    updateLanguageUI();
    document.getElementById('policy-text').innerHTML = policyEN;
});

function initSignaturePad() {
    const canvas = document.getElementById('signature-pad');
    if (canvas) {
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)'
        });
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    }
}

function resizeCanvas() {
    const canvas = document.getElementById('signature-pad');
    if (canvas) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear();
    }
}

function clearSignature() {
    signaturePad.clear();
}

function setLanguage(lang) {
    currentLanguage = lang;
    updateLanguageUI();
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(lang === 'en' ? 'english' : 'español'));
    });
    document.getElementById('policy-text').innerHTML = (lang === 'en') ? policyEN : policyES;
}

function updateLanguageUI() {
    const elements = document.querySelectorAll('[data-en]');
    elements.forEach(el => {
        el.innerText = el.getAttribute(`data-${currentLanguage}`);
    });
}

function goToStep(stepId) {
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.remove('active');
    });
    const target = document.getElementById(`step-${stepId}`);
    if (target) {
        target.classList.add('active');
        currentStep = stepId;
    }
    document.getElementById('checkin-wizard').scrollIntoView({ behavior: 'smooth' });
}

function validateChallenge() {
    const code = document.getElementById('challenge-code').value.trim().toLowerCase();
    if (code === CHALLENGE_CODE) {
        goToStep('language');
    } else {
        alert(currentLanguage === 'en' ? 'Incorrect challenge code.' : 'Código de seguridad incorrecto.');
    }
}

function showRepeatLookup(repeat) {
    isRepeatDriver = repeat;
    if (repeat) {
        goToStep('lookup');
    } else {
        showNewDriverForm();
    }
}

function showNewDriverForm() {
    isRepeatDriver = false;
    document.getElementById('driver-name').value = '';
    document.getElementById('truck-name').value = '';
    document.getElementById('driver-phone').value = '';
    document.getElementById('trailer-license').value = '';
    document.getElementById('trailer-state').value = '';
    document.getElementById('destination').value = '';
    goToStep('info');
}

async function lookupDriver() {
    const phone = document.getElementById('lookup-phone').value.trim();
    if (!phone) {
        alert(currentLanguage === 'en' ? 'Please enter your phone number.' : 'Por favor ingrese su número de teléfono.');
        return;
    }

    try {
        const response = await fetch(`/api/lookup-driver?phone=${encodeURIComponent(phone)}`);
        const data = await response.json();

        if (data.found) {
            driverData = data.driver;
            document.getElementById('driver-name').value = driverData.Name || '';
            document.getElementById('truck-name').value = driverData['Name on Truck'] || '';
            document.getElementById('driver-phone').value = driverData['Cell #'] || phone;
            document.getElementById('trailer-license').value = driverData['Trailer License'] || '';
            document.getElementById('trailer-state').value = driverData['State'] || '';
            
            // Auto-fill destination only if crew has put one in the master record
            if (driverData['Destination']) {
                document.getElementById('destination').value = driverData['Destination'];
            } else {
                document.getElementById('destination').value = '';
            }

            goToStep('info');
        } else {
            alert(currentLanguage === 'en' ? 'Driver not found. Please register as a new driver.' : 'Conductor no encontrado. Por favor regístrese como nuevo conductor.');
            showNewDriverForm();
        }
    } catch (error) {
        console.error('Lookup error:', error);
        alert('Error looking up driver. Please try again or continue as a new driver.');
    }
}

function validatePolicy() {
    const trash = document.getElementById('policy-trash').checked;
    const brakes = document.getElementById('policy-brakes').checked;
    const tandems = document.getElementById('policy-tandems').checked;
    const stay = document.getElementById('policy-stay').checked;

    if (trash && brakes && tandems && stay) {
        // Check if signature is needed
        let needsSignature = true;
        if (isRepeatDriver && driverData['Signature File'] && driverData['Signature Captured Date']) {
            const sigDate = new Date(driverData['Signature Captured Date']);
            const now = new Date();
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const sigQuarter = Math.floor(sigDate.getMonth() / 3);
            const sameYear = now.getFullYear() === sigDate.getFullYear();
            
            if (sameYear && currentQuarter === sigQuarter) {
                needsSignature = false;
            }
        }

        if (needsSignature) {
            goToStep('signature');
        } else {
            submitCheckin();
        }
    } else {
        alert(currentLanguage === 'en' ? 'You must acknowledge all load requirements.' : 'Debe reconocer todos los requisitos de carga.');
    }
}

async function submitCheckin() {
    const submission = {
        name: document.getElementById('driver-name').value,
        truckName: document.getElementById('truck-name').value,
        phone: document.getElementById('driver-phone').value,
        trailerLicense: document.getElementById('trailer-license').value,
        trailerState: document.getElementById('trailer-state').value,
        pickupNum: document.getElementById('pickup-num').value,
        destination: document.getElementById('destination').value,
        isRepeatDriver: isRepeatDriver,
        repeatDriverId: driverData.id || null,
        policyTrash: document.getElementById('policy-trash').checked,
        policyBrakes: document.getElementById('policy-brakes').checked,
        policyTandems: document.getElementById('policy-tandems').checked,
        policyStay: document.getElementById('policy-stay').checked,
        signature: signaturePad ? (signaturePad.isEmpty() ? null : signaturePad.toDataURL()) : null
    };

    if (!submission.pickupNum || !submission.destination) {
        alert(currentLanguage === 'en' ? 'Please fill in all required fields.' : 'Por favor complete todos los campos obligatorios.');
        goToStep('pickup');
        return;
    }

    if (currentStep === 'signature' && signaturePad.isEmpty()) {
        alert(currentLanguage === 'en' ? 'Please provide your signature.' : 'Por favor proporcione su firma.');
        return;
    }

    try {
        const response = await fetch('/api/submit-checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission)
        });

        if (response.ok) {
            goToStep('success');
        } else {
            const err = await response.json();
            alert(`Error: ${err.message || 'Submission failed'}`);
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting check-in. Please try again.');
    }
}
