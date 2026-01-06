const router = require('express').Router()

router.get('/', (res: any) => {
  res.json({ status: 'ok', message: 'API running' })
})

module.exports = router