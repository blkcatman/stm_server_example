var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var os = require('os');
var fs = require('fs');
var mkdirp = require('mkdirp');
var randomstring = require("randomstring");

var execSync = require('child_process').execSync;

//var host = os.hostname();
var host = '127.0.0.1';
var port = 8000;

app.use(bodyParser.json());
app.use(bodyParser.text({ limit:'50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

var server = app.listen(port, function() {
    console.log('running in os type:' + os.type().toString());
    console.log('listning in: '+ host + ':' + port);
});

var authPair = {};

app.post('/channels/:channel_name', function(req, res) {
    var channel_name = req.params.channel_name;
    var auth_password = req.query.auth;

    if(channel_name == undefined) {
        res.status(400).send('no channel name.');
        return;
    }

    if(auth_password == undefined) {
        // in auth channels;
        var channel_name_confirm = req.query.channel;
        if(channel_name == channel_name_confirm) {
            mkdirp('./public/channels/' + channel_name, function(err){
                if(err) {
                    res.status(400).send('bad params in create channel.');
                    return;
                }
                console.log('INFO: create channel -> ' + channel_name);
                var authValue = randomstring.generate(12);
                authPair[channel_name] = authValue;
                console.log(req.body);

                var info = JSON.parse(req.body);
                //var url_name = 'http://' + host + ':' + port + '/channels/' + channel_name + '/';

                fs.writeFile('./public/channels/' + channel_name + "/stream.json", JSON.stringify(info), function(err){
                    if(err) {
                      res.status(400).send('error on save stream info.');
                      return;
                    }
                });

                var stmj = fs.createWriteStream('./public/channels/' + channel_name + '/stream.stmj');
								stmj.end();
								var stma = fs.createWriteStream('./public/channels/' + channel_name + '/stream.stma');
								stma.end();
                res.json({auth: authValue});
                return;
            });
        } else {
            res.status(400).send('bad params in create channel.');
            return;
        }
    } else {
        // in post files
      if(auth_password == authPair[channel_name]) {
        var combined_name = req.query.combined;

        var stream_num = req.query.streaminfo;
        var stream_name = req.query.stream;

        var audio_num = req.query.audioinfo;
        var audio_name = req.query.audio;

        var file_name = '';

        if(stream_num != undefined) {
          file_name = 'stream.stmj';
        }
        if(audio_num != undefined) {
          file_name = 'stream.stma';
        }

        if(stream_name != undefined){
          file_name = stream_name;
        }
        if(audio_name != undefined){
          file_name = audio_name;
        }
        if(combined_name != undefined) {
          file_name = combined_name;
        }

        if(file_name != undefined && (stream_num != undefined || audio_num != undefined)) {//stmj,stmaの時
          var params = JSON.parse(req.body);

          fs.appendFile('./public/channels/' + channel_name + '/' + file_name, JSON.stringify(params) + '\n', function(err) {
              if (err) {
                  res.status(400).send('cannot update stream info.');
                  return;
              }
              res.json({stat: 'ok'});
              return;
          });
          return;
        } else if (file_name != undefined) {//bin, stmv, wavの時
          var stream = req.pipe(fs.createWriteStream('./public/channels/' + channel_name + '/' + file_name));
          stream.on('finish', function() {
            res.json({stat: 'ok'});
            if(file_name.endsWith('wav')) {
              let output_file_name = file_name.split('.')[0];

              if(os.type().toString().match('Windows')) {
                execSync('.\\bin\\ffmpeg.exe -y -i .\\public\\channels\\' + channel_name + '\\' + file_name +' -vn -ac 2 -ar 44100 -b:a 128k -c:a aac ' +
                  '.\\public/channels\\' + channel_name + '\\' + output_file_name + '.m4a');
                execSync('.\\bin\\ffmpeg.exe -y -i .\\public\\channels\\' + channel_name + '\\' + file_name +' -vn -ac 2 -ar 44100 -b:a 128k -c:a libvorbis ' +
                  '.\\public\\channels\\' + channel_name + '\\' + output_file_name + '.ogg');
              } else {
                execSync('./bin/ffmpeg -y -i "./public/channels/' + channel_name + '/' + file_name +'" -vn -ac 2 -ar 44100 -b:a 128k -c:a aac ' +
                  './public/channels/' + channel_name + '/' + output_file_name + '.m4a');
                execSync('./bin/ffmpeg -y -i "./public/channels/' + channel_name + '/' + file_name +'" -vn -ac 2 -ar 44100 -b:a 128k -c:a libvorbis ' +
                  './public/channels/' + channel_name + '/' + output_file_name + '.ogg');
              }

              fs.unlinkSync('./public/channels/' + channel_name + '/' + file_name);
            }
          });
          return;
        } else {
          res.status(400).send('auth value is not match for the channel.');
          return;
        }
      } else {
        res.status(400).send('auth value is not match for the channel.');
        return;
      }
    }
});
