const express = require("express");
const router = express.Router();
const ytdl = require('ytdl-core');
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const crypto = require('crypto');

module.exports = (router) => {
//Tokens
    const inUseTokens = {};

router.get('/', (req, res) =>{
  if (req.query.urlfail){
    res.render('index', {message: "URL Inválida, verifique sua URL e tente novamente!"})
  }else if(req.query.private){
    res.render('index', {message: "Esse vídeo é privado ou não foi encontrado."})
  }else{
    res.render('index')
  }
})

router.post('/getlink', (req, res) => {

  const ref = req.body.url;
  console.log(ytdl.validateURL(ref))
  if(ytdl.validateURL(ref) == true){
    ytdl.getInfo(ref).then((info) => info).then(async info => {
      let title = info.videoDetails.title,
        thumbnail = info.player_response.videoDetails.thumbnail.thumbnails[3].url,
        seconds = info.player_response.videoDetails.lengthSeconds,
        formatos = [],
        qualidades = {};
      const itagMP4 = [137, 136, 135, 134],
        itagWEBM = [248, 247];

      for(i = 0; i < info.formats.length; i++){
        formatos.push(info.formats[i])
        qualidades = Object.assign(formatos);
      }

      const mp4Keys = Object.keys(qualidades),
        mp4Todos = mp4Keys.map((keys) => qualidades[keys]),
        mp4Filtrados = mp4Todos.filter((item) => itagMP4.includes(item.itag)),
        Formatar18 = mp4Todos.filter((item) => item.itag === 18),
        webmKeys = Object.keys(qualidades),
        webmTodos = webmKeys.map((keys) => qualidades[keys]),
        webmFiltrados = webmTodos.filter((item) => itagWEBM.includes(item.itag));

      Formatar18[0].qualityLabel = '144p'
      mp4Filtrados.push(Formatar18[0])

      res.render('download', {thumbnail: thumbnail, title: title, seconds: seconds, mp4: mp4Filtrados, webm: webmFiltrados, url: ref})
    }).catch((err) => {
      res.redirect('/?private=true')
      console.log("Erro: " + err)
    });
  }else{
    res.redirect('/?urlfail=true')
  }
})

router.post('/download', (req, res) => {
    if (req.body.qualidade == 137 || req.body.qualidade == 136 || req.body.qualidade == 135 || req.body.qualidade == 134){
      var formato = ".mp4"
    } else {
      var formato = ".webm"
    }
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
      titulo = req.body.titulo.replace('/', '');
   
    // Obter audio e video
    const audio = ytdl(url, { quality: 'highestaudio' }),
      video = ytdl(url, { quality: req.body.qualidade });
  
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
    console.log(titulo)
    res.download(`${token}${formato}`, `download.com.br_${titulo}${formato}`, (err) => {
      if (err) {
        console.log(err)
        fs.unlink(`${token}${formato}`, (err) => {
          if (err) console.log(err);
          console.log('arquivo deletado')
        });
      } else {
        // Remover token do objeto
        delete inUseTokens[token];
        // Apagar arquivo baixado
        fs.unlink(`${token}${formato}`, (err) => {
          if (err) console.log(err);
          console.log('arquivo deletado')
        });
      }})
    })
  });
}