/* ==========================================================================
   Limparte v2 — comportamento partilhado por todas as páginas
   ==========================================================================
   Derivado do site.js do site atual: a lógica (formulários, simulador,
   preços, cenários) é a mesma; muda só o HTML que o JavaScript gera, que
   agora usa as classes do novo design (v2/assets/css/site.css).

   Secções:
     1. Configuração         <- lida de config.js (gerado pelo backoffice)
     2. Utilitários
     3. Menu e navegação
     4. Modal de orçamento
     5. Notificações
     6. Envio de formulários (Formspree + recurso ao WhatsApp)
     7. Simulador de orçamento
     8. Comparador antes / depois
     9. Galeria / lightbox
    10. Arranque
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. CONFIGURAÇÃO
   --------------------------------------------------------------------------
   Tudo o que muda sem tocar no código — contactos, endereço do Formspree,
   preços, escalas e cenários do simulador, mensagens — vem de
   assets/js/config.js, que o backoffice gera. Não o edites à mão: usa o
   backoffice (Definições, Simulador, Mensagens automáticas).

   Enquanto o endereço do Formspree estiver vazio, TODOS os formulários
   passam automaticamente a enviar por WhatsApp com a mensagem já
   preenchida — o site continua a funcionar e nenhum contacto se perde.
   -------------------------------------------------------------------------- */
const CONFIG = window.LIMPARTE_CONFIG || {};

if (!CONFIG.simulador) {
    console.error('[Limparte] assets/js/config.js não foi carregado: o simulador não tem preços. ' +
                  'Gera o site outra vez (npm run build:v2) ou publica pelo backoffice.');
}

const LIMPARTE = Object.assign({
    formspreeEndpoint: '',
    whatsapp: '351912320585',
    telefone: '+351912320585',
    email: 'geral@limparte.com.pt'
}, CONFIG.geral);

/** Texto editável no backoffice. {nome} entra o nome do cliente (ou desaparece, com a pontuação, se não o deu). */
function TXT(chave, padrao, nome) {
    const dados = CONFIG.textos || {};
    let texto = dados[chave] != null ? String(dados[chave]) : padrao;
    if (texto.indexOf('{nome}') !== -1) {
        texto = texto.replace(nome ? '{nome}' : /\s*,?\s*\{nome\}/, () => nome || '');
    }
    return texto;
}

/* --------------------------------------------------------------------------
   2. UTILITÁRIOS
   -------------------------------------------------------------------------- */

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

/** Escapa texto antes de o injetar como HTML. */
function escaparHtml(valor) {
    return String(valor == null ? '' : valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Aceita 912320585, 912 320 585, +351 912 320 585, 00351912320585. */
function telefoneValido(valor) {
    const digitos = String(valor || '').replace(/[\s.()-]/g, '').replace(/^(\+351|00351)/, '');
    return /^[29]\d{8}$/.test(digitos);
}

function emailValido(valor) {
    if (!valor) return true; // o email é sempre opcional nos nossos formulários
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor).trim());
}

/** Monta o link wa.me com a mensagem já escrita. */
function linkWhatsApp(mensagem) {
    return 'https://wa.me/' + LIMPARTE.whatsapp + '?text=' + encodeURIComponent(mensagem);
}

/** Um ícone do sprite (o mesmo que ico() usa no HTML gerado). */
function icoSvg(nome) {
    return '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-' + nome + '"/></svg>';
}

/* --------------------------------------------------------------------------
   3. MENU E NAVEGAÇÃO
   -------------------------------------------------------------------------- */

function toggleMobileMenu(forcarFechar) {
    const menu = $('#mobileMenu');
    const botao = $('#mobileMenuBtn');
    const cab = $('#topo');
    if (!menu) return;

    const vaiAbrir = forcarFechar === true ? false : !menu.classList.contains('aberto');

    menu.classList.toggle('aberto', vaiAbrir);
    document.body.classList.toggle('bloqueado', vaiAbrir);
    if (cab) cab.classList.toggle('menu-on', vaiAbrir);
    if (botao) {
        botao.setAttribute('aria-expanded', String(vaiAbrir));
        botao.setAttribute('aria-label', vaiAbrir ? 'Fechar menu' : 'Abrir menu');
    }
}

