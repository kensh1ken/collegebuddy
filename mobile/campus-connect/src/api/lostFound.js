import client from "./client";

export const lostFoundApi = {
  list: (filters = {}) => client.get("/lost-found", { params: filters }).then((r) => r.data.data?.items || r.data.reports || []),
  myPosts: () => client.get("/lost-found/my-posts").then((r) => r.data.data?.items || r.data.report || []),
  getOne: (id) => client.get(`/lost-found/${id}`).then((r) => r.data.data?.report || r.data.report),
  update: (id, payload) => client.patch(`/lost-found/${id}`, payload).then((r) => r.data),
  remove: (id) => client.delete(`/lost-found/${id}`).then((r) => r.data),

  // payload: { title, description, category, type, location, contactNumber }
  // image: { uri, name, type } from expo-image-picker, or null
  create: (payload, image) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, String(value));
    });
    if (image) {
      form.append("image", {
        uri: image.uri,
        name: image.name || "photo.jpg",
        type: image.type || "image/jpeg",
      });
    }
    return client
      .post("/lost-found", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
