document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/checkRole`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            window.isModerator = data.role === 'MODERATOR';
        }
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
    }

    await loadWalletBalance();
});

async function searchEventsByStatus() {
    const token = localStorage.getItem('token');
    const statusFilter = document.getElementById('statusFilter').value;
    const API_URL = 'http://localhost:3000';

    if (!statusFilter) {
        alert('Por favor, selecione um status');
        return;
    }

    try {
        const url = new URL(`${API_URL}/getEvents`);
        url.searchParams.append('status', statusFilter);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar eventos');
        }

        const events = await response.json();
        console.log(events)
        displayEvents(events);
    } catch (error) {
        alert('Erro ao buscar eventos');
        console.error(error);
    }
}

function displayEvents(events) {
    const eventsListDiv = document.getElementById('eventsList');
    eventsListDiv.innerHTML = '';

    if (!Array.isArray(events) || events.length === 0) {
        eventsListDiv.innerHTML = '<p class="no-events">Nenhum evento encontrado</p>';
        return;
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        
        eventCard.innerHTML = `
            <h3>${event.title}</h3>
            <p class="event-description">${event.description}</p>
            <div class="event-details">
                <p><strong>Status:</strong> ${event.status}</p>
                <p><strong>Data do Evento:</strong> ${formatDate(event.event_date)}</p>
                <p><strong>Período de Apostas:</strong></p>
                <p>Início: ${formatDate(event.betting_start_date)}</p>
                <p>Fim: ${formatDate(event.betting_end_date)}</p>
            </div>
            ${event.status === 'APPROVED' && !window.isModerator ? `
                <div class="bet-button">
                    <button onclick="showBetModal(${event.id})" class="approve-button">Apostar</button>
                </div>
            ` : ''}
        `;
        
        eventsListDiv.appendChild(eventCard);
    });
}

function goBack() {
    window.location.href = 'dashboard.html';
}

async function loadWalletBalance() {
    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:3000';

    try {
        const response = await fetch(`${API_URL}/getWalletBalance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            updateBalanceDisplay(0);
            return;
        }

        const data = await response.json();
        updateBalanceDisplay(data.balance || 0);
    } catch (error) {
        console.error('Erro ao carregar saldo:', error);
        updateBalanceDisplay(0);
    }
}

function updateBalanceDisplay(balance) {
    const balanceElement = document.getElementById('walletBalance');
    if (balanceElement) {
        const numericBalance = Number(balance) || 0;
        balanceElement.textContent = `Saldo: R$ ${numericBalance.toFixed(2).replace('.', ',')}`;
    }
}

let currentEventId = null;

function showBetModal(eventId) {
    currentEventId = eventId;
    const modal = document.getElementById('betModal');
    modal.style.display = 'block';
}

function closeBetModal() {
    const modal = document.getElementById('betModal');
    modal.style.display = 'none';
    document.getElementById('betForm').reset();
    currentEventId = null;
}

async function handleBet(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const amount = parseFloat(document.getElementById('betAmount').value);
    const choice = document.querySelector('input[name="choice"]:checked').value === "true";
    
    const betData = {
        eventId: currentEventId,
        amount: amount,
        choice: choice
    };

    console.log('Enviando aposta:', betData);

    try {
        const response = await fetch(`${API_URL}/betOnEvent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(betData)
        });

        console.log('Status da resposta:', response.status);

        const data = await response.json();
        console.log('Resposta do servidor:', data);

        if (response.ok) {
            alert('Aposta realizada com sucesso!');
            closeBetModal();
            await loadWalletBalance();
            await searchEventsByStatus();
        } else {
            alert(data.error || 'Erro ao realizar aposta');
        }
    } catch (error) {
        console.error('Erro ao fazer aposta:', error);
        alert('Erro ao conectar com o servidor');
    }
}

// Adicionar o event listener para o formulário de apostas
document.addEventListener('DOMContentLoaded', () => {
    const betForm = document.getElementById('betForm');
    if (betForm) {
        betForm.addEventListener('submit', handleBet);
    }
}); 