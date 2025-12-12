// script.js
// This file can be used for any interactive elements or client-side logic.

document.addEventListener('DOMContentLoaded', () => {
    // Example: Simple logic for a potential "At Capacity" status toggle (for demonstration)
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-indicator span:last-child');

    // This is a static simulation. In a real app, this would come from an API.
    const isAtCapacity = false; // Change to true to see 'At Capacity' state

    if (isAtCapacity) {
        if (statusDot) {
            statusDot.classList.remove('status-green');
            statusDot.classList.add('status-red');
        }
        if (statusText) {
            statusText.textContent = 'At Capacity / Busy';
            statusText.style.color = 'var(--color-deep-red)'; // Apply red color from CSS variable
        }
    }

    // Audit Page Gatekeeper Logic
    const auditPasswordGate = document.getElementById('auditPasswordGate');
    const auditPasswordInput = document.getElementById('auditPassword');
    const auditSubmitButton = document.getElementById('auditSubmit');
    const auditMessage = document.getElementById('auditMessage');
    const auditDashboard = document.getElementById('auditDashboard');

    if (auditSubmitButton && auditPasswordInput && auditMessage && auditDashboard) {
        auditSubmitButton.addEventListener('click', () => {
            const enteredPassword = auditPasswordInput.value;
            const correctPassword = 'Potatoes1'; // Placeholder password

            if (enteredPassword === correctPassword) {
                auditDashboard.style.display = 'block';
                auditPasswordGate.style.display = 'none';
            } else {
                auditMessage.style.display = 'block';
            }
        });
    }
});

