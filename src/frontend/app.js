const API_URL = 'http://localhost:3000';

// Elementos DOM
const mainContent = document.getElementById('mainContent');
const navLinks = document.getElementById('navLinks');
const userMenu = document.getElementById('userMenu');

// Funções de navegação
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    
    // Adiciona a página ao histórico do navegador
    const state = { pageId: pageId };
    history.pushState(state, '', `#${pageId}`);
}

// Função para mostrar mensagens
function showMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    messageContainer.appendChild(messageElement);
    setTimeout(() => messageElement.remove(), 3000);
}

// Função para mostrar menu do usuário
function showUserMenu() {
    navLinks.classList.add('hidden');
    userMenu.classList.remove('hidden');
    loadUserBalance();
}

// Função para carregar saldo do usuário
async function loadUserBalance() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/getUserBalance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('userBalance').textContent = `Saldo: R$ ${data.balance.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Erro ao carregar saldo:', error);
    }
}

// Handlers de autenticação
async function handleSignup(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                birthDate: formData.get('birthDate')
            })
        });

        if (response.ok) {
            showMessage('Cadastro realizado com sucesso!', 'success');
            showPage('loginPage');
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            showUserMenu();
            showPage('mainMenuPage');
            await loadUserBalance();
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleCreateEvent(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = localStorage.getItem('token');

    try {
        const startDateInput = formData.get('startDate');
        const endDateInput = formData.get('endDate');

        if (!startDateInput || !endDateInput) {
            showMessage('Por favor, preencha todas as datas', 'error');
            return;
        }

       
        const formatDateForMySQL = (dateString) => {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:00`;
        };

        const response = await fetch(`${API_URL}/addNewEvent`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: formData.get('title'),
                description: formData.get('description'),
                bettingStartDate: formatDateForMySQL(startDateInput),
                bettingEndDate: formatDateForMySQL(endDateInput),
                eventDate: formatDateForMySQL(endDateInput) 
            })
        });

        if (response.ok) {
            showMessage('Evento criado com sucesso! Aguardando aprovação.', 'success');
            showPage('mainMenuPage');
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Função para verificar autenticação
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showPage('loginPage');
        return false;
    }
    return true;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona listener para o botão voltar do navegador
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.pageId) {
            document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
            document.getElementById(event.state.pageId).classList.remove('hidden');
            
            // Recarrega os eventos se estiver na página de eventos
            if (event.state.pageId === 'eventsPage') {
                const status = document.getElementById('statusFilter').value;
                loadEvents(status);
            }
        }
    });

    // Configura a página inicial baseada na URL ou estado padrão
    const hash = window.location.hash.slice(1);
    const token = localStorage.getItem('token');
    
    if (hash && document.getElementById(hash)) {
        showPage(hash);
    } else if (token) {
        showPage('mainMenuPage');
        showUserMenu();
        loadUserBalance();
    } else {
        showPage('loginPage');
    }

    // Adiciona listeners para os botões
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        navLinks.classList.remove('hidden');
        userMenu.classList.add('hidden');
        showPage('loginPage');
    });
    document.getElementById('createEventForm').addEventListener('submit', handleCreateEvent);
    document.getElementById('bettingForm').addEventListener('submit', handleBetting);
    
    // Modifique o listener do menu de apostas
    document.querySelector('.menu-item[onclick="showPage(\'eventsPage\')"]').addEventListener('click', () => {
        showPage('eventsPage');
        const status = document.getElementById('statusFilter').value;
        loadEvents(status);
    });

    document.querySelector('.menu-item[onclick="showPage(\'deleteEventPage\')"]').addEventListener('click', () => {
        showPage('deleteEventPage');
        loadMyEvents();
    });
}); 

