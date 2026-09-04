function sendSuccess(res, { status = 200, data = {}, message, legacy = true } = {}) {
  const payload = { success: true, data };
  if (message) payload.message = message;
  if (legacy && data && !Array.isArray(data) && typeof data === "object") {
    Object.assign(payload, data);
  }
  return res.status(status).json(payload);
}

module.exports = { sendSuccess };
