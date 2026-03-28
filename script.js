let cart = [];

function addToCart(item) {
    let existing = cart.find(i => i.name === item);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ name: item, qty: 1 });
    }

    displayCart();
}

function changeQty(index, amount) {
    cart[index].qty += amount;

    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }

    displayCart();
}

function displayCart() {
    let cartList = document.getElementById("cart");
    cartList.innerHTML = "";

    let totalItems = 0;

    cart.forEach((item, index) => {
        let div = document.createElement("div");
        div.classList.add("cart-item");

        div.innerHTML = `
            <div class="cart-info">
                <h4>${item.name}</h4>
                <p>Quantity: ${item.qty}</p>
            </div>

            <div class="cart-controls">
                <button onclick="changeQty(${index}, 1)">+</button>
                <button onclick="changeQty(${index}, -1)">-</button>
            </div>
        `;

        cartList.appendChild(div);

        totalItems += item.qty;
    });

    // TOTAL DISPLAY
    let total = document.createElement("h3");
    total.textContent = "Total Items: " + totalItems;
    total.classList.add("cart-total");

    cartList.appendChild(total);
}

function scrollToMenu() {
    document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
}

function sendWhatsAppOrder() {
    let message = "Hello, I want to order:\n";

    cart.forEach(item => {
        message += `${item.name} x${item.qty}\n`;
    });

    let url = "https://wa.me/233XXXXXXXXX?text=" + encodeURIComponent(message);

    window.open(url, "_blank");
}

function revealOnScroll() {
    let elements = document.querySelectorAll(".fade-in");

    elements.forEach(el => {
        let position = el.getBoundingClientRect().top;
        let screenHeight = window.innerHeight;

        if (position < screenHeight - 50) {
            el.classList.add("show");
        }
    });
}

window.addEventListener("scroll", revealOnScroll);

let scrollContainer;
let scrollSpeed = 1;
let direction = 1;
let autoScroll;

window.addEventListener("DOMContentLoaded", () => {

    scrollContainer = document.getElementById("menuScroll");

    function startAutoScroll() {
        autoScroll = setInterval(() => {

            scrollContainer.scrollLeft += scrollSpeed * direction;

            // Bounce at right
            if (
                scrollContainer.scrollLeft + scrollContainer.clientWidth >= 
                scrollContainer.scrollWidth
            ) {
                direction = -1;
            }

            // Bounce at left
            if (scrollContainer.scrollLeft <= 0) {
                direction = 1;
            }

        }, 20);
    }

    function stopAutoScroll() {
        clearInterval(autoScroll);
    }

    // Start scrolling
    startAutoScroll();

    // Pause when user interacts
    scrollContainer.addEventListener("mouseenter", stopAutoScroll);
    scrollContainer.addEventListener("mouseleave", startAutoScroll);

});
let pricePerPlate = 30; // you can change this

let slider = document.getElementById("guestSlider");
let guestCount = document.getElementById("guestCount");
let totalPrice = document.getElementById("totalPrice");

slider.addEventListener("input", () => {
    let guests = slider.value;

    guestCount.textContent = guests;

    let total = guests * pricePerPlate;

    totalPrice.textContent = "Total: GHS " + total;
});

//* ADMIN DASHBOARD *//
function loadFoods() {
    let foods = JSON.parse(localStorage.getItem("foods")) || [];
    let container = document.getElementById("menuScroll");

    foods.forEach(food => {
        let div = document.createElement("div");
        div.classList.add("card");

        div.innerHTML = `
            <img src="${food.image}">
            <h3>${food.name}</h3>
            <p>GHS ${food.price}</p>
            <button onclick="addToCart('${food.name}')">Add</button>
        `;

        container.appendChild(div);
    });
}

function loadFoods() {
    let container = document.getElementById("menuScroll");

    db.collection("foods").onSnapshot(snapshot => {
        container.innerHTML = ""; // clear menu

        snapshot.forEach(doc => {
            let food = doc.data();

            let div = document.createElement("div");
            div.classList.add("card");

            div.innerHTML = `
                <img src="${food.image}">
                <h3>${food.name}</h3>
                <p>GHS ${food.price}</p>
                <button onclick="addToCart('${food.name}')">Add</button>
            `;

            container.appendChild(div);
        });
    });
}


function placeOrder() {
    let name = document.getElementById("customerName").value;
    let phone = document.getElementById("customerPhone").value;
    let location = document.getElementById("customerLocation").value;

    if (!name || !phone || !location) {
        alert("Please fill all customer details!");
        return;
    }

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    let totalPrice = 0;

    cart.forEach(item => {
        totalPrice += item.price || 0;
    });

    let order = {
        customerName: name,
        customerPhone: phone,
        customerLocation: location,
        items: cart,
        total: totalPrice,
        time: new Date().toLocaleString(),
        status: "New"
    };

    db.collection("orders").add(order)
    .then((docRef) => {
    alert("Order placed successfully!");

    // SAVE ORDER ID
    localStorage.setItem("orderId", docRef.id);

    cart = [];
    displayCart();

    trackOrder(); // start tracking immediately
})
    .catch((error) => {
        console.error(error);
    });
}

function trackOrder() {
    let orderId = localStorage.getItem("orderId");

    if (!orderId) return;

    let statusText = document.getElementById("orderStatus");

    db.collection("orders").doc(orderId)
    .onSnapshot(doc => {
        if (doc.exists) {
            let order = doc.data();
            statusText.innerText = "Order Status: " + order.status;
        }
    });
}

function orderWhatsApp() {
    let name = document.getElementById("customerName").value;
    let phone = document.getElementById("customerPhone").value;
    let location = document.getElementById("customerLocation").value;

    if (!name || !phone || !location) {
        alert("Please fill all details!");
        return;
    }

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    let message = "Hello, I want to order:%0A";

    cart.forEach(item => {
        message += `- ${item.name}%0A`;
    });

    message += `%0AName: ${name}`;
    message += `%0APhone: ${phone}`;
    message += `%0ALocation: ${location}`;

    // 👉 PUT YOUR RESTAURANT NUMBER HERE
    let whatsappNumber = "233257245204"; // replace

    let url = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(url, "_blank");
}



// Run on load
window.addEventListener("DOMContentLoaded", () => {
    loadFoods();
    trackOrder();
});


