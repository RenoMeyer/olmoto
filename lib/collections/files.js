import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {FilesCollection} from 'meteor/ostrio:files';
import {gm} from 'meteor/cfs:graphicsmagick';
import Dropbox from 'dropbox';
import fs from 'fs';
import Request from 'request'
import {is_allowed} from '/lib/access_control';

if (Meteor.isServer) {

  const {dropbox_token, dropbox_key, dropbox_secret} = Meteor.settings.private
  var client = new Dropbox.Client({
    "token": dropbox_token,
   });

   // Meteor env callback function
   var bound = Meteor.bindEnvironment((callback) => {
      return callback();
    });
}

// const Files = new FilesCollection({
const Files = new FilesCollection({
  storagePath: Meteor.settings.public.storage_path,
  collectionName: 'files',
  allowClientCode: false, // Disallow remove files from Client
  onBeforeUpload: (file) => {
    // Allow upload files under 10MB, and only in png/jpg/jpeg formats
    if (file.size <= 10485760 && /png|jpg|jpeg/i.test(file.extension)) {
      return true;
    } else {
      return 'Please upload image, with size equal or less than 10MB';
    }
  },
  onAfterUpload: (fileRef) => {

    // create url from dropbox
    function makeUrl(stat, fileRef, version, triesUrl) {
      if (triesUrl == null) {
        triesUrl = 0;
      }
      client.makeUrl(stat.path, {
        long: true,
        downloadHack: true
      }, (error, xml) => {

        // store downloadable link in file's meta object
        // bound triesUrl and collection
        bound(() => {
          if (error) {
            if (triesUrl < 10) {
              Meteor.setTimeout(() => {
                makeUrl(stat, fileRef, version, ++triesUrl);
              }, 2048);
            } else {
              console.error(error, {
                triesUrl: triesUrl
              });
            }
          } else if (xml) {
            var upd = {
              $set: {}
            };
            upd['$set']["versions." + version + ".meta.pipeFrom"] = xml.url;
            upd['$set']["versions." + version + ".meta.pipePath"] = stat.path;
            Files.collection.update({
              _id: fileRef._id
            }, upd, (error) => {
              if (error) {
                console.error(error);
              } else {
                // unlink original files from FS
                // after successful upload to DropBox
                Files.unlink(Files.collection.findOne(fileRef._id), version);
              }
            });
          } else {
            if (triesUrl < 10) {
              Meteor.setTimeout(() => {
                makeUrl(stat, fileRef, version, ++triesUrl);
              }, 2048);
            } else {
              console.error("client.makeUrl doesn't returns xml", {
                triesUrl: triesUrl
              });
            }
          }
        });
      });
    };

    // write to dropbox
    function writeToDB(fileRef, version, data, triesSend) {
      // dropBox already uses random URLs
      // no need to use random file names
      if (triesSend == null) {
        triesSend = 0;
      }

      // choose subfolder for every file version and usage
      const subfolder = {
        "thumb": "/thumbs",
        "preview": "/previews",
        "original": `/${Meteor.settings.public.app_name}`,
        "coveroriginal": "/covers",
        "coverpreview": "/previews",
        "coverthumb": "/thumbs",
        "pageoriginal": "/pages",
        "pagepreview": "/previews",
        "pagethumb": "/thumbs",
      }
      client.writeFile(`${subfolder[fileRef.meta.usage + version]}/${fileRef._id}-${version}.${fileRef.extension}`, data, (error, stat) => {

        bound(() => {
          if (error) {
            if (triesSend < 10) {
              Meteor.setTimeout(() => {
                writeToDB(fileRef, version, data, ++triesSend);
              }, 2048);
            } else {
              console.error(error, {
                triesSend: triesSend
              });
            }
          } else {
            makeUrl(stat, fileRef, version);
          }
        });
      });
    };

    // read files from local storeage
    function readFile(fileRef, vRef, version, triesRead) {
      if (triesRead == null) {
        triesRead = 0;
      }
      fs.readFile(vRef.path, (error, data) => {

        bound(() => {
          if (error) {
            if (triesRead < 10) {
              readFile(fileRef, vRef, version, ++triesRead);
            } else {
              console.error(error);
            }
          } else {
            writeToDB(fileRef, version, data);
          }
        });
      });
    };

    // send every file version to remote storage
    function sendToStorage(fileRef, version) {
      var vRef = fileRef.versions[version]
      readFile(fileRef, vRef, version);
    };

    // create a thumbnails and send to storage
    function createThumbnails(filRef){

      var versions = {
        preview: {
          width: 500,
          height: null,
          scale: '^>'
        },
        thumb: {
          width: 200,
          height: 200,
          scale: '^>'
        }
      };

      _.map(versions, (vRef, version) => {

        vRef.path = `${fileRef._storagePath}/${fileRef._id}-${version}.${fileRef.extension}`

        gm(fileRef.path)
        .resize(vRef.width, vRef.width, vRef.scale)
        .write(vRef.path , (error, file) => {

          bound(() => {
            if (error) {
              console.log(error)
            } else {

              var upd = {
                $set: {}
              };
              upd['$set']['versions.' + version] = {
                path: vRef.path,
                size: fileRef.size,
                type: fileRef.type,
                extension: fileRef.extension,
                meta: {
                  width: vRef.width,
                  height: vRef.height
                }
              };

              Files.collection.update({_id: fileRef._id}, upd, (error) => {
                bound(() => {
                  if (error) {
                    console.error(error);
                  } else {
                    fileRef.versions[version] = vRef
                    sendToStorage(fileRef, version);
                  }
                });
              });
            }
          });
        });
      });
    }

    // create thumbs and upload them
    createThumbnails(fileRef);

    // update meta and upload original
    var upd = {
      $set: {}
    };
    upd['$set'] = {
      uploadedAt: new Date(),
      description: ''
    };

    Files.collection.update({_id: fileRef._id}, upd, (error) => {

      bound(() => {
        if (error) {
          console.error(error);
        } else {
          sendToStorage(fileRef, 'original');
        }
      });
    });
  },

  // download file from dropbox
  interceptDownload: (http, fileRef, version) => {
    var path, ref, ref1, ref2;
    path = (ref = fileRef.versions) != null ? (ref1 = ref[version]) != null ? (ref2 = ref1.meta) != null ? ref2.pipeFrom : void 0 : void 0 : void 0;
    if (path) {
      // if file is moved to DropBox
      // we will pipe request to DropBox
      // so, original link will always stay secure
      Request({
        url: path,
        headers: _.pick(http.request.headers, 'range', 'accept-language', 'accept', 'cache-control', 'pragma', 'connection', 'upgrade-insecure-requests', 'user-agent')
      }).pipe(http.response);
      return true;
    } else {
      // While file is not yet uploaded to DropBox
      // We will serve file from FS
      return false;
    }
  },

  // upload access control
  onBeforeUpload: function () {
    if (is_allowed('file.upload', this.userId)) {
      return true;
    }
    return "Insufficient rights for this action.";
  },
});

if (Meteor.isServer) {
  // intercept File's collection remove method
  // to remove file from DropBox
  var _origRemove = Files.remove;

  Files.remove = (selector) => {
    var cursor = Files.collection.find(selector);
    cursor.forEach((fileRef) => {
      _.each(fileRef.versions, (vRef) => {
        var ref;
        if (vRef != null ? (ref = vRef.meta) != null ? ref.pipePath : void 0 : void 0) {
          client.remove(vRef.meta.pipePath, (error) => {
            bound(() => {
              if (error) {
                console.error(error);
              }
            });
          });
        }
      });
    });
    // call original method
    _origRemove.call(Files, selector);
  };
}

export default Files;
