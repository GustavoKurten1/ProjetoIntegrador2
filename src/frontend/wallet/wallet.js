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
            if (data.role === 'MODERATOR') {
                const walletControls = document.querySelector('.wallet-controls');
                if (walletControls) {
                    walletControls.style.display = 'none';
                    const message = document.createElement('p');
                    message.className = 'warning-message';
                    message.textContent = 'Moderadores não podem realizar operações financeiras.';
                    document.querySelector('.dashboard-container').appendChild(message);
                }
            }
        }
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
    }

    await loadWalletBalance();
    
    if (document.getElementById('depositModal') || document.getElementById('withdrawModal')) {
        setupFormListeners();
        setupCardInputMasks();
    }
});

function setupFormListeners() {
    const depositForm = document.getElementById('depositForm');
    const withdrawForm = document.getElementById('withdrawForm');

    if (depositForm) {
        depositForm.addEventListener('submit', handleDeposit);
    }
    
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', handleWithdraw);
    }
}

function setupCardInputMasks() {
    // Máscara para números de cartão
    ['depositCardNumber', 'withdrawCardNumber'].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 16) {
                value = value.slice(0, 16);
            }
            // Adiciona espaços apenas para visualização
            const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = formattedValue;
            // Armazena o valor sem espaços em um atributo data
            e.target.dataset.cardNumber = value;
        });
    });

    // Máscara para data de validade
    ['depositCardExpiry', 'withdrawCardExpiry'].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0,2) + '/' + value.substring(2);
            }
            e.target.value = value;
        });
    });

    // Máscara para CVV
    ['depositCardCVV', 'withdrawCardCVV'].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    });
}

async function handleDeposit(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const cardNumberInput = document.getElementById('depositCardNumber');
    const cardNumber = cardNumberInput.dataset.cardNumber || cardNumberInput.value.replace(/\D/g, '');

    const depositData = {
        amount,
        cardNumber,
        type: 'DEPOSIT',
        status: 'PENDING'
    };

    try {
        const response = await fetch(`${API_URL}/deposit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(depositData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Depósito realizado com sucesso!');
            closeDepositModal();
            loadWalletBalance();
        } else {
            alert(data.error || 'Erro ao realizar depósito');
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor');
        console.error(error);
    }
}

async function handleWithdraw(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const cardNumberInput = document.getElementById('withdrawCardNumber');
    const cardNumber = cardNumberInput.dataset.cardNumber || cardNumberInput.value.replace(/\D/g, '');

    const withdrawData = {
        amount,
        cardNumber,
        type: 'WITHDRAW',
        status: 'PENDING'
    };

    try {
        const response = await fetch(`${API_URL}/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(withdrawData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Saque realizado com sucesso!');
            closeWithdrawModal();
            loadWalletBalance();
        } else {
            alert(data.error || 'Erro ao realizar saque');
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor');
        console.error(error);
    }
}

function showDepositModal() {
    const modal = document.getElementById('depositModal');
    modal.style.display = 'block';
}

function closeDepositModal() {
    const modal = document.getElementById('depositModal');
    modal.style.display = 'none';
    document.getElementById('depositForm').reset();
}

function showWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    modal.style.display = 'block';
}

function closeWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    modal.style.display = 'none';
    document.getElementById('withdrawForm').reset();
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
            throw new Error('Erro ao carregar saldo');
        }

        const data = await response.json();
        updateBalanceDisplay(data.balance);
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

function showDepositModal() {
    const modal = document.getElementById('paymentMethodModal');
    modal.style.display = 'block';
}

function closePaymentMethodModal() {
    const modal = document.getElementById('paymentMethodModal');
    modal.style.display = 'none';
}

function showPaymentModal(type) {
    closePaymentMethodModal();
    if (type === 'pix') {
        const modal = document.getElementById('pixModal');
        modal.style.display = 'block';
    } else if (type === 'credit') {
        const modal = document.getElementById('depositModal');
        modal.style.display = 'block';
    }
}

function closePixModal() {
    const modal = document.getElementById('pixModal');
    modal.style.display = 'none';
    document.getElementById('pixForm').reset();
}

// Adicionar handler para o formulário PIX
document.getElementById('pixForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('pixAmount').value);

        const response = await fetch(`${API_URL}/deposit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amount })
        });

        const data = await response.json();
        closePixModal();
        loadWalletBalance();

        if (response.ok) {
            document.getElementById('qrCode').src = data.qrCodeImage;
            document.getElementById('qrCode').style.display = 'block';
            document.getElementById('pixKey').textContent = data.pixKey;

        } else {
            alert(data.error || 'Erro ao gerar QR Code PIX');
        }

});