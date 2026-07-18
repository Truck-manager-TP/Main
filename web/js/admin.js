const API_URL = 'http://localhost:8080/api';

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadDashboardStats();
    loadProducts();
    loadAdminUsers();
    loadAuditLogs();
});

// Vérifier l'authentification
function checkAuthentication() {
    const token = localStorage.getItem('adminToken');
    // Commenté pour permettre l'accès sans token pour la démo
    // if (!token) {
    //     window.location.href = '/login';
    // }
}

// Charger les statistiques du dashboard
function loadDashboardStats() {
    fetch(`${API_URL}/products`)
        .then(response => response.json())
        .then(products => {
            document.getElementById('activeProducts').textContent = 
                products.filter(p => p.active).length;
        })
        .catch(error => console.error('Erreur:', error));

    fetch(`${API_URL}/admin/users`)
        .then(response => response.json())
        .then(users => {
            document.getElementById('totalAdmins').textContent = users.length;
        })
        .catch(error => console.error('Erreur:', error));

    fetch(`${API_URL}/audit-logs`)
        .then(response => response.json())
        .then(logs => {
            document.getElementById('totalLogs').textContent = logs.length;
        })
        .catch(error => console.error('Erreur:', error));
}

// Charger les produits
function loadProducts() {
    fetch(`${API_URL}/products`)
        .then(response => response.json())
        .then(products => {
            displayProductsTable(products);
        })
        .catch(error => console.error('Erreur:', error));
}

// Afficher les produits dans le tableau
function displayProductsTable(products) {
    const tbody = document.querySelector('#productsTable tbody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.price}€</td>
            <td>${product.stock}</td>
            <td>${product.active ? '✓' : '✗'}</td>
            <td>
                <button class="btn-edit" onclick="editProduct(${product.id})">Modifier</button>
                <button class="btn-delete" onclick="deleteProduct(${product.id})">Supprimer</button>
            </td>
        `;
    });
}

// Ouvrir le modal d'ajout de produit
function openAddProductModal() {
    document.getElementById('productForm').reset();
    document.getElementById('productModal').style.display = 'block';
}

// Fermer le modal de produit
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

// Gérer la soumission du formulaire de produit
document.getElementById('productForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const product = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        sku: document.getElementById('productSku').value,
        active: true
    };

    fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
    })
    .then(response => response.json())
    .then(data => {
        alert('Produit créé avec succès');
        loadProducts();
        closeProductModal();
        logAuditAction('CREATE', 'Product', data.id, 'Produit créé');
    })
    .catch(error => console.error('Erreur:', error));
});

// Supprimer un produit
function deleteProduct(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
        fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE'
        })
        .then(() => {
            alert('Produit supprimé');
            loadProducts();
            logAuditAction('DELETE', 'Product', id, 'Produit supprimé');
        })
        .catch(error => console.error('Erreur:', error));
    }
}

// Charger les utilisateurs admin
function loadAdminUsers() {
    fetch(`${API_URL}/admin/users`)
        .then(response => response.json())
        .then(users => {
            displayUsersTable(users);
        })
        .catch(error => console.error('Erreur:', error));
}

// Afficher les utilisateurs dans le tableau
function displayUsersTable(users) {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.active ? '✓' : '✗'}</td>
            <td>
                <button class="btn-edit" onclick="editUser(${user.id})">Modifier</button>
                <button class="btn-delete" onclick="deleteUser(${user.id})">Supprimer</button>
            </td>
        `;
    });
}

// Ouvrir le modal d'ajout d'utilisateur
function openAddUserModal() {
    document.getElementById('userForm').reset();
    document.getElementById('userModal').style.display = 'block';
}

// Fermer le modal d'utilisateur
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

// Gérer la soumission du formulaire d'utilisateur
document.getElementById('userForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const user = {
        username: document.getElementById('userName').value,
        password: document.getElementById('userPassword').value,
        email: document.getElementById('userEmail').value,
        firstName: document.getElementById('userFirstName').value,
        lastName: document.getElementById('userLastName').value,
        role: document.getElementById('userRole').value,
        active: true
    };

    fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
    .then(response => response.json())
    .then(data => {
        alert('Utilisateur créé avec succès');
        loadAdminUsers();
        closeUserModal();
        logAuditAction('CREATE', 'AdminUser', data.id, 'Utilisateur créé');
    })
    .catch(error => console.error('Erreur:', error));
});

// Supprimer un utilisateur
function deleteUser(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
        fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE'
        })
        .then(() => {
            alert('Utilisateur supprimé');
            loadAdminUsers();
            logAuditAction('DELETE', 'AdminUser', id, 'Utilisateur supprimé');
        })
        .catch(error => console.error('Erreur:', error));
    }
}

// Charger les logs d'audit
function loadAuditLogs() {
    fetch(`${API_URL}/audit-logs`)
        .then(response => response.json())
        .then(logs => {
            displayAuditLogs(logs);
        })
        .catch(error => console.error('Erreur:', error));
}

// Afficher les logs d'audit
function displayAuditLogs(logs) {
    const tbody = document.querySelector('#auditTable tbody');
    tbody.innerHTML = '';

    logs.forEach(log => {
        const row = tbody.insertRow();
        const date = new Date(log.createdAt).toLocaleString('fr-FR');
        row.innerHTML = `
            <td>${log.id}</td>
            <td>${log.username}</td>
            <td>${log.action}</td>
            <td>${log.entityType}</td>
            <td>${log.entityId}</td>
            <td>${date}</td>
        `;
    });
}

// Filtrer les logs d'audit
function filterAuditLogs() {
    const username = document.getElementById('auditUsername').value;
    const action = document.getElementById('auditAction').value;

    let url = `${API_URL}/audit-logs`;
    if (username) {
        url = `${API_URL}/audit-logs/username/${username}`;
    } else if (action) {
        url = `${API_URL}/audit-logs/action/${action}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(logs => {
            displayAuditLogs(logs);
        })
        .catch(error => console.error('Erreur:', error));
}

// Logger les actions d'audit
function logAuditAction(action, entityType, entityId, description) {
    const username = localStorage.getItem('adminUsername') || 'admin';
    const logData = {
        username: username,
        action: action,
        entityType: entityType,
        entityId: entityId,
        description: description,
        ipAddress: 'localhost'
    };

    fetch(`${API_URL}/audit-logs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
    })
    .catch(error => console.error('Erreur lors du logging:', error));
}

// Déconnexion
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    window.location.href = '/index.html';
}

// Fermer les modals en cliquant en dehors
window.onclick = function(event) {
    const productModal = document.getElementById('productModal');
    const userModal = document.getElementById('userModal');
    
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
    if (event.target === userModal) {
        userModal.style.display = 'none';
    }
}
