const indexRouter = require('./routes/index');

module.exports = (app) =>{
    app.use('/pt', indexRouter);
    app.use('*', (req, res) => {
        res.redirect('/pt')
    })
}