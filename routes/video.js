const express = require("express"),
  router = express.Router(),
  ytdl = require('ytdl-core'),
  cp = require('child_process'),
  ffmpeg = require('ffmpeg-static'),
  fs = require('fs'),
  crypto = require('crypto'),
  fsReadDirRecGen = require('fs-readdir-rec-gen');

//Tokens
  const inUseTokens = {};
module.exports = (router) => {

  router.get('/', (req, res) =>{
    if (req.query.urlfail){
      res.render('index', {message: "URL Inválida, verifique sua URL e tente novamente!", css: "./assets/css/pages/video/index/index.css?v=0.1"});
    }else if(req.query.private){
      res.render('index', {message: "Esse vídeo é privado ou não foi encontrado.", css: "./assets/css/pages/video/index/index.css?v=0.1"});
    }else{
      res.render('index', {css: "./assets/css/pages/video/index/index.css?v=0.1"});
    }
    
    function filtrarPorExtensao(fileName) {
      return fileName.endsWith('.mp4') || fileName.endsWith('.webm');
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

  router.post('/formatar', (req, res) => {
    const ref = req.body.url;
    if(ytdl.validateURL(ref) == true){
      ytdl.getInfo(ref).then((info) => info).then(async info => {
        let title = info.videoDetails.title,
          thumbnail = info.player_response.videoDetails.thumbnail.thumbnails[4] ? info.player_response.videoDetails.thumbnail.thumbnails[4].url : info.player_response.videoDetails.thumbnail.thumbnails[3].url,
          seconds = info.player_response.videoDetails.lengthSeconds,
          autor = info.player_response.videoDetails.author,
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

        Formatar18[0].qualityLabel = '144p';
        mp4Filtrados.push(Formatar18[0]);

        res.render('video-download', {thumbnail: thumbnail, title: title, seconds: seconds, autor: autor, mp4: mp4Filtrados, webm: webmFiltrados, url: ref, css: "/assets/css/pages/video/formato/formato.css?v=0.1"})
      }).catch((err) => {
        res.redirect('/?private=true');
        console.log("Erro: " + err)
      });}
      else{
      res.redirect('/?urlfail=true');
    }
  })

  router.post('/download', (req, res) => {
    if (req.body.qualidade == 137 || req.body.qualidade == 136 || req.body.qualidade == 135 || req.body.qualidade == 134 || req.body.qualidade == 18){
      var formato = ".mp4";
    } else {
      var formato = ".webm";
    }

    console.log(req.body.qualidade)

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
      seconds = req.body.seconds;
   
    // Obter audio e video
    const audio = ytdl(url, { quality: 'highestaudio' }),
      video = ytdl(url, { quality: `${req.body.qualidade}` });
  
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
    }, 500);
  });

  audio.pipe(ffmpegProcess.stdio[4]);
  video.pipe(ffmpegProcess.stdio[5]);
  
  ffmpegProcess.stdio[6].on('error', (err) => {
    // Remover token do objeto
    delete inUseTokens[token];
    res.status(500).send(err.message);
  });

  ffmpegProcess.stdio[6].on('close', () => {
    res.render('video-downloated', {formato: formato, title: titulo, token: token, thumbnail: thumbnail, seconds: seconds, css: "../assets/css/pages/video/sucesso/sucesso.css?v=0.1"})
    });
  });

  router.post('/baixar', (req, res) =>{
    const formato = req.body.formato,
      token = req.body.token,
      titulo = req.body.titulo;
      console.log(titulo)
    
    res.download(`${token}${formato}`, `dowwnload.com_${titulo}${formato}`, (err) => {
      if (err) {
          console.log("Erro: " + err);
        // Remover token do objeto
          delete inUseTokens[token];
        // Apagar arquivo baixado
          fs.unlink(`${token}${formato}`, (err) => {
            if (err) console.log(err);
            console.log('Aquivo deletado!');
          });
      } else {
        // Remover token do objeto
          delete inUseTokens[token];
        // Apagar arquivo baixado
          fs.unlink(`${token}${formato}`, (err) => {
            if (err) console.log(err);
            console.log('Aquivo deletado!');
          });
      }
    })
  })
}