/** Submenu "Serviços": o rato é tratado por CSS, o toque e o teclado aqui. */
function toggleServicosMenu(botao) {
    const painel = botao.parentElement.querySelector('.dd-painel');
    if (!painel) return;
    const vaiAbrir = !painel.classList.contains('is-open');
    painel.classList.toggle('is-open', vaiAbrir);
    botao.setAttribute('aria-expanded', String(vaiAbrir));
}

function toggleServicosMobile(botao) {
    const painel = botao.nextElementSibling;
    if (!painel) return;
    const vaiAbrir = painel.classList.contains('hidden');
    painel.classList.toggle('hidden', !vaiAbrir);
    botao.setAttribute('aria-expanded', String(vaiAbrir));
}

/* --------------------------------------------------------------------------
   4. MODAL DE ORÇAMENTO
   -------------------------------------------------------------------------- */

let elementoAnteriorAoModal = null;

function openModal() {
    const modal = $('#quoteModal');
    if (!modal) return;

    elementoAnteriorAoModal = document.activeElement;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const primeiro = modal.querySelector('input, select, textarea, button');
    if (primeiro) primeiro.focus();
}

function closeModal() {
    const modal = $('#quoteModal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (elementoAnteriorAoModal && typeof elementoAnteriorAoModal.focus === 'function') {
        elementoAnteriorAoModal.focus();
    }
    elementoAnteriorAoModal = null;
}

/** Mantém o foco do teclado dentro do modal enquanto este está aberto. */
function prenderFocoNoModal(evento) {
    const modal = $('#quoteModal');
    if (!modal || modal.classList.contains('hidden') || evento.key !== 'Tab') return;

    const focaveis = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea', modal)
        .filter(el => el.offsetParent !== null);
    if (!focaveis.length) return;

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];

    if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
    }
}

/* --------------------------------------------------------------------------
   5. NOTIFICAÇÕES (TOAST)
   -------------------------------------------------------------------------- */

let temporizadorToast = null;

/**
 * @param {string} mensagem
 * @param {{tipo?: 'sucesso'|'erro'|'info', acaoTexto?: string, acaoHref?: string, duracao?: number}} opcoes
 */
function showToast(mensagem, opcoes = {}) {
    const toast = $('#toast');
    const corpo = $('#toastMsg');
    const icone = $('#toastIcon');
    const acao = $('#toastAcao');
    if (!toast || !corpo) return;

    const tipo = opcoes.tipo || 'sucesso';
    const estilos = {
        sucesso: { classe: 't-sucesso', icone: 'visto' },
        erro: { classe: 't-erro', icone: 'alerta' },
        info: { classe: 't-info', icone: 'info' }
    }[tipo];

    toast.className = 'toast ' + estilos.classe;
    if (icone) icone.innerHTML = icoSvg(estilos.icone);
    corpo.textContent = mensagem;

    if (acao) {
        if (opcoes.acaoTexto && opcoes.acaoHref) {
            acao.href = opcoes.acaoHref;
            acao.textContent = opcoes.acaoTexto;
            acao.classList.remove('hidden');
        } else {
            acao.classList.add('hidden');
        }
    }

    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(
        () => toast.classList.add('hidden'),
        opcoes.duracao || (opcoes.acaoHref ? 14000 : 5000)
    );
}

/* --------------------------------------------------------------------------
   6. ENVIO DE FORMULÁRIOS
   --------------------------------------------------------------------------
   Estratégia: tentamos o Formspree (chega ao email da empresa). Se não
   estiver configurado, ou se a rede falhar, mostramos imediatamente um
   botão de WhatsApp com a mensagem inteira já escrita — o contacto nunca
   se perde por causa de um erro técnico.
   -------------------------------------------------------------------------- */

/** Transforma os dados do pedido numa mensagem legível para o WhatsApp. */
function mensagemWhatsApp(dados) {
    const linhas = ['Olá! Gostaria de pedir um orçamento.', ''];
    Object.entries(dados).forEach(([rotulo, valor]) => {
        if (valor) linhas.push(rotulo + ': ' + valor);
    });
    return linhas.join('\n');
}

