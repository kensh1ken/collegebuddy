import client from "./client";

export const eventsApi = {
  list: (filters = {}) => client.get("/events", { params: filters }).then((r) => r.data.data?.items || r.data.events || []),
  create: (payload) => client.post("/events", payload).then((r) => r.data),
  update: (id, payload) => client.patch(`/events/${id}`, payload).then((r) => r.data),
  remove: (id) => client.delete(`/events/${id}`).then((r) => r.data),
};
