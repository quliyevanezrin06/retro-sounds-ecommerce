const API_URL = 'http://localhost:3000/api';
let cart = []; 

function getToken() { return sessionStorage.getItem('jwt_token'); }
function setToken(token) { sessionStorage.setItem('jwt_token', token); }

function logout() {
    sessionStorage.removeItem('jwt_token');
    cart = [];
    document.getElementById('store-page').style.display = 'none';
    document.getElementById('auth-page').style.display = 'flex';
}

// Ürün ID-sine göre özel resim bağlantıları
const PRODUCT_IMAGES = {
    1: 'https://pitchfork.com/reviews/albums/18028-daft-punk-random-access-memories/',
    2: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80',
    3: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    4: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
    5: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&q=80',
    6: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    7: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80',
    8: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&q=80'
};

// Tam işlək, daha realistik və vintage şəkillər
const specificImages = {
    'Pink Floyd - The Dark Side of the Moon': 'https://images.unsplash.com/photo-1538370621607-4919ce78a48b?w=600&q=80',
    'The Beatles - Abbey Road': 'https://images.unsplash.com/photo-1606775615707-1cce8e9329bc?w=600&q=80',
    'Michael Jackson - Thriller': 'https://images.unsplash.com/photo-1542208998-f6dbbb27a72f?w=600&q=80',
    'Vaqif Mustafazadə - Caz Kompozisiyaları': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&q=80',
    'Daft Punk - Random Access Memories': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    'Audio-Technica AT-LP120XUSB': 'https://www.amazon.com/clp/B0BN27CNXD',
    'Sony PS-LX310BT': 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=600&q=80',
    'Crosley Cruiser Deluxe Vintage': 'https://images.unsplash.com/photo-1571330366810-73f4a3ea3023?w=600&q=80',
    'Pro-Ject Debut Carbon EVO': 'https://images.unsplash.com/photo-1458560871784-56d23406c091?w=600&q=80',
    'Victrola Nostalgic 6-in-1': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80'
};
const defaultPlak = 'https://images.unsplash.com/photo-1538370621607-4919ce78a48b?w=600&q=80';
const defaultQramafon = 'https://images.unsplash.com/photo-1590226490680-705b6c2cb16b?w=600&q=80';

function switchAuth(type) {
    document.getElementById('login-msg').textContent = "";
    document.getElementById('reg-msg').textContent = "";
    if (type === 'register') {
        document.getElementById('login-box').style.display = 'none';
        document.getElementById('register-box').style.display = 'block';
    } else {
        document.getElementById('register-box').style.display = 'none';
        document.getElementById('login-box').style.display = 'block';
    }
}