function marcarBotaoAEnviar(botao, aEnviar) {
    if (!botao) return;
    if (aEnviar) {
        botao.dataset.textoOriginal = botao.innerHTML;
        botao.disabled = true;
        botao.innerHTML = '<span class="spin" aria-hidden="true"></span> A enviar…';
    } else {
        botao.disabled = false;
        if (botao.dataset.textoOriginal) botao.innerHTML = botao.dataset.textoOriginal;
    }
}

/**
 * Envia um pedido de orçamento.
 * @param {object} dados        Pares rótulo → valor, já legíveis por humanos.
 * @param {object} opcoes       { botao, origem, aoConcluir }
 */
async function enviarPedido(dados, opcoes = {}) {
    const { botao, origem = 'Site', aoConcluir } = opcoes;
    const nome = dados['Nome'] || '';
    const urlWhats = linkWhatsApp(mensagemWhatsApp(dados));

    // Sem Formspree configurado: vamos diretos ao WhatsApp.
    if (!LIMPARTE.formspreeEndpoint) {
        window.open(urlWhats, '_blank', 'noopener');
        showToast(
            TXT('js.form.ok_whatsapp', 'Obrigado {nome}! Abrimos o WhatsApp com o seu pedido preenchido — só precisa de tocar em enviar.', nome),
            { tipo: 'info', acaoTexto: TXT('js.form.nao_abriu', 'Não abriu? Toque aqui'), acaoHref: urlWhats }
        );
        if (aoConcluir) aoConcluir(true);
        return;
    }

    marcarBotaoAEnviar(botao, true);

    try {
        const resposta = await fetch(LIMPARTE.formspreeEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(Object.assign({ _subject: 'Novo pedido de orçamento — ' + origem }, dados))
        });

        if (!resposta.ok) throw new Error('Resposta ' + resposta.status);

        showToast(
            TXT('js.form.ok_email', 'Obrigado {nome}! Recebemos o seu pedido e entramos em contacto dentro de 24 horas úteis.', nome),
            { tipo: 'sucesso' }
        );
        if (aoConcluir) aoConcluir(true);
    } catch (erro) {
        console.warn('[Limparte] Falha no envio do formulário:', erro);
        showToast(
            TXT('js.form.falhou', 'Não conseguimos enviar o pedido pela internet. Envie-nos por WhatsApp — a mensagem já vai preenchida.'),
            { tipo: 'erro', acaoTexto: TXT('js.form.falhou_botao', 'Enviar por WhatsApp'), acaoHref: urlWhats }
        );
        if (aoConcluir) aoConcluir(false);
    } finally {
        marcarBotaoAEnviar(botao, false);
    }
}

/** Validação comum a todos os formulários. Devolve null se estiver tudo bem. */
function validarContacto({ nome, telefone, email, consentimento }) {
    if (!nome || nome.trim().length < 2) return TXT('js.valida.nome', 'Indique o seu nome.');
    if (!telefoneValido(telefone)) return TXT('js.valida.telefone', 'Indique um número de telemóvel ou telefone português válido (9 dígitos).');
    if (!emailValido(email)) return TXT('js.valida.email', 'O endereço de email não parece válido.');
    if (consentimento === false) return TXT('js.valida.consentimento', 'É necessário autorizar o contacto para podermos responder.');
    return null;
}

/* --------------------------------------------------------------------------
   7. SIMULADOR DE ORÇAMENTO
   -------------------------------------------------------------------------- */

/* Os preços, as escalas, os cenários e as notas de estado vêm de config.js
   (ver 1. Configuração). No backoffice: menu «Simulador». O que está aqui é
   só o estado da conversa com o visitante. */
const SIMULADOR = Object.assign({
    passo: 1,
    tipoImovel: 'Moradia',
    estado: 'Razoável',
    tarifas: {}, escalas: {}, multiplicadores: {}, minimoFaturavel: 0
}, CONFIG.simulador);

const CENARIOS = CONFIG.cenarios || {};
const ESTADOS = CONFIG.estados || {};

