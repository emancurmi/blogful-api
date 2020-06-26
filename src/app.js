require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const ArticlesService = require('./articles-service')

const app = express()
const jsonParser = express.json()

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common'))
app.use(cors())
app.use(helmet())

app.get('/articles', (req, res, next) => {
    const knexInstance = req.app.get('db')
    ArticlesService.getAllArticles(knexInstance)
        .then(articles => {
            res.json(articles)
        })
        .catch(next)
})

app.post('/articles', jsonParser, (req, res, next) => {
    const { title, content, style } = req.body
    const newArticle = { title, content, style }
    ArticlesService.insertArticle(
        req.app.get('db'),
        newArticle
    )
        .then(article => {
            res
                .status(201)
                .location('/articles/${article.id}')
                .json(article)
        })
        .catch(next)
})

app.get('/articles/:article_id', (req, res, next) => {
    const knexInstance = req.app.get('db')
    ArticlesService.getById(knexInstance, req.params.article_id)
        .then(article => {
            if (!article) {
                return res.stats(404).json({
                    error: { message: `Article doesn't exist` }
                })
            }
            res.json(article)
        })
        .catch(next)
})

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: 'Server error' }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})

module.exports = app