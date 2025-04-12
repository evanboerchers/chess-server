import { Router } from "express"

const router = Router();

router.get('/', (_req, res) => {
    res.send("Hello, this is the coffee chess api server")
})

export default router