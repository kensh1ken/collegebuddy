import client from "./client";

export const notesApi = {
  // filters: { search, courseId, semester, resourceType }
  list: (filters = {}) =>
    client.get("/resources", { params: filters }).then((r) => r.data.data?.items || r.data.resources || []),
  getOne: (id) => client.get(`/resources/${id}`).then((r) => r.data.data?.resource || r.data.resource),
  getDownload: (id) => client.get(`/resources/${id}/download`).then((r) => r.data.data?.download || r.data.download),

  // payload: { title, description, courseId, semester, resourceType, externalLink }
  // file: { uri, name, type } from expo-document-picker, required if resourceType === 'file'
  create: (payload, file) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, String(value));
    });
    if (file) {
      form.append("file", {
        uri: file.uri,
        name: file.name || "resource",
        type: file.mimeType || file.type || "application/octet-stream",
      });
    }
    return client
      .post("/resources", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
