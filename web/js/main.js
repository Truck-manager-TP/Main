const API_URL = 'http://localhost:8080/api';
let allProducts = [];
let selectedCategory = 'all';

// Charger les produits au démarrage
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadStatistics();
});

// Charger les produits depuis l'API
function loadProducts() {
    fetch(`${API_URL}/products`)
        .then(response => response.json())
        .then(products => {
            allProducts = products;
            displayProducts(allProducts);
            loadStatistics();
        })
        .catch(error => console.error('Erreur:', error));
}

// Afficher les produits
function displayProducts(products) {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';

    if (products.length === 0) {
        productsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Aucun produit trouvé</p>';
        return;
    }

    products.forEach(product => {
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
            return;
        }

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => openProductModal(product);

        productCard.innerHTML = `
            <img src="${product.imageUrl || 'https://via.placeholder.com/300'}" alt="${product.name}" class="product-image">
            <div class="product-content">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || 'Description non disponible'}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price}€</span>
                    <button class="btn-primary">Détails</button>
                </div>
            </div>
        `;

        productsList.appendChild(productCard);
    });
}

// Rechercher des produits
function searchProducts() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchInput) {
        displayProducts(allProducts);
        return;
    }

    fetch(`${API_URL}/products/search?name=${searchInput}`)
        .then(response => response.json())
        .then(products => {
            displayProducts(products);
        })
        .catch(error => console.error('Erreur:', error));
}

// Filtrer par catégorie
function filterByCategory(category) {
    selectedCategory = category;
    
    // Mettre à jour les boutons actifs
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (category === 'all') {
        displayProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        displayProducts(filtered);
    }
}

// Ouvrir le modal de détail du produit
function openProductModal(product) {
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductDescription').textContent = product.description;
    document.getElementById('modalProductCategory').textContent = product.category;
    document.getElementById('modalProductPrice').textContent = product.price;
    document.getElementById('modalProductStock').textContent = product.stock;
    document.getElementById('modalProductSku').textContent = product.sku;
    document.getElementById('modalProductImage').src = product.imageUrl || 'https://via.placeholder.com/300';

    // Charger les capacités
    loadCapacities(product.id);

    document.getElementById('productModal').style.display = 'block';
}

// Charger les capacités du produit
function loadCapacities(productId) {
    fetch(`${API_URL}/capacities/product/${productId}`)
        .then(response => response.json())
        .then(capacities => {
            displayCapacities(capacities);
        })
        .catch(error => console.error('Erreur:', error));
}

// Afficher les capacités
function displayCapacities(capacities) {
    const capacitiesList = document.getElementById('capacitiesList');
    capacitiesList.innerHTML = '';

    if (capacities.length === 0) {
        capacitiesList.innerHTML = '<p>Aucune capacité disponible</p>';
        return;
    }

    capacities.forEach(capacity => {
        const capacityItem = document.createElement('div');
        capacityItem.className = 'capacity-item';
        capacityItem.innerHTML = `
            <p><strong>${capacity.name}</strong> - ${capacity.type}</p>
            <p>Valeur: <strong>${capacity.value} ${capacity.unit}</strong></p>
            <p>Disponible: ${capacity.available ? '✓ Oui' : '✗ Non'}</p>
        `;
        capacitiesList.appendChild(capacityItem);
    });
}

// Fermer le modal de détail
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

// Ouvrir le modal de demande de démo
function openModal() {
    document.getElementById('demoModal').style.display = 'block';
}

// Fermer le modal de démo
function closeModal() {
    document.getElementById('demoModal').style.display = 'none';
}

// Gérer la soumission du formulaire de démo
document.getElementById('demoForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        company: document.getElementById('company').value,
        message: document.getElementById('message').value
    };

    console.log('Formulaire soumis:', formData);
    alert('Merci! Nous vous contacterons bientôt.');
    
    this.reset();
    closeModal();
});

// Charger les statistiques
function loadStatistics() {
    fetch(`${API_URL}/products`)
        .then(response => response.json())
        .then(products => {
            document.getElementById('productCount').textContent = products.filter(p => p.active).length;
        })
        .catch(error => console.error('Erreur:', error));

    fetch(`${API_URL}/capacities/product/1`)
        .then(response => response.json())
        .then(capacities => {
            let totalCapacities = capacities.length;
            document.getElementById('capacityCount').textContent = totalCapacities;
        })
        .catch(error => {
            // Si la requête échoue, mettre 0
            document.getElementById('capacityCount').textContent = '0';
        });
}

// Fermer les modals en cliquant en dehors
window.onclick = function(event) {
    const productModal = document.getElementById('productModal');
    const demoModal = document.getElementById('demoModal');
    
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
    if (event.target === demoModal) {
        demoModal.style.display = 'none';
    }
}
