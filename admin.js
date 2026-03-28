// LOGIN SYSTEM
function login() {
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    if (user === "admin" && pass === "1234") {
    document.getElementById("login").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    displayFoods();
    loadOrders(); // load orders in real-time
} else {
        alert("Wrong login details");
    }
}

// ADD FOOD TO FIREBASE
function addFood() {
    let name = document.getElementById("foodName").value;
    let price = document.getElementById("foodPrice").value;
    let image = document.getElementById("foodImage").value;

    db.collection("foods").add({
        name: name,
        price: price,
        image: image
    })
    .then(() => {
        alert("Food added successfully!");
        displayFoods(); // refresh list
    })
    .catch((error) => {
        console.error("Error:", error);
    });
}

// DISPLAY FOOD FROM FIREBASE
function displayFoods() {
    let list = document.getElementById("foodList");
    list.innerHTML = "";

    db.collection("foods").get().then(snapshot => {
        snapshot.forEach(doc => {
            let food = doc.data();

            let div = document.createElement("div");

            div.innerHTML = `
                <p>${food.name} - GHS ${food.price}</p>
            `;

            list.appendChild(div);
        });
    });
}

function loadOrders() {
    let container = document.getElementById("ordersList");

    db.collection("orders").onSnapshot(snapshot => {
        container.innerHTML = "";

        snapshot.forEach(doc => {
            let order = doc.data();
            let id = doc.id;

            let itemsList = order.items.map(item => `<li>${item.name}</li>`).join("");

            let div = document.createElement("div");

            div.innerHTML = `
                <h3>🧾 Order</h3>
                <p><strong>Name:</strong> ${order.customerName}</p>
                <p><strong>Phone:</strong> ${order.customerPhone}</p>
                <p><strong>Location:</strong> ${order.customerLocation}</p>

                <p><strong>Items:</strong></p>
                <ul>${itemsList}</ul>

                <p><strong>Total:</strong> GHS ${order.total}</p>
                <p><strong>Status:</strong> ${order.status}</p>

                <button onclick="updateStatus('${id}', 'Cooking')">Cooking</button>
                <button onclick="updateStatus('${id}', 'Out for Delivery')">Out for Delivery</button>
                <button onclick="updateStatus('${id}', 'Completed')">Completed</button>

                <hr>
            `;

            container.appendChild(div);
        });
    });
}

function updateStatus(orderId, newStatus) {
    db.collection("orders").doc(orderId).update({
        status: newStatus
    })
    .then(() => {
        alert("Status updated!");
    })
    .catch((error) => {
        console.error(error);
    });
}