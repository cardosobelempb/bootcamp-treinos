# Contributing (Agent Rules)

Este arquivo contém as regras de contribuição e de commits que agentes e colaboradores devem seguir neste workspace.

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

## Regras específicas para agentes

- **Sempre** use Conventional Commits ao commitar alterações automatizadas.
- **NUNCA** commite sem pedir permissão do usuário quando o arquivo estiver fora de `backend/`.
- Ao criar ou modificar arquivos de configuração, inclua um comentário explicando a razão da mudança.
- Ao adicionar novas rotas ou use cases, atualize os arquivos de documentação em `docs/`.

## Hooks e validação

Recomendamos usar um hook local (por exemplo `husky` + `commitlint`) para validar mensagens de commit antes de aceitar o commit. Se desejar, posso adicionar um `commitlint` config e `husky` hook ao projeto.

## Como escrever um bom commit

- Use o tempo imperativo: `Add`, `Fix`, `Remove` (não: `Added`, `Fixes`)
- Mantenha o `subject` curto (<= 72 caracteres)
- Explique o _why_ no corpo do commit, se necessário

## Passos rápidos

1. Faça suas alterações
2. Rode `npm test` quando aplicável
3. Stage as mudanças: `git add .`
4. Commit com a mensagem no formato Conventional Commits

---

Este arquivo é a fonte de verdade para regras de contribuição e agentes. O arquivo `backend/CONTRIBUTING.md` foi mantido como referência local; prefira `.claude/roles/CONTRIBUTING.md` para políticas de agentes.