function selectProperty(botao, tipo) {
    $$('.prop-btn').forEach(b => {
        b.classList.remove('is-on');
        b.setAttribute('aria-pressed', 'false');
    });
    botao.classList.add('is-on');
    botao.setAttribute('aria-pressed', 'true');

    SIMULADOR.tipoImovel = tipo;
    updateCalc();
}

function escalaAtual() {
    return SIMULADOR.escalas[servicoSelecionado()] || SIMULADOR.escalas.telhado_fachada;
}

function updateArea(valor) {
    const display = $('#areaDisplay');
    if (display) display.textContent = valor + ' ' + escalaAtual().unidade;
    updateCalc();
}

/** Reconfigura o slider quando o serviço muda: cada um tem a sua unidade. */
function aplicarEscala() {
    const slider = $('#areaSlider');
    if (!slider) return;

    const e = escalaAtual();
    slider.min = e.min;
    slider.max = e.max;
    slider.step = e.passo;
    slider.value = e.omissao;

    const rotulo = $('#areaLabel');
    const minimo = $('#areaMin');
    const maximo = $('#areaMax');
    if (rotulo) rotulo.textContent = e.rotulo;
    if (minimo) minimo.textContent = e.min + ' ' + e.unidade;
    if (maximo) maximo.textContent = e.max + ' ' + e.unidade;

    updateArea(e.omissao);
}

function servicoSelecionado() {
    // Numa página de serviço o formulário traz data-servico e não há botões.
    const formulario = $('#quoteForm');
    if (formulario && formulario.dataset.servico) return formulario.dataset.servico;

    const marcado = $$('input[name="service"]').find(r => r.checked);
    return marcado ? marcado.value : 'telhado_fachada';
}

/** Estado declarado do imóvel: muda a mensagem e, se degradado, o próprio pedido. */
function selectEstado(botao, estado) {
    $$('.estado-btn').forEach(b => {
        b.classList.remove('is-on');
        b.setAttribute('aria-pressed', 'false');
    });
    botao.classList.add('is-on');
    botao.setAttribute('aria-pressed', 'true');

    SIMULADOR.estado = estado;
    updateCalc();
}

/* --- Formatação de valores ------------------------------------------------ */

function moedaEur(valor) {
    // 'always' é necessário: por omissão o pt-PT só agrupa a partir de 5 dígitos,
    // o que daria "1020 €" ao lado de "10 500 €" no mesmo bloco.
    return new Intl.NumberFormat('pt-PT', {
        maximumFractionDigits: 0,
        useGrouping: 'always'
    }).format(Math.round(valor)) + ' €';
}

function intervaloEur(min, max) {
    return moedaEur(min) + ' – ' + moedaEur(max);
}

function porM2Ano(valor) {
    return valor.toFixed(2).replace('.', ',') + ' €/m²/ano';
}

/* --- Construção do bloco de cenários -------------------------------------- */

function linhaCenario({ rotulo, valor, nota, alerta }) {
    return '<div class="ctx-linha' + (alerta ? ' alerta' : '') + '">' +
        '<div><p>' + escaparHtml(rotulo) + '</p>' +
        (nota ? '<small>' + escaparHtml(nota) + '</small>' : '') + '</div>' +
        '<b>' + escaparHtml(valor) + '</b>' +
    '</div>';
}

/**
 * Devolve o HTML do comparador, ou string vazia quando não há nada útil a
 * dizer. É deliberado: um comparador que aparece sempre acaba por mentir
 * em metade dos casos.
 */