function showStorePage(username) {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('store-page').style.display = 'block';
    document.getElementById('welcome-user').textContent = `Xoş gəldin, ${username}`;
    fetchProducts(); 
}

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('reg-msg');
    msg.textContent = 'Gözləyin...'; msg.style.color = 'white';
    try {
        const username = document.getElementById('reg-username').value.trim();
        const response = await fetch(`${API_URL}/admin/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: document.getElementById('reg-password').value.trim() })
        });
        const result = await response.json();
        if (response.ok) {
            msg.textContent = "Uğurlu! 'Giriş edin' vuraraq hesaba daxil olun.";
            msg.style.color = "#00C851"; e.target.reset();
        } else {
            msg.textContent = result.error; msg.style.color = "#ff4444";
        }
    } catch (error) { msg.textContent = "Server xətası"; msg.style.color = "#ff4444"; }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('login-msg');
    msg.textContent = 'Gözləyin...'; msg.style.color = 'white';
    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: document.getElementById('login-username').value.trim(), 
                password: document.getElementById('login-password').value.trim() 
            })
        });
        const result = await response.json();
        if (response.ok) {
            setToken(result.token); 
            showStorePage(result.username); 
        } else {
            msg.textContent = result.error; msg.style.color = "#ff4444";
        }
    } catch (error) { msg.textContent = "Server xətası"; msg.style.color = "#ff4444"; }
});

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${getToken()}` } 
        });
        if (response.status === 401 || response.status === 403) {
            alert('Sessiyanın vaxtı bitib, yenidən giriş edin.');
            logout(); return;
        }
        const products = await response.json();
        const container = document.getElementById('products-container');
        container.innerHTML = ''; 

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Resim kaynağını esnek biçimde belirle
            const imgUrl = product.image_url || PRODUCT_IMAGES[product.id] || specificImages[product.name] || (product.category === 'plak' ? defaultPlak : defaultQramafon);
            const img = document.createElement('img');
            img.src = imgUrl; 
            img.className = 'product-image';
            
            // Resim yüklenemezse yedek görsel koy
            img.onerror = function() {
                this.onerror = null;
                this.src = defaultPlak;
            };

            const infoDiv = document.createElement('div');
            infoDiv.className = 'product-info';
            
            const title = document.createElement('h3');
            title.className = 'product-title'; title.textContent = product.name; 
            
            const price = document.createElement('div');
            price.className = 'product-price'; price.textContent = `${product.price} ₼`;

            const stock = document.createElement('div');
            stock.className = 'product-stock';
            stock.textContent = `Stokda: ${product.stock} ədəd`;

            const btn = document.createElement('button');
            btn.className = 'add-to-cart'; 
            
            if (product.stock > 0) {
                btn.textContent = 'Səbətə At';
                btn.onclick = () => {
                    cart.push(product); 
                    updateCartUI(); 
                    btn.textContent = 'Əlavə edildi ✓';
                    btn.style.background = '#00C851'; btn.style.color = '#000';
                    setTimeout(() => {
                        btn.textContent = 'Səbətə At';
                        btn.style.background = 'transparent'; btn.style.color = 'var(--primary)';
                    }, 1000);
                };
            } else {
                btn.textContent = 'Bitib';
                btn.disabled = true;
            }

            infoDiv.append(title, price, stock, btn);
            card.append(img, infoDiv);
            container.appendChild(card);
        });
    } catch (error) { console.error('Xəta:', error); }
}

function updateCartUI() {
    document.getElementById('cart-button').textContent = `Səbət (${cart.length})`;
    const list = document.getElementById('cart-items-list');
    list.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        list.innerHTML = '<p style="color:#888;">Səbətiniz boşdur.</p>';
    } else {
        cart.forEach((item, index) => {
            total += parseFloat(item.price);
            const div = document.createElement('div');
            div.className = 'cart-item';
            
            const nameSpan = document.createElement('div');
            nameSpan.className = 'cart-item-name';
            nameSpan.textContent = item.name;
            
            const priceDiv = document.createElement('div');
            priceDiv.style.whiteSpace = 'nowrap';
            priceDiv.textContent = `${item.price} ₼`;
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.onclick = () => {
                cart.splice(index, 1);
                updateCartUI();
            };

            priceDiv.appendChild(removeBtn);
            div.append(nameSpan, priceDiv);
            list.appendChild(div);
        });
    }
    document.getElementById('cart-total-price').textContent = `Cəmi: ${total.toFixed(2)} ₼`;
}

function openCart() { document.getElementById('cart-modal').style.display = 'block'; }
function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

async function checkout() {
    if (cart.length === 0) return alert("Səbətiniz boşdur, məhsul əlavə edin.");
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.textContent = 'Gözləyin...';
    checkoutBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ items: cart }) 
        });
        
        if (response.status === 401 || response.status === 403) {
            alert('Sessiyanın vaxtı bitib, yenidən giriş edin.');
            logout(); closeCart(); return;
        }

        const result = await response.json();
        if(response.ok) {
            alert(result.message); 
            cart = []; 
            updateCartUI();
            closeCart();
            fetchProducts(); 
        } else {
            alert("Xəta: " + result.error);
        }
    } catch (err) { 
        alert("Sifariş zamanı xəta baş verdi."); 
    } finally {
        checkoutBtn.textContent = 'Sifarişi Təsdiqlə (Ödəniş)';
        checkoutBtn.disabled = false;
    }
}