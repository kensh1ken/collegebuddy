const api = window.CollegeBuddyAPI;
const container = document.getElementById('resourceContainer');
const resourceId = new URLSearchParams(window.location.search).get('id');
const text = (value, fallback = '—') => value === undefined || value === null || value === '' ? fallback : String(value);
const element = (tag, className, value) => { const node = document.createElement(tag); if (className) node.className = className; if (value !== undefined) node.textContent = text(value); return node; };

function detail(label, value) {
  const wrapper = element('div', 'detail');
  wrapper.append(element('div', 'detail-label', label), element('div', 'detail-value', value));
  return wrapper;
}

function displayResource(resource) {
  container.replaceChildren();
  const isLink = resource.deliveryType === 'link' || ['link', 'external_link'].includes(resource.resourceType);
  const header = element('div', 'resource-header');
  const headerBody = element('div');
  headerBody.append(element('div', 'resource-icon', isLink ? '🔗' : '📄'), element('h1', '', resource.title), element('span', `resource-type ${isLink ? 'link-type' : 'file-type'}`, text(resource.resourceType, 'resource').replaceAll('_', ' ')));
  header.append(headerBody);
  container.append(header, element('p', 'description', text(resource.description, 'No description provided.')));
  const details = element('div', 'details');
  details.append(detail('Course', resource.courseId), detail('Semester', `Semester ${text(resource.semester)}`), detail('Academic year', resource.academicYear), detail('Status', resource.status || 'approved'));
  container.append(details);
  const uploader = element('div', 'uploader');
  uploader.append(element('strong', '', 'Uploaded by'), element('p', '', resource.uploadedBy?.name || 'Unknown'));
  container.append(uploader);
  const open = element('button', 'action-btn', isLink ? '🔗 Open resource' : '📄 Get secure download');
  open.addEventListener('click', async () => {
    open.disabled = true;
    try { const { download } = await api.resources.download(resource._id); window.open(download.url, '_blank', 'noopener'); }
    catch (error) { alert(error.message); }
    finally { open.disabled = false; }
  });
  container.append(open);
}

if (!resourceId) {
  container.append(element('div', 'error', 'Resource ID not found.'));
} else {
  api.request(`/resources/${encodeURIComponent(resourceId)}`)
    .then(({ resource }) => displayResource(resource))
    .catch((error) => container.replaceChildren(element('div', 'error', error.message)));
}
