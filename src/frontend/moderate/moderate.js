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
            if (data.role !== 'MODERATOR') {
                alert('Acesso não autorizado');
                window.location.href = '../dashboard/dashboard.html';
                return;
            }
        }
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    await loadWalletBalance();
    await loadPendingEvents();
});

async function loadPendingEvents() {
    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:3000';

    try {
        const response = await fetch(`${API_URL}/getPendingEvents`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar eventos pendentes');
        }

        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        alert('Erro ao buscar eventos pendentes');
        console.error(error);
    }
}

async function moderateEvent(eventId, approved) {
    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:3000';

    try {
        const response = await fetch(`${API_URL}/evaluateNewEvent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventId, approved })
        });

        if (response.ok) {
            alert(`Evento ${approved ? 'aprovado' : 'rejeitado'} com sucesso!`);
            loadPendingEvents();
        } else {
            const data = await response.json();
            alert(data.error || 'Erro ao moderar evento');
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
        eventsListDiv.innerHTML = '<p class="no-events">Nenhum evento pendente encontrado</p>';
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
            <div class="moderation-buttons">
                <button onclick="moderateEvent(${event.id}, true)" class="approve-button">Aprovar</button>
                <button onclick="moderateEvent(${event.id}, false)" class="reject-button">Rejeitar</button>
            </div>
        `;
        
        eventsListDiv.appendChild(eventCard);
    });
}

function formatDate(dateString) {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
} 