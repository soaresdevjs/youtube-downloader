const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Estrelas = new Schema({
    estrelas:{
        type: Number,
        required: true,
    },
    data: {
        type: Date,
        default: Date.now()
    }
})

mongoose.model("estrelas", Estrelas)