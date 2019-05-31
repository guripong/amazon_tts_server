var express = require('express');
var router = express.Router();
const multiparty = require('multiparty');
var FormData = require('form-data');
var AWS = require('aws-sdk');

var aws_config  = require('../config/aws-config.json');

AWS.config.update({
  accessKeyId: aws_config.accessKeyId,
  secretAccessKey: aws_config.secretAccessKey,
  region: aws_config.region,
});


const Fs = require('fs');
// Create an Polly client
const Polly = new AWS.Polly({
  signatureVersion: 'v4',
  region: 'us-east-1'
})


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', function (req, res, next) {
  var fname;
  let params = {
    'Text':
      `<speak>
      I want to tell you a secret.
          <amazon:effect name="whispered">I am not a real human.</amazon:effect>.
      Can you believe it?
      My favorite food is chicken.
      </speak>`,
    'TextType': 'ssml',
    'OutputFormat': 'pcm',
    'VoiceId': 'Joanna'
  }
  var ct; //컨텐츠타입
  var form = new multiparty.Form({
    autoFiles: false, // 요청이 들어오면 파일을 자동으로 저장할 것인가
    uploadDir: 'temp/', // 파일이 저장되는 경로(프로젝트 내의 temp 폴더에 저장됩니다.)
  });

  var realpath;
  /*
  const form = new multiparty.Form({
      autoFiles: true,
  });
  */

  form.parse(req);
  form.on('field', (name, value) => {
    console.log(`name:`, name, `value:`, value);
    if (name == 'ssmltag') {
      params.Text = value;
    }
    else if(name=='voiceid'){
      params.VoiceId = value;
    }
  });
  form.on('file', (name, file) => {
    //console.log('파일 들어옴');
    console.log(`파일:`, file.originalFilename);
    fname = file.originalFilename;
    realpath = file.path;
    //console.log(file.headers['content-type']);
    ct = file.headers['content-type'];

  });

  form.on('part', function (part) {
    console.log('파트 들어옴');
    //console.log(part);
    var size;
    if (part.filename) {
      size = part.byteCount;
      console.log(`size:`, size);

    } else {
      console.log('다시다시');
      part.resume();
    }

  });

  form.on('progress', function (byteRead, byteExpected) {
    //받는도중 계속 호출
    console.log(' Reading total  ' + byteRead + '/' + byteExpected);

  });

  form.on('error', function (err) {
    console.log('Error parsing form: ' + err.stack);
  });


  form.on('close', () => {
    console.log(`close!!!`);
    //const fileName = './resources/ManualTest.wav';

    Polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
        console.log(err.code)
      } else if (data) {
        //////////////////

        var chunksize = data.AudioStream.length + 36;//리틀엔디언으로 써야함
        console.log('들어옴' + data.AudioStream.length); //16000samplerate  mono(채널1)  signed 16-bit
        var wavheader = new Buffer(44);
        wavheader.fill("RIFF", 0, 4);  //CHUNKID
        wavheader.writeInt32LE(chunksize, 4, 8); //CHUNKSIZE
        wavheader.fill("WAVE", 8, 12); //ForMAT
        wavheader.fill("fmt ", 12, 16); //Subchunk1 ID
        wavheader.writeInt32LE(16, 16, 20); //(4)Subchunk1 Size
        wavheader.writeInt32LE(1, 20, 22); //(2)AudioFormat  PCM의경우1
        wavheader.writeInt32LE(1, 22, 24); //(2)NumChannel   모노1
        wavheader.writeInt32LE(16000, 24, 28); //(4) SampleRate  16000 을 리틀엔디언으로
        wavheader.writeInt32LE(16000 * 1 * 2, 28, 32); // (4) ByteRate SampleRate*채널*BitsPerSample/8 
        wavheader.writeInt32LE(1 * 2, 32, 34); //(2) BlockAlign 전체채널을 포함하는 한샘플의크기  채널*Bitperssample/8
        wavheader.writeInt32LE(16, 34, 36); //(2) BitsPerSample 샘플당비트수   
        wavheader.fill("data", 36, 40); //(4) Subchunk2 ID //문자 data
        wavheader.writeInt32LE(chunksize - 36, 40, 44);  //72684  ?  72720 - 36(?)
        //console.log(wavheader);

        //data.AudioStream = wavheader +data.AudioStream;

        if (data.AudioStream instanceof Buffer) {
          var arr = [wavheader, data.AudioStream];
          var buf = Buffer.concat(arr);
          Fs.writeFile("./temp/speech.wav", buf, function (err) {
            if (err) {
              return console.log(err)
            }
            console.log("The file was saved!");
    
            var form = new FormData();
            form.append('ssml', params.Text);
            form.append('voiceid', params.VoiceId);
            //form.append('file', buf);
            var options ={
              "Content-Type": "audio/wave",
              "filename": "mytest.wav"
              //Content-Disposition: form-data; name="my_file"; filename="speech.wav"
              //Content-Type: audio/wave
            }
            form.append('file', buf,options);
            //form.append('myname', 'john');
            //form.append('my_file', Fs.createReadStream('./temp/speech.wav'));


            res.setHeader('x-Content-Type', 'multipart/form-data; boundary='+form._boundary);
            res.setHeader('Content-Type', 'application/x-www-form-urlencoded');

            form.pipe(res);
          })
        }
      }
    });
    

  });//form.on close


});

module.exports = router;
