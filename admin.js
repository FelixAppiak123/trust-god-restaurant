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
            loadReservations();
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
        loadReservations();
    } else {
        document.getElementById("login").style.display = "block";
        document.getElementById("dashboard").style.display = "none";
    }
});

// unsubscribe handles to avoid duplicate listeners
let ordersUnsub = null;
let reservationsUnsub = null;

// ADD FOOD TO FIREBASE
function addFood() {
    const name = document.getElementById("foodName").value;
    const price = document.getElementById("foodPrice").value;
    const image = document.getElementById("foodImage").value;
    // validate inputs
    if (!name || !price || !image) {
        alert('Please fill Food Name, Price and Image URL before adding.');
        return;
    }

    db.collection("foods").add({
        name: name,
        price: Number(price),
        image: image,
        createdAt: new Date().toISOString()
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
    const sel = document.getElementById('orderSort');
    const sortOrder = sel ? sel.value : 'desc';
    console.log('loadOrders() sortOrder=', sortOrder);

    // detach previous listener
    if (typeof ordersUnsub === 'function') ordersUnsub();

    // try ordering by createdAt; if it fails (missing field or permission), fall back
    try {
        const query = db.collection('orders').orderBy('createdAt', sortOrder);
        ordersUnsub = query.onSnapshot(snapshot => {
            console.log('orders ordered snapshot size=', snapshot.size);
            renderOrdersSnapshot(snapshot, container);
        }, err => {
            console.error('Ordered orders listener error:', err);
            container.innerHTML = '<p>Error loading ordered orders. Falling back to unordered list.</p>';
            // fallback
            if (typeof ordersUnsub === 'function') ordersUnsub();
            ordersUnsub = db.collection('orders').onSnapshot(snap => renderOrdersSnapshot(snap, container), e => console.error(e));
        });
    } catch (err) {
        console.error('Ordering by createdAt failed:', err);
        container.innerHTML = '<p>Error loading ordered orders. Falling back to unordered list.</p>';
        ordersUnsub = db.collection('orders').onSnapshot(snap => { console.log('orders unordered snapshot size=', snap.size); renderOrdersSnapshot(snap, container); }, e => console.error(e));
    }
}

function renderOrdersSnapshot(snapshot, container) {
    console.log('renderOrdersSnapshot called, snapshot=', snapshot);
    container.innerHTML = '';
    if (!snapshot || snapshot.empty) {
        console.log('renderOrdersSnapshot: snapshot empty, performing fallback get()');
        // attempt a one-time fetch to include older docs that may not appear in this snapshot
        db.collection('orders').get().then(fallbackSnap => {
            console.log('fallback fetch orders count=', fallbackSnap.size);
            if (fallbackSnap.empty) {
                container.innerHTML = '<p>No orders yet.</p>';
                return;
            }

            fallbackSnap.forEach(doc => {
                const ord = doc.data();
                const id = doc.id;

                const itemsList = (ord.items || []).map(item => {
                    const qty = item.qty || item.quantity || item.qtyOrdered || 1;
                    return `<li>${item.name} x${qty}</li>`;
                }).join("");

                const div = document.createElement("div");
                const created = ord.createdAt ? new Date(ord.createdAt).toLocaleString() : '';

                div.innerHTML = `
                    <h3>🧾 Order</h3>
                    <p><strong>${created}</strong></p>
                    <p><strong>Name:</strong> ${ord.customerName}</p>
                    <p><strong>Phone:</strong> ${ord.customerPhone}</p>
                    <p><strong>Location:</strong> ${ord.customerLocation}</p>

                    <p><strong>Items:</strong></p>
                    <ul>${itemsList}</ul>

                    <p><strong>Total:</strong> GHS ${ord.total}</p>
                    <p><strong>Status:</strong> ${ord.status}</p>

                    <button onclick="updateStatus('${id}', 'Cooking')">Cooking</button>
                    <button onclick="updateStatus('${id}', 'Out for Delivery')">Out for Delivery</button>
                    <button onclick="updateStatus('${id}', 'Completed')">Completed</button>

                    <hr>
                `;

                container.appendChild(div);
            });
        }).catch(e => {
            console.error('Fallback fetch orders failed', e);
            container.innerHTML = '<p>Error loading orders.</p>';
        });

        return;
    }

    snapshot.forEach(doc => {
        try {
            const ord = doc.data();
            const id = doc.id;
            console.log('render order doc id=', id, 'data=', ord);

            const itemsList = (ord.items || []).map(item => {
                const qty = item.qty || item.quantity || item.qtyOrdered || 1;
                return `<li>${item.name} x${qty}</li>`;
            }).join("");

            const div = document.createElement("div");
            // style the order block to be clearly visible
            div.style.background = 'linear-gradient(180deg, rgba(255,165,0,0.06), rgba(255,165,0,0.02))';
            div.style.padding = '12px';
            div.style.marginBottom = '12px';
            div.style.borderRadius = '10px';
            div.style.color = 'white';
            div.style.border = '1px solid rgba(255,165,0,0.12)';

            const created = ord.createdAt ? new Date(ord.createdAt).toLocaleString() : '';

            div.innerHTML = `
                <h3 style="color:orange;margin:0 0 6px 0;">🧾 Order</h3>
                <p style="margin:0 0 6px 0;font-size:0.95rem;"><strong>${created}</strong></p>
                <p style="margin:0 0 6px 0;"><strong>Name:</strong> ${ord.customerName}</p>
                <p style="margin:0 0 6px 0;"><strong>Phone:</strong> ${ord.customerPhone}</p>
                <p style="margin:0 0 6px 0;"><strong>Location:</strong> ${ord.customerLocation}</p>

                <p style="margin:6px 0 4px 0;"><strong>Items:</strong></p>
                <ul style="margin:0 0 8px 18px;">${itemsList}</ul>

                <p style="margin:0 0 6px 0;"><strong>Total:</strong> GHS ${ord.total}</p>
                <p style="margin:0 0 8px 0;"><strong>Status:</strong> ${ord.status}</p>

                <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
                    <button onclick="updateStatus('${id}', 'Cooking')">Cooking</button>
                    <button onclick="updateStatus('${id}', 'Out for Delivery')">Out for Delivery</button>
                    <button onclick="updateStatus('${id}', 'Completed')">Completed</button>
                </div>
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.04);margin-top:12px">
            `;

            container.appendChild(div);
            console.log('Appended order to container, container.innerHTML length=', container.innerHTML.length);
        } catch (err) {
            console.error('Error rendering order doc', err, doc);
            const errDiv = document.createElement('div');
            errDiv.style.color = 'red';
            errDiv.textContent = 'Error rendering an order — check console.';
            container.appendChild(errDiv);
        }
    });
}

function reloadOrders() {
    loadOrders();
}

// LOAD RESERVATIONS (real-time) - default sort: newest first
function loadReservations(sortOrder = 'desc') {
    const container = document.getElementById('reservationsList');
    if (!container) return;

    // createdAt stored as ISO string; order by it lexicographically
    let query = db.collection('reservations').orderBy('createdAt', sortOrder);

    // detach previous listener
    if (typeof reservationsUnsub === 'function') reservationsUnsub();

    reservationsUnsub = query.onSnapshot(snapshot => {
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = '<p>No reservations yet.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const r = doc.data();
            const id = doc.id;

            const div = document.createElement('div');
            // style reservation block to match orders
            div.style.background = 'linear-gradient(180deg, rgba(255,165,0,0.04), rgba(255,165,0,0.01))';
            div.style.padding = '12px';
            div.style.marginBottom = '12px';
            div.style.borderRadius = '10px';
            div.style.color = 'white';
            div.style.border = '1px solid rgba(255,165,0,0.08)';

            const created = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';

            div.innerHTML = `
                <h3 style="color:orange;margin:0 0 6px 0;">📅 Reservation</h3>
                <p style="margin:0 0 6px 0;font-size:0.95rem;"><strong>${created}</strong></p>
                <p style="margin:0 0 6px 0;"><strong>Name:</strong> ${r.name || r.fullName || 'Guest'}</p>
                <p style="margin:0 0 6px 0;"><strong>Phone:</strong> ${r.phone || r.phoneNumber || ''}</p>
                <p style="margin:0 0 6px 0;"><strong>Date:</strong> ${r.date || ''} <strong>Time:</strong> ${r.time || ''}</p>
                <p style="margin:0 0 6px 0;"><strong>Guests:</strong> ${r.guests || ''}</p>
                <p style="margin:6px 0 8px 0;">${r.notes || ''}</p>

                <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
                    <button onclick="confirmReservation('${id}')">Confirm</button>
                    <button onclick="cancelReservation('${id}')">Cancel</button>
                </div>

                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.04);margin-top:12px">
            `;

            container.appendChild(div);
        });
    }, err => console.error(err));
}

function reloadReservations() {
    const sel = document.getElementById('resSort');
    const order = sel ? sel.value : 'desc';
    loadReservations(order);
}

function confirmReservation(id) {
    db.collection('reservations').doc(id).update({ status: 'confirmed' }).then(()=>{
        alert('Reservation marked as confirmed');
    }).catch(err=>console.error(err));
}

function cancelReservation(id) {
    db.collection('reservations').doc(id).update({ status: 'cancelled' }).then(()=>{
        alert('Reservation marked as cancelled');
    }).catch(err=>console.error(err));
}

function deleteReservation(id) {
    if (!confirm('Delete this reservation?')) return;
    db.collection('reservations').doc(id).delete().catch(err=>console.error(err));
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
