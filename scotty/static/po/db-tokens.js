var fs = require('fs');
var request = require('request-promise');
var config = require('../config/config');

var dest = createFolder();
var endpoints = [
  'benefits',
  'seniority',
  'salutations',
  'company_types',
  'skill_levels',
  'proficiencies',
  'rejectionreasons',
  'withdrawalreasons',
  'roles/featured',
];


var process = endpoints.map(function(id) {
  var url = config.api_url + 'v1/config/' + id;
  return request(url).then(function(response) {
    var fileName = dest + id.replace('/', '_') + '.js';
    var content = JSON.parse(response).data.map(wrap).join('\n');
    return writeFile(fileName, content);
  });
});

Promise.all(process).catch(console.error);


function writeFile(path, content) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, content, function(error) {
      if (error) reject(error);
      else resolve();
    });
  });
}

function createFolder() {
  var folder = __dirname + '/../tmp/';
  if (!fs.existsSync(folder))
    fs.mkdirSync(folder);

  folder += 'db-tokens/';
  if (!fs.existsSync(folder))
    fs.mkdirSync(folder);

  return folder;
}

function wrap(value) {
  return 'gettext("' + value + '");';
}
