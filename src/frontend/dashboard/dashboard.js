document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    
    // Check if user is moderator
    try {
        const response = await fetch(`${API_URL}/checkRole`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const moderatorButton = document.getElementById('moderatorButton');
            if (data.role === 'MODERATOR') {
                moderatorButton.style.display = 'block';
                document.getElementById('finishEventButton').style.display = 'block';
            } else {
                moderatorButton.style.display = 'none';
                document.getElementById('finishEventButton').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar role:', error);
    }
    
    await loadWalletBalance();
    // Adicionar listener para o formulário de novo evento
    const addEventForm = document.getElementById('addEventForm');
    if (addEventForm) {
        addEventForm.addEventListener('submit', handleAddEvent);
    }
});

async function handleAddEvent(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:3000';

    const eventData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        eventDate: document.getElementById('eventDate').value,
        bettingStartDate: document.getElementById('bettingStartDate').value,
        bettingEndDate: document.getElementById('bettingEndDate').value
    };

    try {
        const response = await fetch(`${API_URL}/addNewEvent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Evento criado com sucesso!');
            closeModal();
        } else {
            alert(data.error || 'Erro ao criar evento');
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor');
        console.error(error);
    }
}

function showAddEventModal() {
    const modal = document.getElementById('addEventModal');
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('addEventModal');
    modal.style.display = 'none';
    document.getElementById('addEventForm').reset();
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '../index.html';
}

// Fechar modal quando clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('addEventModal');
    if (event.target === modal) {
        closeModal();
    }
}

async function deleteEvent(eventId) {
    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:3000';

    if (!confirm('Tem certeza que deseja deletar este evento?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/deleteEvent/${eventId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Evento deletado com sucesso!');
            loadEvents(); // Recarrega a lista de eventos
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

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        
        const isCreator = event.created_by === parseInt(localStorage.getItem('userId'));
        
        eventCard.innerHTML = `
            <h3>${event.title}</h3>
            <p class="event-description">${event.description}</p>
            <div class="event-details">
                <p><strong>Status:</strong> ${event.status}</p>
                <p><strong>Data do Evento:</strong> ${formatDate(event.eventDate)}</p>
                <p><strong>Período de Apostas:</strong></p>
                <p>Início: ${formatDate(event.bettingStartDate)}</p>
                <p>Fim: ${formatDate(event.bettingEndDate)}</p>
            </div>
            ${isCreator ? `<button onclick="deleteEvent(${event.id})" class="delete-button">Deletar Evento</button>` : ''}
        `;
        eventsListDiv.appendChild(eventCard);
    });
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
        console.log('Balance received:', data.balance, typeof data.balance);
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