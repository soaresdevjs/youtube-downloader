const crypto = require('crypto');
const express = require('express');
const ytdl = require('ytdl-core');
const { ffmpegPath, ffprobePath } = require('ffmpeg-static');
const { execFile } = require('child_process');
const app = express();
const inUseTokens = {};

app.get('/download', (req, res) => {
  // Capturar o token enviado pelo usuário
  const token = req.headers.token;

//   // Verificar se o token é válido
//   if (!inUseTokens[token]) {
//     res.status(401).send('Unauthorized');
//     return;
//   }

  // Obter URL do vídeo
  const url = req.body.url;
  const videoStream = ytdl(url);

  // Iniciar conversão com ffmpeg-static
  const ffmpegCommand = `-i pipe:0 -c:v libx264 -c:a aac -f mp4 ${token}.mp4`;
  const ffmpeg = execFile(ffmpegPath, ffmpegCommand.split(" "), {stdio: ['pipe', 'pipe', 'pipe']});

  videoStream.pipe(ffmpeg.stdin);

  ffmpeg.on('error', (err) => {
    // Remover token do objeto
    delete inUseTokens[token];
    res.status(500).send(err.message);
  });

  ffmpeg.on('close', (code) => {
    // Remover token do objeto
    delete inUseTokens[token];
    res.download(`${token}.mp4`);
  });
});

app.post('/token', (req, res) => {
  // Gerar token aleatório
  const token = crypto.randomBytes(20).toString('hex');

  // Adicionar token ao objeto
  inUseTokens[token] = true;

  // Retornar token para o usuário
  res.json({ token });
});

app.listen(8087, () => {
  console.log('Server running on http://localhost:8087');
});