async function loadEventDetails(eventId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/getEvent/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const event = await response.json();
            const eventDetails = document.getElementById('eventDetails');
            eventDetails.innerHTML = `
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <p>Data do Evento: ${new Date(event.eventDate).toLocaleString()}</p>
                <p>Apostas até: ${new Date(event.bettingEndDate).toLocaleString()}</p>
            `;
            showPage('bettingPage');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleBetting(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = localStorage.getItem('token');
    const eventId = localStorage.getItem('currentEventId');

    try {
        const response = await fetch(`${API_URL}/placeBet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                eventId: Number(eventId),
                amount: Number(formData.get('amount')),
                prediction: formData.get('prediction')
            })
        });

        if (response.ok) {
            showMessage('Aposta realizada com sucesso!', 'success');
            showPage('eventsPage');
            await loadUserBalance();
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Função para filtrar eventos
function filterEvents() {
    const status = document.getElementById('statusFilter').value;
    loadEvents(status);
}

// Função para carregar eventos
async function loadEvents(status = '') {
    const token = localStorage.getItem('token');
    try {
        let url = `${API_URL}/getEvents`;
        if (status) {
            url += `?status=${status}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const events = await response.json();
            const eventsList = document.getElementById('eventsList');
            
            if (events.length === 0) {
                eventsList.innerHTML = '<p class="no-events">Nenhum evento encontrado com este status.</p>';
                return;
            }

            const formatDate = (dateString) => {
                if (!dateString) return 'Não definida';
                try {
                    // Converte a string de data do MySQL para objeto Date
                    const date = new Date(dateString);
                    
                    // Verifica se a data é válida
                    if (isNaN(date.getTime())) {
                        console.error('Data inválida:', dateString);
                        return 'Data inválida';
                    }

                    // Formata a data no padrão brasileiro
                    return date.toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZone: 'America/Sao_Paulo' // Adiciona o timezone correto
                    });
                } catch (error) {
                    console.error('Erro ao formatar data:', error);
                    return 'Data inválida';
                }
            };

            eventsList.innerHTML = events.map(event => `
                <div class="event-card">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <p class="event-status">Status: ${event.status}</p>
                    <p>Data do Evento: ${formatDate(event.eventDate)}</p>
                    <p>Período de Apostas: ${formatDate(event.bettingStartDate)} até ${formatDate(event.bettingEndDate)}</p>
                    ${event.status === 'APPROVED' ? 
                        `<button onclick="startBetting(${event.id})">Apostar</button>` : 
                        '<span class="event-status">Não disponível para apostas</span>'}
                </div>
            `).join('');
        }
    } catch (error) {
        showMessage('Erro ao carregar eventos', 'error');
    }
}

async function startBetting(eventId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/getEvent/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const event = await response.json();
            localStorage.setItem('currentEventId', eventId);
            
            const formatDate = (dateString) => {
                if (!dateString) return 'Não definida';
                try {
                    // Converte a string ISO para objeto Date
                    const date = new Date(dateString);
                    
                    // Ajusta o timezone para Brasil
                    date.setHours(date.getHours() - 3);
                    
                    // Verifica se a data é válida
                    if (isNaN(date.getTime())) {
                        console.log('Data inválida recebida:', dateString);
                        return 'Data inválida';
                    }

                    // Formata a data no padrão brasileiro
                    return date.toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                } catch (error) {
                    console.error('Erro ao formatar data:', error);
                    return 'Data inválida';
                }
            };
            
            const eventDetails = document.getElementById('eventDetails');
            eventDetails.innerHTML = `
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <p>Data do Evento: ${formatDate(event.eventDate)}</p>
                <p>Apostas até: ${formatDate(event.bettingEndDate)}</p>
            `;
            showPage('bettingPage');
        }
    } catch (error) {
        showMessage('Erro ao carregar detalhes do evento', 'error');
    }
}

// Adicione a função de filtro
function filterEvents() {
    const status = document.getElementById('statusFilter').value;
    loadEvents(status);
}

// Função para carregar eventos do usuário
async function loadMyEvents(status = '') {
    const token = localStorage.getItem('token');
    try {
        let url = `${API_URL}/getMyEvents`;
        if (status) {
            url += `?status=${status}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const events = await response.json();
            const myEventsList = document.getElementById('myEventsList');
            
            if (events.length === 0) {
                myEventsList.innerHTML = '<p class="no-events">Nenhum evento encontrado.</p>';
                return;
            }

            myEventsList.innerHTML = events.map(event => `
                <div class="event-card">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <p class="event-status">Status: ${event.status}</p>
                    <p>Data do Evento: ${formatDate(event.eventDate)}</p>
                    <p>Período de Apostas: ${formatDate(event.bettingStartDate)} até ${formatDate(event.bettingEndDate)}</p>
                    <button onclick="deleteEvent(${event.id})" class="delete-btn">Deletar Evento</button>
                </div>
            `).join('');
        }
    } catch (error) {
        showMessage('Erro ao carregar eventos', 'error');
    }
}

// Função para filtrar eventos do usuário
function filterMyEvents() {
    const status = document.getElementById('deleteStatusFilter').value;
    loadMyEvents(status);
}

// Função para deletar evento
async function deleteEvent(eventId) {
    if (!confirm('Tem certeza que deseja deletar este evento?')) {
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/deleteEvent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventId })
        });

        if (response.ok) {
            showMessage('Evento deletado com sucesso!', 'success');
            loadMyEvents(); // Recarrega a lista
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
} 