const express = require('express');
const ytdl = require('ytdl-core');
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs')
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();

//Configs
  //Body Parser
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
  //Handlebars
    app.engine('hbs', hbs.engine({
      extname: 'hbs',
      defaultLayout: 'main',
  })); app.set('view engine','hbs');

app.get('/', (req, res) => {
  res.render('index')
})

app.post('/getlink', (req, res) => {
const ref = req.body.url;

ytdl.getInfo(ref).then((info) => info).then(async info => {
  let title;
  let itags = [];
  let qualidades = {}

  const itagYtdl = [18, 137, 248, 136, 247, 135, 134]
  for(i = 0; i < info.formats.length; i++){
    itags.push(info.formats[i].itag)
    itags.filter(item => itagYtdl.includes(item))
    qualidades.itags = Object.assign({}, itags.filter(item => itagYtdl.includes(item)));
    qualidades.numbers = Object.assign({},itags.filter(item => itagYtdl.includes(item)).toString().split(','))
  }
  title = info.videoDetails.title
  console.log(qualidades)
  res.render('download', {title: title, qualidades: qualidades, url: ref, })
});
})

const inUseTokens = {};

app.post('/token', (req, res) => {
  // Gerar token aleatório

});

app.post('/download', (req, res) => {
  const token = crypto.randomBytes(20).toString('hex');

  // Adicionar token ao objeto
  inUseTokens[token] = true;

  // Verificar se o token é válido
  if (!inUseTokens[token]) {
    res.status(401).send('Unauthorized');
    return;
  }

  // Obter URL do vídeo
  const url = req.body.url;
  const videoStream = ytdl(url);

  // Obter audio e video
  const audio = ytdl(url, { quality: 'highestaudio' });
  const video = ytdl(url, { quality: req.body.qualidade });

  // Start the ffmpeg child process
  const ffmpegProcess = cp.spawn(ffmpeg, [
  // Remove ffmpeg's console spamming
  '-loglevel', '8', '-hide_banner',
  // Redirect/Enable progress messages
  '-progress', 'pipe:3',
  // Set inputs
  '-i', 'pipe:4',
  '-i', 'pipe:5',
  // Map audio & video from streams
  '-map', '0:a',
  '-map', '1:v',
  // Keep encoding
  '-c:v', 'copy',
  // Define output file
  token + '.mp4',
], {
  windowsHide: true,
  stdio: [
    /* Standard: stdin, stdout, stderr */
    'inherit', 'inherit', 'inherit',
    /* Custom: pipe:3, pipe:4, pipe:5 */
    'pipe', 'pipe', 'pipe', 'pipe', 'pipe'
  ],
});

ffmpegProcess.stdio[3].on('data', () => {
  console.log('convertendo...')
});

audio.pipe(ffmpegProcess.stdio[4]);
video.pipe(ffmpegProcess.stdio[5]);

ffmpegProcess.stdio[6].on('error', (err) => {
  // Remover token do objeto
  delete inUseTokens[token];
  res.status(500).send(err.message);
});
ffmpegProcess.stdio[6].on('close', (code) => {
  res.download(`${token}.mp4`, (err) => {
    if (err) {
      console.log(err);
    } else {
      // Remover token do objeto
      console.log(inUseTokens)
      delete inUseTokens[token];
      // Apagar arquivo após o download
      fs.unlink(`${token}.mp4`, (err) => {
        if (err) console.log(err);
        console.log('arquivo deletado')
      });
    }})
  })
});

app.post('/download', (req, res) => {
  const randomID = Math.random() * 100000000000000000
  const ref = req.body.url;
  console.log("qualidade:" + `${req.body.qualidade}`)
  const titulo = req.body.titulo

// Get audio and video streams
const audio = ytdl(ref, { quality: 'highestaudio' });
const video = ytdl(ref, { quality: req.body.qualidade });

// Start the ffmpeg child process
const ffmpegProcess = cp.spawn(ffmpeg, [
  // Remove ffmpeg's console spamming
  '-loglevel', '8', '-hide_banner',
  // Redirect/Enable progress messages
  '-progress', 'pipe:3',
  // Set inputs
  '-i', 'pipe:4',
  '-i', 'pipe:5',
  // Map audio & video from streams
  '-map', '0:a',
  '-map', '1:v',
  // Keep encoding
  '-c:v', 'copy',
  // Define output file
  randomID + '.mp4',
], {
  windowsHide: true,
  stdio: [
    /* Standard: stdin, stdout, stderr */
    'inherit', 'inherit', 'inherit',
    /* Custom: pipe:3, pipe:4, pipe:5 */
    'pipe', 'pipe', 'pipe', 'pipe', 'pipe'
  ],
});

ffmpegProcess.stdio[3].on('data', () => {
  console.log('convertendo...')
});

audio.pipe(ffmpegProcess.stdio[4]);
video.pipe(ffmpegProcess.stdio[5]);
ffmpegProcess.stdio[6].on('end', () => {
    res.setHeader('Content-disposition', `attachment; filename="ydownload.com.br_${encodeURI(titulo)}.mp4"`);
    res.setHeader('Content-type', 'video/mp4');
    const finalFile = fs.createReadStream(`${randomID}.mp4`)
    finalFile.pipe(res)
    res.redirect('/')
    finalFile.on('end', () => {
      fs.unlink(`${randomID}.mp4`, function (err){
        if (err) throw err;
        console.log('Arquivo deletado!');
      })
    })
  })
});


app.listen(8087, () => {
    console.log('Server running on port 8087');
});
