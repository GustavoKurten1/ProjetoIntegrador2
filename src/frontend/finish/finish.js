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
    await loadApprovedEvents();
});

async function loadApprovedEvents() {
    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:3000';

    try {
        const url = new URL(`${API_URL}/getEvents`);
        url.searchParams.append('status', 'APPROVED');

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar eventos aprovados');
        }

        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        alert('Erro ao buscar eventos aprovados');
        console.error(error);
    }
}

async function finishEvent(eventId, result) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/finishEvent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventId, result })
        });

        if (response.ok) {
            alert('Evento finalizado com sucesso!');
            loadApprovedEvents();
        } else {
            const data = await response.json();
            alert(data.error || 'Erro ao finalizar evento');
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
        eventsListDiv.innerHTML = '<p class="no-events">Nenhum evento aprovado encontrado</p>';
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
            <div class="finish-buttons">
                <button onclick="finishEvent(${event.id}, true)" class="approve-button">Aconteceu</button>
                <button onclick="finishEvent(${event.id}, false)" class="reject-button">Não Aconteceu</button>
            </div>
        `;
        
        eventsListDiv.appendChild(eventCard);
    });
} 