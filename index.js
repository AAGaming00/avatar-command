const mime = require('mime-types');
const { Plugin } = require('powercord/entities');
const { http: { patch }, constants: { Endpoints: { ME } } } = require('powercord/webpack');
const { readdir, readFile } = require('fs').promises;
const { join } = require('path');

// https://github.com/gamell/fetch-base64/blob/master/index.js
function checkMimeType (paths) {
  const path = (Array.isArray(paths)) ? paths[paths.length - 1] : paths;
  const promise = new Promise((resolve, reject) => {
    try {
      resolve(mime.lookup(path));
    } catch (e) {
      reject(e);
    }
  });
  return promise;
}

function toDataURI (mimeType, data) {
  return `data:${mimeType};base64,${data}`;
}

module.exports = class AvatarCommand extends Plugin {
  async startPlugin () {
    powercord.api.commands.registerCommand({
      command: 'avatar',
      description: 'Change avatars from a directory',
      usage: '{c} <filename>',
      executor: this.handleCommand.bind(this),
      autocomplete: this.handleAutocomplete.bind(this)
    });
    this.dir = join(__dirname, 'avatars');
    this.avatars = (await readdir(this.dir)).filter((e) => e !== '.exists');
    console.log(this.avatars);
  }

  pluginWillUnload () {
    powercord.api.commands.unregisterCommand('avatar');
  }

  async handleCommand (args) {
    console.log(args);
    const file = (await readFile(join(this.dir, args.join(' ')), { encoding: 'base64' }));
    const avatar = toDataURI((await checkMimeType(args.join(' '))), file);
    if (file) {
      console.log(JSON.stringify({
        avatar
      }));
      const res = await patch({ url: ME,
        body: {
          avatar
        }
      }
      );
      console.log(res);
    }
  }

  handleAutocomplete (args) {
    return {
      commands: this.avatars
        .filter(type => type.toLowerCase().includes(args.join(' ').toLowerCase()))
        .map(type => ({ command: type })),
      header: 'select an image...'
    };
  }
};
