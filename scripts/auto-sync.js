/**
 * Google Apps Script — Auto Certificate Sync
 *
 * 1. Set DRIVE_FOLDER_ID to your Google Drive folder ID
 * 2. Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO in Script Properties
 * 3. Create a time-driven trigger to run checkNewCertificates() every hour
 * 4. When a new certificate image is uploaded:
 *    - Script guesses metadata from the filename
 *    - If fields are missing, emails you with a prefilled form link
 *    - Updates data/certificates.json and commits to GitHub
 */

const DRIVE_FOLDER_ID = '1RbNOUtxlTRy16sK-JhqxLsbgJ9t6LS1B';
const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

function checkNewCertificates() {
  const processed = getProcessedFiles_();
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const files = folder.getFiles();

  const existingImages = getExistingImages_();

  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    const ext = name.split('.').pop().toLowerCase();

    if (!ALLOWED_EXTS.includes(ext)) continue;
    if (processed.includes(name)) continue;
    if (existingImages.includes(name)) continue;

    processNewCertificate_(file, name);
  }
}

function processNewCertificate_(file, fileName) {
  const cert = {
    title: guessTitle_(fileName),
    category: 'Other',
    year: String(new Date().getFullYear()),
    issuer: '',
    image: 'assets/' + fileName,
  };

  const missing = [];
  if (!cert.title) missing.push('title');
  if (!cert.issuer) missing.push('issuer');
  if (!cert.category || cert.category === 'Other') missing.push('category');
  if (!cert.year) missing.push('year');

  const blob = file.getBlob();
  const assetFolder = DriveApp.getFoldersByName('assets').next();
  const existing = assetFolder.getFilesByName(fileName);
  if (!existing.hasNext()) {
    assetFolder.createFile(blob.setName(fileName));
  }

  if (missing.length > 0) {
    askForMissingDetails_(cert, missing, file);
    return;
  }

  addToJsonAndCommit_(cert);
  markProcessed_(fileName);
}

function guessTitle_(fileName) {
  let name = fileName.replace(/\.[^.]+$/, '');
  name = name.replace(/[-_]/g, ' ');
  name = name.replace(/\b\w/g, (c) => c.toUpperCase());
  if (/^\w{5,7}-\d$/.test(fileName.replace(/\.[^.]+$/, ''))) return '';
  return name;
}

function askForMissingDetails_(cert, missing, file) {
  const fields = [
    { id: 'title', label: 'Certificate Title', value: cert.title },
    { id: 'issuer', label: 'Issuing Organization', value: cert.issuer },
    { id: 'category', label: 'Category (AI / Web / Python / Other)', value: cert.category },
    { id: 'year', label: 'Year', value: cert.year },
  ].filter((f) => missing.includes(f.id));

  let body = 'New certificate uploaded: ' + file.getName() + '\n\n';
  body += 'Missing details:\n';
  fields.forEach((f) => {
    body += '• ' + f.label + '\n';
  });
  body += '\nReply with:\n';
  fields.forEach((f) => {
    body += f.id + ': <value>\n';
  });

  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: 'Certificate Missing Details — ' + file.getName(),
    body: body,
  });
}

function addToJsonAndCommit_(cert) {
  const repo = getGitHubRepo_();
  const jsonPath = 'data/certificates.json';

  let content;
  try {
    const existing = repo.getContents(jsonPath);
    content = JSON.parse(Buffer.from(existing.content, 'base64').toString());
  } catch (e) {
    content = [];
  }

  content.push(cert);

  const newJson = JSON.stringify(content, null, 2);
  const sha = existing ? existing.sha : null;

  repo.putContents(jsonPath, newJson, { sha: sha });
}

function getExistingImages_() {
  const repo = getGitHubRepo_();
  try {
    const existing = repo.getContents('data/certificates.json');
    const certs = JSON.parse(Buffer.from(existing.content, 'base64').toString());
    return certs.map((c) => c.image.replace('assets/', ''));
  } catch (e) {
    return [];
  }
}

function getProcessedFiles_() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('PROCESSED_FILES');
  return raw ? JSON.parse(raw) : [];
}

function markProcessed_(fileName) {
  const props = PropertiesService.getScriptProperties();
  const processed = getProcessedFiles_();
  processed.push(fileName);
  props.setProperty('PROCESSED_FILES', JSON.stringify(processed));
}

function getGitHubRepo_() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_TOKEN');
  const owner = props.getProperty('GITHUB_OWNER');
  const repo = props.getProperty('GITHUB_REPO');

  if (!token || !owner || !repo) {
    throw new Error('Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO in Script Properties');
  }

  return {
    getContents: function (path) {
      const url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path;
      const options = {
        headers: { Authorization: 'Bearer ' + token, 'User-Agent': 'cert-sync' },
        muteHttpExceptions: true,
      };
      const res = UrlFetchApp.fetch(url, options);
      if (res.getResponseCode() === 200) return JSON.parse(res.getContentText());
      return null;
    },
    putContents: function (path, content, opts) {
      const url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path;
      const payload = {
        message: 'Auto-sync: add certificate',
        content: Utilities.base64Encode(content),
        sha: opts.sha || undefined,
      };
      const options = {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + token, 'User-Agent': 'cert-sync' },
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      };
      return UrlFetchApp.fetch(url, options);
    },
  };
}
