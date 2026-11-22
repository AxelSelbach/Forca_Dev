import process from "node:process";
import { prisma } from "./prisma";

const palavras : [string, string][] = [
    ['PROMISE', 'JavaScript'], ['CALLBACK', 'JavaScript'],
    ['CLOSURE', 'JavaScript'], ['ARRAY', 'JavaScript'],
    ['FUNCTION', 'JavaScript'], ['ASYNC', 'JavaScript'],
    ['VARIAVEL', 'JavaScript'], ['OBJETO', 'JavaScript'],
    ['INTERFACE', 'TypeScript'], ['GENERICS', 'TypeScript'],
    ['TIPAGEM', 'TypeScript'], ['ENUM', 'TypeScript'],
    ['UNION', 'TypeScript'], ['NARROWING', 'TypeScript'],
    ['DECORATOR', 'TypeScript'], ['MODULO', 'TypeScript'],
    ['COMPONENTE', 'React'], ['ESTADO', 'React'],
    ['PROPS', 'React'], ['HOOKS', 'React'],
    ['EFEITO', 'React'], ['RENDERIZACAO', 'React'],
    ['CONTEXTO', 'React'], ['FRAGMENT', 'React'],
]

async function main() {
    await prisma.$transaction(
        palavras.map(([texto, categoria]) =>
            prisma.palavra.upsert({
                where: { texto },
                update: {},
                create: { texto, categoria }
            })
        )
    )
    console.log('Seed concluído:', await prisma.palavra.count(), 'palavras')
}

main().catch((err) => {
    console.error(err)
    process.exitCode = 1
}).finally(() => prisma.$disconnect())