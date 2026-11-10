// Hook Stop: pede uma revisão final só quando a resposta foi uma tarefa grande.
// Respostas curtas (perguntas, leituras, um ajuste) terminam direto, sem a volta extra.
const fs = require('fs')

// "Tarefa grande" = editou vários arquivos OU usou muitas ferramentas na resposta.
const MIN_ARQUIVOS_EDITADOS = 3
const MIN_FERRAMENTAS = 25
const FERRAMENTAS_DE_EDICAO = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])

function lerEntrada() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
  } catch {
    return {}
  }
}

function ehMensagemDoUsuario(item) {
  if (item.type !== 'user' || item.isMeta) return false
  const content = item.message && item.message.content
  if (typeof content === 'string') return true
  return Array.isArray(content) && !content.some((bloco) => bloco && bloco.type === 'tool_result')
}

// Percorre o transcript de trás pra frente até a última mensagem do usuário,
// contando as ferramentas usadas e os arquivos editados nessa resposta.
function medirResposta(transcriptPath) {
  const medida = { ferramentas: 0, arquivos: new Set() }
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return medida

  const linhas = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean)
  for (let i = linhas.length - 1; i >= 0; i--) {
    let item
    try {
      item = JSON.parse(linhas[i])
    } catch {
      continue
    }
    if (item.isSidechain) continue
    if (ehMensagemDoUsuario(item)) break
    if (item.type !== 'assistant') continue

    const content = (item.message && item.message.content) || []
    if (!Array.isArray(content)) continue
    for (const bloco of content) {
      if (!bloco || bloco.type !== 'tool_use') continue
      medida.ferramentas++
      if (FERRAMENTAS_DE_EDICAO.has(bloco.name)) {
        const input = bloco.input || {}
        medida.arquivos.add(input.file_path || input.notebook_path || '?')
      }
    }
  }
  return medida
}

const entrada = lerEntrada()
if (entrada.stop_hook_active) process.exit(0)

const { ferramentas, arquivos } = medirResposta(entrada.transcript_path)
const ehTarefaGrande = arquivos.size >= MIN_ARQUIVOS_EDITADOS || ferramentas >= MIN_FERRAMENTAS
if (!ehTarefaGrande) process.exit(0)

console.log(JSON.stringify({
  decision: 'block',
  reason:
    `Tarefa grande (${ferramentas} ferramentas, ${arquivos.size} arquivos editados). ` +
    'Antes de finalizar, revise: o pedido foi atendido por completo? Algo ficou sem testar ' +
    'ou pela metade? Se estiver tudo certo, confirme em uma frase curta, sem repetir o resumo.'
}))

process.exit(0)
