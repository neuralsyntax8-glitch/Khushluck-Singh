/**
 * Google Apps Script — Drive → GitHub Auto-Sync for Certificates
 *
 * 1. Set these Script Properties:
 *    GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO
 *    (File → Project properties → Script properties)
 *
 * 2. Run setupTrigger() once to install the hourly trigger.
 *
 * 3. Upload a certificate image to the Drive folder below.
 *    The script will commit it to assets/ and append an entry
 *    to data/certificates.json on the main branch.
 *
 * 4. The GitHub Actions deploy workflow (.github/workflows/deploy.yml)
 *    will redeploy the portfolio on every push to main.
 */

var DRIVE_FOLDER_ID = '1RbNOUtxlTRy16sK-JhqxLsbgJ9t6LS1B';
var GITHUB_TOKEN = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
var GITHUB_OWNER = PropertiesService.getScriptProperties().getProperty('GITHUB_OWNER');
var GITHUB_REPO = PropertiesService.getScriptProperties().getProperty('GITHUB_REPO');

var CERT_JSON_PATH = 'data/certificates.json';
var ASSETS_PREFIX = 'assets/';
var BRANCH = 'main';

function checkNewCertificates() {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    Logger.log('Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO in Script Properties');
    return;
  }

  Logger.log('GITHUB_TOKEN exists: ' + (GITHUB_TOKEN ? GITHUB_TOKEN.substring(0, 10) + '...' : 'no'));
  Logger.log('GITHUB_OWNER: ' + GITHUB_OWNER);
  Logger.log('GITHUB_REPO: ' + GITHUB_REPO);

  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var files = folder.getFiles();
  var syncedIds = getSyncedFileIds();
  var imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
  var newAssets = [];


  Logger.log('Synced IDs count: ' + syncedIds.length);

  var fileCount = 0;
  while (files.hasNext()) {
    var file = files.next();
    fileCount++;
    var fileId = file.getId();
    var name = file.getName();

    Logger.log('File ' + fileCount + ': ' + name + ' (' + fileId + ')');

    if (syncedIds.indexOf(fileId) !== -1) {
      Logger.log('  -> already synced, skipping');
      continue;
    }

    var ext = name.substring(name.lastIndexOf('.')).toLowerCase();

    if (imageExtensions.indexOf(ext) === -1) {
      Logger.log('  -> not an image, skipping');
      continue;
    }

    var safeName = fileId + ext;
    var blob = file.getBlob();
    var base64 = Utilities.base64Encode(blob.getBytes());

    Logger.log('  -> committing to assets/' + safeName);
    var committed = commitFile(ASSETS_PREFIX + safeName, base64, true);

    if (!committed) {
      Logger.log('  -> commit FAILED, skipping');
      continue;
    }

    Logger.log('  -> commit SUCCEEDED');

    var title = name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    var category = inferCategory(title);

    newAssets.push({
      title: title,
      category: category,
      year: String(new Date().getFullYear()),
      issuer: 'Auto-Synced',
      image: ASSETS_PREFIX + safeName
    });

    addSyncedFileId(fileId);
  }

  Logger.log('Total files in Drive folder: ' + fileCount);
  Logger.log('New assets to add: ' + newAssets.length);

  if (newAssets.length === 0) {
    Logger.log('No new assets, skipping JSON update');
    return;
  }

  Logger.log('Fetching existing certificates from GitHub...');
  var existing = getExistingCertificates();
  Logger.log('Existing certs count: ' + existing.length);
  var updated = existing.concat(newAssets);
  var jsonStr = JSON.stringify(updated, null, 2);
  var jsonBase64 = Utilities.base64Encode(Utilities.newBlob(jsonStr).getBytes());

  Logger.log('Committing updated certificates.json...');
  commitFile(CERT_JSON_PATH, jsonBase64, false);
  Logger.log('Done!');
}

function getExistingCertificates() {
  var url = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + CERT_JSON_PATH + '?ref=' + BRANCH;
  var res = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + GITHUB_TOKEN },
    muteHttpExceptions: true
  });

  if (res.getResponseCode() === 200) {
    var data = JSON.parse(res.getContentText());
    var decoded = Utilities.newBlob(Utilities.base64Decode(data.content.replace(/\n/g, ''))).getDataAsString();
    return JSON.parse(decoded);
  }
  return [];
}

function commitFile(path, base64Content, isImage) {
  var url = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + path;
  var sha = null;

  var getRes = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + GITHUB_TOKEN },
    muteHttpExceptions: true
  });

  if (getRes.getResponseCode() === 200) {
    var existing = JSON.parse(getRes.getContentText());
    sha = existing.sha;
  }

  var message = isImage
    ? 'Add certificate image: ' + path
    : 'Update certificates.json with new entries';

  var payload = {
    message: message,
    content: base64Content,
    branch: BRANCH
  };
  if (sha) payload.sha = sha;

  var putRes = UrlFetchApp.fetch(url, {
    method: 'put',
    headers: { Authorization: 'Bearer ' + GITHUB_TOKEN },
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = putRes.getResponseCode();
  if (code === 200 || code === 201) return true;
  Logger.log('Failed to commit ' + path + ': ' + putRes.getContentText());
  return false;
}

function getSyncedFileIds() {
  var props = PropertiesService.getScriptProperties();
  var val = props.getProperty('SYNCED_FILE_IDS');
  return val ? JSON.parse(val) : [];
}

function addSyncedFileId(id) {
  var ids = getSyncedFileIds();
  if (ids.indexOf(id) === -1) {
    ids.push(id);
    PropertiesService.getScriptProperties().setProperty('SYNCED_FILE_IDS', JSON.stringify(ids));
  }
}

function inferCategory(title) {
  var t = title.toLowerCase();
  if (t.indexOf('python') !== -1 || t.indexOf('data') !== -1) return 'Python';
  if (t.indexOf('ai') !== -1 || t.indexOf('chatgpt') !== -1 || t.indexOf('prompt') !== -1 || t.indexOf('chatbot') !== -1 || t.indexOf('machine learning') !== -1) return 'AI';
  if (t.indexOf('css') !== -1 || t.indexOf('html') !== -1 || t.indexOf('tailwind') !== -1 || t.indexOf('web') !== -1 || t.indexOf('javascript') !== -1 || t.indexOf('react') !== -1) return 'Web';
  return 'AI';
}

function testSimple() {
  Logger.log('--- TEST START ---');
  try {
    var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
    var owner = PropertiesService.getScriptProperties().getProperty('GITHUB_OWNER');
    var repo = PropertiesService.getScriptProperties().getProperty('GITHUB_REPO');
    Logger.log('Token set: ' + (token ? 'YES (' + token.substring(0, 8) + '...)' : 'NO'));
    Logger.log('Owner: ' + (owner || 'NOT SET'));
    Logger.log('Repo: ' + (repo || 'NOT SET'));

    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    Logger.log('Folder name: ' + folder.getName());

    var files = folder.getFiles();
    var n = 0;
    while (files.hasNext()) {
      n++;
      files.next();
    }
    Logger.log('Files in folder: ' + n);
  } catch (e) {
    Logger.log('ERROR: ' + e.message);
  }
  Logger.log('--- TEST END ---');
}

function setupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkNewCertificates') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('checkNewCertificates')
    .timeBased()
    .everyHours(1)
    .create();
}
