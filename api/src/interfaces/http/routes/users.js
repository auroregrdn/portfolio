const express = require('express')

module.exports = ({
  services: {
    user: userService
  },
  log
}) => {
  const router = new express.Router()

  // Login user
  router.post('/login', async (req, res) => {
    try {
      const data = req.body

      const response = await userService.login(data)

      if (response.success) {
        res.status(200).send(response)
      } else {
        res.status(400).send(response)
      }
    } catch (err) {
      log.error(err)
      res.status(500).send(err.message)
    }
  })

  const verifyToken = async (req, res, next) => {
    const { authorization } = req.headers

    if (!authorization || !authorization.includes('Bearer ')) {
      return res.status(401).send()
    }

    const token = authorization.replace('Bearer ', '')

    const valid = await userService.verify(token)

    if (!valid) {
      return res.status(401).send()
    }

    next()
  }

  // Login user
  router.get('/verify', verifyToken, async (req, res, next) => {
    try {
      return res.status(200).send()
    } catch (err) {
      log.error(err)
      res.status(500).send(err.message)
    }
  })

  // Creating new user
  router.post('/users', async (req, res, next) => {
    try {
      const data = req.body

      const response = await userService.create(data)

      if (response.success) {
        res.status(201).send(response)
      } else {
        res.status(400).send(response)
      }
    } catch (err) {
      log.error(err)
      res.status(400).send(err.message)
    }
  })

  return router
}
