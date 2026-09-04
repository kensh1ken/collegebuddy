import client from "./client";

export const adminApi = {
  listUsers: () => client.get("/admin/users", { params: { limit: 100 } }).then((r) => r.data.data?.items || r.data.users || []),
  blockUser: (id) => client.patch(`/admin/users/${id}/block`).then((r) => r.data),
  unblockUser: (id) => client.patch(`/admin/users/${id}/unblock`).then((r) => r.data),
};
