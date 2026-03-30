// ADMIN FUNCTIONS (compat Firebase)

// LOGIN SYSTEM
window.login = function () {
    const email = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            document.getElementById("login").style.display = "none";
            document.getElementById("dashboard").style.display = "block";
            displayFoods();
            loadOrders();
        })
        .catch((error) => {
            alert("Login failed: " + error.message);
        });
};

// auth state listener (compat)
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        document.getElementById("login").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        displayFoods();
        loadOrders();
    } else {
        document.getElementById("login").style.display = "block";
        document.getElementById("dashboard").style.display = "none";
    }
});

// ADD FOOD TO FIREBASE
function addFood() {
    const name = document.getElementById("foodName").value;
    const price = document.getElementById("foodPrice").value;
    const image = document.getElementById("foodImage").value;

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
// DISPLAY FOOD FROM FIREBASE (real-time)
function displayFoods() {
    const list = document.getElementById("foodList");
    if (!list) return;
    list.innerHTML = "";

    db.collection("foods").onSnapshot(snapshot => {
        list.innerHTML = "";
        snapshot.forEach(doc => {
            const food = doc.data();
            const id = doc.id;

            const item = document.createElement("div");
            item.className = 'food-item';

            item.innerHTML = `
                <div class="food-info">
                    <strong>${food.name}</strong>
                    <div>GHS ${food.price}</div>
                </div>
                <div class="food-actions">
                    <button onclick="editFood('${id}')">Edit</button>
                    <button onclick="deleteFood('${id}')">Delete</button>
                </div>
            `;

            list.appendChild(item);
        });
    }, err => console.error(err));
}

// Edit a food item (simple prompt-based editor)
function editFood(foodId) {
    db.collection('foods').doc(foodId).get().then(doc => {
        if (!doc.exists) return alert('Food not found');
        const food = doc.data();
        const newName = prompt('Food name:', food.name);
        if (newName === null) return; // cancelled
        const newPrice = prompt('Price:', food.price);
        if (newPrice === null) return;
        const newImage = prompt('Image URL:', food.image || '');

        db.collection('foods').doc(foodId).update({
            name: newName,
            price: Number(newPrice) || food.price,
            image: newImage
        }).then(() => {
            // onSnapshot will update UI automatically
        }).catch(err => console.error(err));
    }).catch(err => console.error(err));
}

// Delete a food item
function deleteFood(foodId) {
    if (!confirm('Delete this food item?')) return;
    db.collection('foods').doc(foodId).delete().catch(err => console.error(err));
}

// LOAD ORDERS
function loadOrders() {
    const container = document.getElementById("ordersList");
    if (!container) return;

    db.collection("orders").onSnapshot(snapshot => {
        container.innerHTML = "";

        snapshot.forEach(doc => {
            const order = doc.data();
            const id = doc.id;

            const itemsList = (order.items || []).map(item => `<li>${item.name}</li>`).join("");

            const div = document.createElement("div");

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
    }, err => console.error(err));
}

// UPDATE ORDER STATUS
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

// expose functions globally (optional)
window.addFood = addFood;
window.displayFoods = displayFoods;
window.loadOrders = loadOrders;
window.updateStatus = updateStatus;
window.logout = function() {
    firebase.auth().signOut()
        .then(() => {
            document.getElementById("login").style.display = "block";
            document.getElementById("dashboard").style.display = "none";
        })
        .catch(err => console.error(err));
};