function construirCenarios(chaveServico, area, precoServicoMin, precoServicoMax) {
    const cfg = CENARIOS[chaveServico];
    if (!cfg) return '';

    let linhas = '';
    let remate = cfg.remate || '';

    // 1. Custo por ano — só onde a conta nos favorece (pintura).
    if (cfg.custoAno) {
        const c = cfg.custoAno;
        const tarifa = SIMULADOR.tarifas[chaveServico].base;

        const nosso = tarifa / c.vidaSistema;
        const deles = c.rivalM2 / c.rivalVida;

        const rivalTotal = area * c.rivalM2;
        const repeticoes = Math.round(c.vidaSistema / c.rivalVida);
        const gastoRival = rivalTotal * repeticoes;
        const gastoNosso = area * tarifa;
        const diferenca = gastoRival - gastoNosso;

        linhas += linhaCenario({
            rotulo: 'Sistema completo Limparte',
            nota: 'Dura cerca de ' + c.vidaSistema + ' anos',
            valor: porM2Ano(nosso)
        });
        linhas += linhaCenario({
            rotulo: c.rivalRotulo,
            nota: 'Dura cerca de ' + c.rivalVida + ' anos',
            valor: porM2Ano(deles)
        });

        if (diferenca > 0) {
            remate = 'Ao fim de ' + c.vidaSistema + ' anos, a opção barata terá sido aplicada ' +
                     repeticoes + ' vezes e custado mais ' + moedaEur(diferenca) + '.';
        }
    }

    // 2. Retorno energético — painéis solares.
    if (cfg.energia) {
        const e = cfg.energia;
        const kwp = area * e.kwpPorPainel;
        const perdidoAno = kwp * e.kwhPorKwpAno * e.perda * e.precoKwh;

        if (perdidoAno > 0) {
            linhas += linhaCenario({
                rotulo: 'Produção perdida por sujidade, todos os anos',
                nota: 'Estimativa para ' + kwp.toFixed(1).replace('.', ',') + ' kWp no Litoral Norte',
                valor: moedaEur(perdidoAno) + '/ano'
            });

            const meses = Math.round((precoServicoMin / perdidoAno) * 12);
            remate = meses <= 36
                ? 'A limpeza paga-se em cerca de ' + meses + ' meses com a produção recuperada.'
                : 'O retorno depende muito do estado dos módulos — confirmamo-lo com a leitura do inversor antes e depois.';
        }
    }

    // 3. Alternativas mais pesadas e custo de não fazer nada.
    (cfg.alternativas || []).forEach(alt => {
        const min = alt.tipo === 'm2' ? area * alt.min : alt.min;
        const max = alt.tipo === 'm2' ? area * alt.max : alt.max;
        linhas += linhaCenario({
            rotulo: alt.rotulo,
            valor: intervaloEur(min, max),
            alerta: alt.alerta
        });
    });

    if (!linhas) return '';

    return '<div class="ctx">' +
        '<p class="ctx-titulo">Para contexto</p>' + linhas +
        (remate ? '<p class="ctx-remate">' + escaparHtml(remate) + '</p>' : '') +
        '<p class="ctx-legal">Valores de referência de mercado, para comparação. Os trabalhos de ' +
        'substituição integral e de construção não são executados pela Limparte.</p>' +
    '</div>';
}

function updateCalc() {
    const slider = $('#areaSlider');
    const alvo = $('#estimateRange');
    if (!slider || !alvo) return;

    const area = parseInt(slider.value, 10);
    const chave = servicoSelecionado();
    const tarifa = SIMULADOR.tarifas[chave] || SIMULADOR.tarifas.telhado_fachada;

    let precoM2 = tarifa.base;
    Object.entries(SIMULADOR.multiplicadores).forEach(([chaveImovel, fator]) => {
        if (SIMULADOR.tipoImovel.includes(chaveImovel)) precoM2 *= fator;
    });

    const minimo = Math.max(SIMULADOR.minimoFaturavel, Math.round(area * precoM2 * 0.85));
    const maximo = Math.max(minimo + 60, Math.round(area * precoM2 * 1.15));

    alvo.textContent = moedaEur(minimo) + ' – ' + moedaEur(maximo) + ' + IVA';

    const resumo = $('#estimateResumo');
    if (resumo) {
        resumo.textContent = tarifa.rotulo + ' · ' + SIMULADOR.tipoImovel + ' · ' + area + ' ' +
            escalaAtual().unidade + ' · estado ' + SIMULADOR.estado.toLowerCase();
    }

    const degradado = SIMULADOR.estado === 'Degradado';

    // Com o imóvel degradado não damos um número automático: damos uma visita.
    const numeros = $('#estimateNumeros');
    const aviso = $('#estimateAviso');
    if (numeros) numeros.classList.toggle('hidden', degradado);
    if (aviso) aviso.classList.toggle('hidden', !degradado);

    const botaoSubmeter = $('#submitCalcBtn');
    if (botaoSubmeter) {
        botaoSubmeter.innerHTML = degradado
            ? icoSvg('escudo') + ' ' + TXT('js.sim.visita', 'Pedir visita técnica')
            : icoSvg('enviar') + ' ' + TXT('js.sim.enviar', 'Enviar pedido');
    }

    // Nota do estado
    const notaEstado = $('#estadoNota');
    if (notaEstado) {
        const e = ESTADOS[SIMULADOR.estado];
        notaEstado.className = 'estado-nota ' + e.classe;
        notaEstado.innerHTML = icoSvg(e.icone) + '<span>' + escaparHtml(e.nota) + '</span>';
    }

    // Comparador de cenários
    const bloco = $('#cenarioBlock');
    if (bloco) {
        bloco.innerHTML = degradado ? '' : construirCenarios(chave, area, minimo, maximo);
    }
}

