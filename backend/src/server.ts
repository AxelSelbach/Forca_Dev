import { criarApp } from "./app";

const PORTA = Number(process.env.PORT ?? 3333)
const app = criarApp()

app.listen({port: PORTA})
.then(()=> console.log(`API em http://localhost:${PORTA}`))
.catch((err)=>{
    console.error(err)
    process.exit(1)
})