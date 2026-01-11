"use strict";

module.exports = async function (fastify, opts) {
  // 1. Path changed to /ws/:category to avoid collision
  fastify.get("/ws/:category", { websocket: true }, async (a, b) => {
    // 2. Argument check to find the socket correctly
    const socket = a.socket ? a.socket : a;
    const category = b.params.category;

    // 3. Added this loop so '0' becomes '3' immediately on connect
    for (const order of fastify.currentOrders(category)) {
      socket.send(order);
    }

    for await (const order of fastify.realtimeOrders()) {
      if (socket.readyState >= socket.CLOSING) break;
      socket.send(order);
    }
  }
);

  /*
  When a POST request is made, the id is destructured from request.params 
  and passed to the fastify.addOrder method along with request.body.amount
  */
  fastify.post("/:id", async (request) => {
    const { id } = request.params;
    const amount = parseInt(request.body.amount) || 1;
    fastify.addOrder(id, amount);
    return { ok: true };
  });
};
