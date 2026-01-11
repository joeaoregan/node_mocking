const API = "http://localhost:3000";
const WS_API = "ws://localhost:3000";

const populateProducts = async (category, method = "GET", payload) => {
  const products = document.querySelector("#products");
  products.innerHTML = "";
  const options = method === "GET" ? {} : {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
  const res = await fetch(`${API}/${category}`, options);
  const data = await res.json();
  for (const product of data) {
    const item = document.createElement("product-item");
    // CRITICAL: Link the HTML element to the ID (A1, A2, etc)
    item.dataset.id = product.id; 
    for (const key of ["name", "rrp", "info"]) {
      const span = document.createElement("span");
      span.slot = key;
      span.textContent = product[key];
      item.appendChild(span);
    }

    const ordersSpan = document.createElement("span");
    ordersSpan.slot = "orders";
    ordersSpan.textContent = product.total ?? 0;
    item.appendChild(ordersSpan);

    products.appendChild(item);
  }
};

let socket = null;
const realtimeOrders = (category) => {
  if (socket) socket.close();
  // URL updated to match the backend /ws/ path
  socket = new WebSocket(`${WS_API}/orders/ws/${category}`);

  socket.addEventListener("message", ({ data }) => {
    const { id, total } = JSON.parse(data);
    // Find the item by the data-id we set in populateProducts
    const item = document.querySelector(`product-item[data-id="${id}"]`);
    if (item) {
      const span = item.querySelector('[slot="orders"]');
      if (span) span.textContent = total;
    }
  });
};

const category = document.querySelector("#category");
category.addEventListener("input", async ({ target }) => {
  document.querySelector("#add").style.display = "block";
  await populateProducts(target.value);
  realtimeOrders(target.value);
});

add.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { target } = e;
  const payload = {
    name: target.name.value,
    rrp: target.rrp.value,
    info: target.info.value,
  };
  await populateProducts(category.value, "POST", payload);
  realtimeOrders(category.value);
  // Reset form
  target.reset();
});

customElements.define(
  "product-item",
  class Item extends HTMLElement {
    constructor() {
      super();
      const itemTmpl = document.querySelector("#item").content;
      this.attachShadow({ mode: "open" }).appendChild(itemTmpl.cloneNode(true));
    }
  }
);
