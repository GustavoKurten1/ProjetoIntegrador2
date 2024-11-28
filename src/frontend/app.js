document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const API_URL = 'http://localhost:3000';

    console.log('DOM loaded'); // Debug log

    // Função para mostrar mensagens de erro
    const showError = (element, message) => {
        console.error('Error:', message); // Debug log
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        element.parentNode.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    };

    // Handler do formulário de login
    if (loginForm) {
        console.log('Login form found'); // Debug log
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted'); // Debug log
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            console.log('Attempting login with:', email); // Debug log (não logue a senha!)

            try {
                console.log('Sending request to:', `${API_URL}/login`); // Debug log
                
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                console.log('Response status:', response.status); // Debug log
                
                const data = await response.json();
                console.log('Response data:', data); // Debug log

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    if (data.user) {
                        localStorage.setItem('userId', data.user.id);
                    }
                    console.log('Login successful, redirecting...'); // Debug log
                    window.location.href = './dashboard/dashboard.html';
                } else {
                    showError(loginForm, data.error || 'Erro ao fazer login');
                }
            } catch (error) {
                console.error('Fetch error:', error); // Debug log
                showError(loginForm, 'Erro ao conectar com o servidor');
            }
        });
    } else {
        console.warn('Login form not found!'); // Debug log
    }
});