/* Quais os passos presentes nesta página. Na inicial são os três; numa
   página de serviço o passo 1 não existe, porque o serviço já está escolhido. */
function passosDisponiveis() {
    return [1, 2, 3].filter(n => $('#step' + n + 'Content'));
}

const TITULOS_PASSO = {
    get 1() { return TXT('js.passo.1', 'Selecione o serviço'); },
    get 2() { return TXT('js.passo.2', 'Tipo de imóvel e área estimada'); },
    get 3() { return TXT('js.passo.3', 'Os seus dados para envio do orçamento'); }
};

function nextStep(direcao) {
    const passos = passosDisponiveis();
    if (!passos.length) return;

    let indice = passos.indexOf(SIMULADOR.passo);
    if (indice === -1) indice = 0;
    indice = Math.min(passos.length - 1, Math.max(0, indice + direcao));

    SIMULADOR.passo = passos[indice];
    const numero = indice + 1;          // o que o visitante vê
    const total = passos.length;

    passos.forEach(n => {
        $('#step' + n + 'Content').classList.toggle('hidden', n !== SIMULADOR.passo);
    });

    const titulo = $('#stepTitle');
    const badge = $('#stepBadge');
    const progresso = $('#stepProgress');
    const barra = $('#stepBar');

    if (titulo) titulo.textContent = 'Passo ' + numero + ': ' + TITULOS_PASSO[SIMULADOR.passo];
    if (badge) badge.textContent = numero;
    if (progresso) progresso.textContent = 'Passo ' + numero + ' de ' + total;
    if (barra) barra.style.width = Math.round((numero / total) * 100) + '%';

    const anterior = $('#prevBtn');
    const seguinte = $('#nextBtn');
    const submeter = $('#submitCalcBtn');
    const ultimo = indice === total - 1;
    if (anterior) anterior.classList.toggle('hidden', indice === 0);
    if (seguinte) seguinte.classList.toggle('hidden', ultimo);
    if (submeter) submeter.classList.toggle('hidden', !ultimo);

    if (direcao !== 0) {
        const cartao = $('#simuladorCard');
        if (cartao) cartao.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function submitSimulation() {
    const nome = $('#calcName').value.trim();
    const telefone = $('#calcPhone').value.trim();
    const email = ($('#calcEmail') || {}).value || '';
    const consentimento = $('#calcConsent') ? $('#calcConsent').checked : true;

    const erro = validarContacto({ nome, telefone, email, consentimento });
    if (erro) {
        showToast(erro, { tipo: 'erro' });
        return;
    }

    const tarifa = SIMULADOR.tarifas[servicoSelecionado()];
    const degradado = SIMULADOR.estado === 'Degradado';

    enviarPedido({
        'Nome': nome,
        'Telefone': telefone,
        'Email': email.trim(),
        'Serviço': tarifa ? tarifa.rotulo : servicoSelecionado(),
        'Tipo de imóvel': SIMULADOR.tipoImovel,
        'Estado declarado': SIMULADOR.estado,
        'Dimensão indicada': $('#areaSlider').value + ' ' + escalaAtual().unidade,
        'Estimativa apresentada': degradado
            ? 'Não apresentada — pedido de visita técnica'
            : $('#estimateRange').textContent,
        'Concelho': $('#calcLocation').value,
        'Observações': $('#calcNotes').value.trim()
    }, {
        botao: $('#submitCalcBtn'),
        origem: degradado ? 'Simulador — visita técnica' : 'Simulador',
        aoConcluir: sucesso => {
            if (!sucesso) return;
            $('#quoteForm').reset();
            SIMULADOR.passo = passosDisponiveis()[0];
            SIMULADOR.estado = 'Razoável';
            const porOmissao = $$('.estado-btn').find(b => b.dataset.estado === 'Razoável');
            if (porOmissao) selectEstado(porOmissao, 'Razoável');
            nextStep(0);
            updateCalc();
        }
    });
}

/* --- Formulário do modal --- */
function handleModalForm() {
    const nome = $('#modalName').value.trim();
    const telefone = $('#modalPhone').value.trim();
    const consentimento = $('#modalConsent') ? $('#modalConsent').checked : true;

    const erro = validarContacto({ nome, telefone, consentimento });
    if (erro) {
        showToast(erro, { tipo: 'erro' });
        return;
    }

    const select = $('#modalService');

    enviarPedido({
        'Nome': nome,
        'Telefone': telefone,
        'Serviço pretendido': select.options[select.selectedIndex].text,
        'Localidade': $('#modalLoc').value.trim()
    }, {
        botao: $('#modalSubmitBtn'),
        origem: 'Modal de orçamento',
        aoConcluir: sucesso => {
            if (!sucesso) return;
            $('#modalForm').reset();
            closeModal();
        }
    });
}

/* --- Formulário curto do rodapé --- */
function handleFooterForm() {
    const nome = $('#footerName').value.trim();
    const telefone = $('#footerPhone').value.trim();
    const consentimento = $('#footerConsent') ? $('#footerConsent').checked : true;

    const erro = validarContacto({ nome, telefone, consentimento });
    if (erro) {
        showToast(erro, { tipo: 'erro' });
        return;
    }

    enviarPedido({
        'Nome': nome,
        'Telefone': telefone,
        'Página de origem': document.title
    }, {
        botao: $('#footerSubmitBtn'),
        origem: 'Rodapé',
        aoConcluir: sucesso => {
            if (sucesso) $('#footerForm').reset();
        }
    });
}

/* --------------------------------------------------------------------------
   8. COMPARADOR ANTES / DEPOIS
   --------------------------------------------------------------------------
   Um comparador grande com separadores por caso. As imagens de cada caso vêm
   dos atributos data-* dos botões (ver build/v2/home.mjs).
   -------------------------------------------------------------------------- */

function iniciarComparador() {
    const caixa = $('#comparador');
    const range = $('#comparadorRange');
    if (!caixa || !range) return;

    const antes = $('.cmp-antes', caixa);
    const depois = $('.cmp-depois', caixa);
    const divisor = $('.cmp-divisor', caixa);

    const posicionar = (valor) => {
        depois.style.clipPath = 'inset(0 0 0 ' + valor + '%)';
        divisor.style.left = valor + '%';
        range.setAttribute('aria-valuetext', 'A mostrar ' + (100 - valor) + '% do depois');
    };

    range.addEventListener('input', () => posicionar(range.value));

    $$('.cmp-tab').forEach(separador => {
        separador.addEventListener('click', () => {
            $$('.cmp-tab').forEach(t => t.setAttribute('aria-selected', String(t === separador)));

            antes.src = separador.dataset.antes;
            antes.alt = separador.dataset.antesAlt;
            depois.src = separador.dataset.depois;
            depois.alt = separador.dataset.depoisAlt;

            const titulo = $('#comparadorTitulo');
            if (titulo) titulo.textContent = separador.dataset.titulo;

            range.value = 50;
            posicionar(50);
        });
    });

    posicionar(range.value);
}

/* --------------------------------------------------------------------------
   9. GALERIA / LIGHTBOX
   -------------------------------------------------------------------------- */

let elementoAnteriorAoLightbox = null;

function abrirLightbox(src, legenda) {
    let caixa = $('#lightbox');
    elementoAnteriorAoLightbox = document.activeElement;

    if (!caixa) {
        caixa = document.createElement('div');
        caixa.id = 'lightbox';
        caixa.className = 'lightbox hidden';
        caixa.setAttribute('role', 'dialog');
        caixa.setAttribute('aria-modal', 'true');
        caixa.setAttribute('aria-label', 'Imagem ampliada');
        caixa.innerHTML =
            '<button type="button" class="modal-x" onclick="fecharLightbox()" aria-label="Fechar imagem">' +
            icoSvg('fechar') + '</button>' +
            '<img id="lightboxImg" src="" alt=""><p id="lightboxCap"></p>';
        document.body.appendChild(caixa);
        caixa.addEventListener('click', evento => {
            if (evento.target === caixa) fecharLightbox();
        });
    }

    $('#lightboxImg').src = src;
    $('#lightboxImg').alt = legenda || '';
    $('#lightboxCap').textContent = legenda || '';
    caixa.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    $('.modal-x', caixa).focus();
}

function fecharLightbox() {
    const caixa = $('#lightbox');
    if (!caixa) return;
    caixa.classList.add('hidden');
    document.body.style.overflow = '';
    if (elementoAnteriorAoLightbox && typeof elementoAnteriorAoLightbox.focus === 'function') {
        elementoAnteriorAoLightbox.focus();
    }
    elementoAnteriorAoLightbox = null;
}

/* --------------------------------------------------------------------------
   10. ARRANQUE
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // Ano corrente no rodapé
    $$('.ano-corrente').forEach(el => { el.textContent = new Date().getFullYear(); });

    // Cabeçalho: transparente sobre o herói, sólido depois de sair do topo
    const cab = $('#topo');
    if (cab && cab.dataset.fixo !== 'solido') {
        const aoRolar = () => cab.classList.toggle('solido', window.scrollY > 40);
        aoRolar();
        window.addEventListener('scroll', aoRolar, { passive: true });
    }

    // Fecha o modal ao clicar fora do cartão
    const modal = $('#quoteModal');
    if (modal) {
        modal.addEventListener('click', evento => {
            if (evento.target === modal) closeModal();
        });
    }

    // Teclado: Esc fecha o que estiver aberto; Tab fica preso no modal
    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') {
            const lightbox = $('#lightbox');
            const menuMovel = $('#mobileMenu');
            if (lightbox && !lightbox.classList.contains('hidden')) {
                fecharLightbox();
            } else if (modal && !modal.classList.contains('hidden')) {
                closeModal();
            } else if (menuMovel && menuMovel.classList.contains('aberto')) {
                toggleMobileMenu(true);
            } else {
                $$('.dd-painel.is-open').forEach(p => p.classList.remove('is-open'));
            }
        }
        prenderFocoNoModal(evento);
    });

    // Fecha o submenu de serviços ao clicar fora
    document.addEventListener('click', evento => {
        if (!evento.target.closest('.dd')) {
            $$('.dd-painel.is-open').forEach(p => {
                p.classList.remove('is-open');
                const botao = p.parentElement.querySelector('[aria-expanded]');
                if (botao) botao.setAttribute('aria-expanded', 'false');
            });
        }
    });

    iniciarComparador();

    // Simulador
    if ($('#areaSlider')) {
        SIMULADOR.passo = passosDisponiveis()[0];
        $$('input[name="service"]').forEach(r => r.addEventListener('change', aplicarEscala));
        aplicarEscala();
        nextStep(0);
    }

    // Aviso em consola se os formulários ainda não estiverem ligados ao email
    if (!LIMPARTE.formspreeEndpoint) {
        console.info(
            '[Limparte] Formspree por configurar: os formulários estão a encaminhar para o WhatsApp. ' +
            'Cola o endereço no backoffice (Definições → Formulários) para receberes os pedidos por email.'
        );
    }
});
