const express = require('express'),
  hbs = require('express-handlebars'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose');

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
  //Mongoose
    mongoose.Promise = global.Promise;
    mongoose.set('strictQuery', false);
    mongoose.connect("mongodb+srv://admin:123@eusigno.lvwkevj.mongodb.net/?retryWrites=true&w=majority",
        {   useNewUrlParser:true,
            useUnifiedTopology: true
        }).then(()=>{
        console.log("Conectado ao banco de dados!");
    }).catch((err)=>{
        console.log("Erro ao contectar ao banco de dados. Erro: " + err);
    });

//Rotas
  require("./routes")(app);

const PORT = 8085
app.listen(PORT, () => {
    console.log(`Servidor funcionando na porta http://localhost:${PORT}`);
});
