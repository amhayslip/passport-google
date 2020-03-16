const express = require('express')
const passport = require('passport')

const mongoose = require('mongoose')
const User = require('./user')

const cookieSession = require('cookie-session')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const app = express()

mongoose.connect('mongodb://localhost/google-passport-fun')

app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: ['helloworld']
  })
)

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => {
  done(null, user._id)
})

passport.deserializeUser((id, done) => {
  done(null, id)
})

passport.use(
  new GoogleStrategy({
      clientID: '812786725020-6t9b7b4b2j6n6vvtjajc0333ku9bpp0u.apps.googleusercontent.com',
      clientSecret: 'q50xXvFYNCb1e38ewnfeZYrV',
      callbackURL: '/auth/google/callback'
    },
    (accessToken, refreshToken, profile, done) => {
      console.log(profile)

      User.findOne({ googleId: profile.id }).then(existingUser => {
        if (existingUser) {
          // we already have a record with the given profile ID
          console.log('existing')
          done(null, existingUser)
        } else {
          // we don't have a user record with this ID, make a new record!
          new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value
          })
            .save()
            .then(user => done(null, user))
        }
      })
    }
  )
)

const googleAuth = passport.authenticate('google',
  { scope: ['profile', 'email'] }
)

app.get('/auth/google', googleAuth)

app.get('/auth/google/callback', googleAuth, (req, res) => {
  res.send('access granted!')
})

app.get('/api/current_user', (req, res) => {
  User.findById(req.user, function (err, user) {
    res.send(user)
  })
})

app.get('/api/logout', (req, res) => {
  req.logout()
  res.send(req.user)
})

app.listen(5000)
