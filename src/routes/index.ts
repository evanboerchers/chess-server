import { Router } from "express"
import TestScenariosRouter from "./test-scenarios"

const router = Router();
router.get('/', (_req, res) => {
    res.send("Hello, this is the coffee chess api server")
})
router.use('/test-scenarios', TestScenariosRouter)

export default router