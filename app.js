const express = require('express'),
  hbs = require('express-handlebars'),
  bodyParser = require('body-parser');

const app = express();

//Configs
  //Body Parser
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
  //Handlebars
    app.engine('hbs', hbs.engine({
      extname: 'hbs',
      defaultLayout: 'main',
    })); 
    app.set('view engine','hbs');
  //Conteúdo estatico(CSS, JS, Imagens)
    app.use(express.static('public'));

//Rotas
  require("./routes")(app);

const PORT = 8085
app.listen(PORT, () => {
    console.log(`Servidor funcionando na porta http://localhost:${PORT}`);
});
