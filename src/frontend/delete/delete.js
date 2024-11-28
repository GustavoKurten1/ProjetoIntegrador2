document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    await loadWalletBalance();
    await loadMyEvents();
});

async function loadMyEvents() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const API_URL = 'http://localhost:3000';

    try {
        const response = await fetch(`${API_URL}/getMyEvents`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar eventos');
        }

        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        alert('Erro ao buscar eventos');
        console.error(error);
    }
}

async function deleteEvent(eventId) {
    if (!confirm('Tem certeza que deseja deletar este evento?')) {
        return;
    }

    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:3000';

    try {
        const response = await fetch(`${API_URL}/deleteEvent/${eventId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Evento deletado com sucesso!');
            loadMyEvents(); // Recarrega a lista
        } else {
            const data = await response.json();
            alert(data.error || 'Erro ao deletar evento');
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor');
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

    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'events-list';

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';

        const formatDate = (dateString) => {
            if (!dateString) return 'Data não disponível';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Data não disponível';
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

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
            <button onclick="deleteEvent(${event.id})" class="delete-button">Deletar Evento</button>
        `;
        eventsContainer.appendChild(eventCard);
    });

    eventsListDiv.appendChild(eventsContainer);
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