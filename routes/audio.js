const express = require("express"),
  router = express.Router(),
  ytdl = require('ytdl-core'),
  cp = require('child_process'),
  ffmpeg = require('ffmpeg-static'),
  fs = require('fs'),
  crypto = require('crypto'),
  fsReadDirRecGen = require('fs-readdir-rec-gen'),
  mongoose = require('mongoose');

//Tokens
  const inUseTokens = {};

//Mongoose
  require('../models/Estrelas')
  const Estrelas = mongoose.model("estrelas");

module.exports = (router) => {

router.get('/audio', (req, res) =>{
  if (req.query.urlfail){
    res.render('index', {message: "URL Inválida, verifique sua URL e tente novamente!", route: "audio", format: "MP4 e WEBM", rota: ""});
  }else if(req.query.private){
    res.render('index', {message: "Esse vídeo é privado ou não foi encontrado.", route: "audio", format: "MP4 e WEBM", rota: ""});
  }else{
    res.render('index', {route: "audio", format: "MP4 e WEBM", rota: ""});
  }

  function filtrarPorExtensao(fileName) {
    return fileName.endsWith('.mp3');
  };
  
  const tempoDeDownload = (d => {
    d.setMinutes(d.getMinutes() - 2);
    return d;
  })(new Date());
    
  for (let file of fsReadDirRecGen('.', filtrarPorExtensao)) {
    const Stats = fs.statSync(file);
    console.log(((Stats.mtime - tempoDeDownload) / 60000) % 60 )
    if (Stats.mtime < tempoDeDownload) {
      fs.unlinkSync(file);
    }
  }
})

router.post('/audio/getlink', (req, res) => {
  const ref = req.body.url;
  if(ytdl.validateURL(ref) == true){
    ytdl.getInfo(ref).then((info) => info).then(async info => {
      let title = info.videoDetails.title,
        thumbnail = info.player_response.videoDetails.thumbnail.thumbnails[3].url,
        seconds = info.player_response.videoDetails.lengthSeconds,
        formatos = [],
        qualidades = {};
      const itagMP3 = [18, 140];

      for(i = 0; i < info.formats.length; i++){
        formatos.push(info.formats[i])
        qualidades = Object.assign(formatos);
      }

      const mp3Keys = Object.keys(qualidades),
        mp3Todos = mp3Keys.map((keys) => qualidades[keys]),
        mp3Filtrados = mp3Todos.filter((item) => itagMP3.includes(item.itag));
        console.log(mp3Filtrados)

      res.render('download', {thumbnail: thumbnail, title: title, seconds: seconds, mp3: mp3Filtrados,url: ref, format: "MP4 e WEBM", rota: "", route: "audio"})
    }).catch((err) => {
      res.redirect('/audio/?private=true');
      console.log("Erro: " + err)
    });
  }else{
    res.redirect('/audio/?urlfail=true');
  }
})

router.post('/audio/download', (req, res) => {
    const token = crypto.randomBytes(20).toString('hex');
  
    // Adicionar token ao objeto
    inUseTokens[token] = true;

    // Verificar se o token é válido
    if (!inUseTokens[token]) {
      res.status(401).send('Unauthorized');
      return;
    }
  
    // Obter URL do vídeo
    const url = req.body.url,
      titulo = req.body.titulo,
      thumbnail = req.body.thumbnail,
      seconds = req.body.seconds,
      formato = ".mp3";
   
    // Obter audio e video
    const audio = ytdl(url, { quality: req.body.qualidade }),
      video = ytdl(url, {quality: req.body.qualidade, filter: 'audio'});
  
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
    // Keep encoding
    '-c:v', 'copy',
    // Define output file
    token + formato,
  ], {
    windowsHide: true,
    stdio: [
      /* Standard: stdin, stdout, stderr */
      'inherit', 'inherit', 'inherit',
      /* Custom: pipe:3, pipe:4, pipe:5 */
      'pipe', 'pipe', 'pipe', 'pipe'
    ],
  });

  ffmpegProcess.stdio[3].on('data', (err) => {
    console.log('convertendo...');
  });

  res.on('close', () => {
    setTimeout(() => {
      delete inUseTokens[token];
      ffmpegProcess.stdio[3].end();
      ffmpegProcess.stdio[4].end();
      ffmpegProcess.stdio[5].end();
      ffmpegProcess.stdio[6].end();
      console.log('Interrompendo o processo FFmpeg...');
      ffmpegProcess.kill("SIGTERM");
    }, 2000);
  });

  audio.pipe(ffmpegProcess.stdio[4]);
  video.pipe(ffmpegProcess.stdio[5]);
  
  ffmpegProcess.stdio[6].on('error', (err) => {
    // Remover token do objeto
    delete inUseTokens[token];
    res.status(500).send(err.message);
  });

  ffmpegProcess.stdio[6].on('close', () => {
    res.render('downloated', {formato: formato, title: titulo, token: token, thumbnail: thumbnail, seconds: seconds, format: "MP4 e WEBM", rota: "", route: "audio"})
    });
  });

router.post('/audio/baixar', (req, res) =>{
  const formato = req.body.formato,
    token = req.body.token,
    titulo = req.body.titulo;
    console.log(titulo)
    
  res.download(`${token}${formato}`, `download.com.br_${titulo}${formato}`, (err) => {
    if (err) {
        console.log("Erro: " + err);
      // Remover token do objeto
        delete inUseTokens[token];
      // Apagar arquivo baixado
        fs.unlink(`${token}${formato}`, (err) => {
          if (err) console.log(err);
          console.log('arquivo deletado');
        });
    } else {
      // Remover token do objeto
        delete inUseTokens[token];
      // Apagar arquivo baixado
        fs.unlink(`${token}${formato}`, (err) => {
          if (err) console.log(err);
          console.log('arquivo deletado');
        });
      }
    })
  })

  router.post('/audio/estrelas', (req, res, next) =>{
    const newPost = {
      estrelas: req.body.estrelas,
  }
  new Estrelas(newPost).save().then((result) => {
      console.log("Avaliado! " + result.estrelas);
      res.status(204).send()
  }).catch((err) =>{
      console.log("Erro ao avaliar: " + err)
      res.status(204).send()
  })
  })
}