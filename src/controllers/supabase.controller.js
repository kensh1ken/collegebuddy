const service = require('../services/resource.service');
const { sendSuccess } = require('../utils/response');

module.exports.createResource = async (req, res) => {
  const resource = await service.create(req.body, req.file, req.user);
  return sendSuccess(res, { status: 201, message: resource.status === 'pending' ? 'Resource submitted for review' : 'Resource created', data: { resource } });
};

module.exports.getAllResources = async (req, res) => {
  const result = await service.list(req.query, req.user);
  return sendSuccess(res, { data: { ...result, resources: result.items } });
};

module.exports.getSingleResource = async (req, res) => {
  const resource = await service.findAuthorized(req.params.id, req.user);
  return sendSuccess(res, { data: { resource } });
};

module.exports.updateResource = async (req, res) => {
  const resource = await service.update(req.params.id, req.body, req.user);
  return sendSuccess(res, { message: 'Resource updated', data: { resource } });
};

module.exports.deleteResource = async (req, res) => {
  await service.remove(req.params.id, req.user);
  return sendSuccess(res, { message: 'Resource deleted' });
};

module.exports.downloadResource = async (req, res) => {
  const download = await service.getDownload(req.params.id, req.user);
  return sendSuccess(res, { data: { download } });
};

module.exports.moderateResource = async (req, res) => {
  const resource = await service.moderate(req.params.id, req.body, req.user);
  return sendSuccess(res, { message: `Resource ${resource.status}`, data: { resource } });
};
