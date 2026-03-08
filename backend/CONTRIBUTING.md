# Contributing

Obrigado por contribuir com este projeto!

## Regras de commits

Este repositório usa o estilo **Conventional Commits** para mensagens de commit. Sempre escreva suas mensagens seguindo o padrão abaixo.

Formato básico:

<type>(<scope>): <subject>

- `type`: feat, fix, docs, style, refactor, perf, test, chore, build, ci
- `scope` (opcional): o escopo afetado, por exemplo `workout-plan`, `auth`
- `subject`: descrição curta em inglês (imperative, sem ponto final)

Exemplos:

- `feat(workout-plan): add coverImageUrl to workout plan and days`
- `fix(auth): handle missing session token`
- `chore: update dependencies`

Motivos:

- Facilita geração de changelogs automáticos
- Padroniza histórico de commits
- Ajuda integração com pipelines e releases

## Hooks e validação

Recomendamos usar um hook local (por exemplo `husky` + `commitlint`) para validar mensagens de commit antes de aceitar o commit. Se desejar, posso adicionar um `commitlint` config e `husky` hook ao projeto.

## Como escrever um bom commit

- Use o tempo imperativo: `Add`, `Fix`, `Remove` (não: `Added`, `Fixes`)
- Mantenha o `subject` curto (<= 72 caracteres)
- Explique o *why* no corpo do commit, se necessário

## Passos rápidos

1. Faça suas alterações
2. Rode `npm test` quando aplicável
3. Stage as mudanças: `git add .`
4. Commit com a mensagem no formato Conventional Commits

---

Se quiser que eu configure `husky` e `commitlint` automaticamente, diga "Sim, configurar hooks" e eu faço isso para você.