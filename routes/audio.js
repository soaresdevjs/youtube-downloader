const express = require("express");
const router = express.Router();
const ytdl = require('ytdl-core');
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const crypto = require('crypto');

//Tokens
const inUseTokens = {};

router.get('/', (req, res) =>{
    res.render('converter', {route: "audio"})
})

router.post('/getlink', (req, res) => {
    const ref = req.body.url;
    
    ytdl.getInfo(ref).then((info) => info).then(async info => {
      let title;
      let formatos = [];
      let qualidades = {}
    
      const itagYtdl = [140, 18]
      for(i = 0; i < info.formats.length; i++){
        formatos.push(info.formats[i])
        qualidades = Object.assign(formatos);
      }
      title = info.videoDetails.title

      const keys = Object.keys(qualidades);
      const todos = keys.map((keys) => qualidades[keys]);
      const filtrados = todos.filter((item) => itagYtdl.includes(item.itag));
      console.log(filtrados)
      res.render('download-audio', {title: title, qualidades: filtrados, url: ref})
    });
});

router.post('/download', (req, res) => {
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
      titulo = req.body.titulo.replace('/', ''),
      formato = req.body.formato;
   
    // Obter audio e video
    const audio = ytdl(url, { quality: req.body.qualidade });
  
    // Start the ffmpeg child process
    const ffmpegProcess = cp.spawn(ffmpeg, [
    // Remove ffmpeg's console spamming
    '-loglevel', '8', '-hide_banner',
    // Redirect/Enable progress messages
    '-progress', 'pipe:3',
    // Set inputs
    '-i', 'pipe:4',
    // Map audio & video from streams
    '-map', '0:a',
    // Keep encoding
    '-c:v', 'copy',
    // Define output file
    token + '.mp3',
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
  
  ffmpegProcess.stdio[5].on('error', (err) => {
    // Remover token do objeto
    delete inUseTokens[token];
    res.status(500).send(err.message);
  });

  ffmpegProcess.stdio[5].on('close', (code) => {
    console.log(titulo)
    res.download(`${token}.mp3`, `ydownload.com.br_${titulo}.mp3`, (err) => {
      if (err) {
        console.log(err)
        fs.unlink(`${token}.mp3`, (err) => {
          if (err) console.log(err);
          console.log('arquivo deletado')
        });
      } else {
        // Remover token do objeto
        delete inUseTokens[token];
        // Apagar arquivo baixado
        fs.unlink(`${token}.mp3`, (err) => {
          if (err) console.log(err);
          console.log('arquivo deletado')
        });
      }})
    })
  });

module.exports = router;