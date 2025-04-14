require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const MyError = require('./modules/cerror');
const { create } = require('express-handlebars');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const hbs = create({
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
      json: function (context) {
        return JSON.stringify(context);
      },
      times: function(n, block) {
        let accum = '';
        for(let i = 1; i < n+1; ++i)
          accum += block.fn(i);
        return accum;
      },
      add: function(a, b) {
        return a + b;
      },
      subtract: function(a, b) {
        return a - b;
      },
      eq: function(a, b) {
        return a === b;
      },
      neq: function(a, b) {
        return a != b;
      }
    }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', "./views");
app.use(cookieParser());

app.use(express.static("./public"));
app.use(express.json());

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const userRouter = require('./routes/userRouter');
const homeRouter = require('./routes/homeRouter');
const authRouter = require('./routes/authRouter');
const productRouter = require('./routes/productRouter');
const cartRouter = require('./routes/cartRouter');

app.use('/', homeRouter); 
app.use('/user', userRouter); 
app.use('/auth', authRouter);
app.use('/product', productRouter);
app.use('/cart', cartRouter);


app.use((req, res, next) => {
  next(new MyError(404, "The page you're looking for doesn't exist."))
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).render(`error/error${status}`, {
    pcss: () => 'css/bs',
    layout: 'blank',
    statusCode: status,
    message: err.message,
    desc: err.desc
  });
});

const server = https.createServer({ 
  key: fs.readFileSync(path.join(__dirname, '/.ssl/key.pem')), 
  cert: fs.readFileSync(path.join(__dirname, '/.ssl/cert.pem')),
  passphrase: process.env.PASSPHRASE
}, app);

server.listen(port, () => {
  console.log(`Main server running on port ${port}, link: https://localhost:${port}/`);
}).on('error', (err) => {
  console.error('Error starting server:', err.message);
});
