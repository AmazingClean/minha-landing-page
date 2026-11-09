/* ==========================================================================
   Limparte v2 — desenha as avaliações e os trabalhos efetuados
   ==========================================================================
   Cada página de serviço carrega o seu ficheiro em data/ (que define
   window.LIMPARTE_SERVICO). Este ficheiro constrói o HTML a partir desses
   dados. Para atualizar o site NÃO precisas de mexer aqui: edita apenas o
   ficheiro em data/.

   Depende do site.js (carregado antes): $, $$, escaparHtml, icoSvg, TXT e
   abrirLightbox.
   ========================================================================== */

'use strict';

const MESES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

/** '2026-08' → 'Agosto de 2026'. Devolve o original se não o reconhecer. */
function formatarMes(valor) {
    const m = /^(\d{4})-(\d{2})$/.exec(String(valor || '').trim());
    if (!m) return valor || '';
    const mes = MESES[parseInt(m[2], 10) - 1];
    if (!mes) return valor;
    return mes.charAt(0).toUpperCase() + mes.slice(1) + ' de ' + m[1];
}

/** Mais recente primeiro. */
function porDataDecrescente(a, b) {
    return String(b.data || '').localeCompare(String(a.data || ''));
}

function estrelasHtml(n) {
    const total = Math.max(0, Math.min(5, Math.round(n || 5)));
    let html = '';
    for (let i = 0; i < 5; i++) {
        html += '<svg class="ico' + (i < total ? '' : ' vazia') + '" aria-hidden="true" focusable="false"><use href="#i-estrela"/></svg>';
    }
    return '<span class="estrelas" role="img" aria-label="' + total + ' em 5 estrelas">' + html + '</span>';
}

/* --------------------------------------------------------------------------
   Avaliações
   -------------------------------------------------------------------------- */

function desenharReviews(reviews) {
    const grelha = $('#reviewsGrid');
    if (!grelha) return;

    const resumo = $('#reviewsResumo');
    const lista = (reviews || []).slice().sort(porDataDecrescente);

    if (!lista.length) {
        grelha.innerHTML =
            '<div class="vazio"><strong>' + escaparHtml(TXT('js.aval.vazio_titulo', 'Ainda não há avaliações publicadas para este serviço.')) + '</strong>' +
            '<p>' + escaparHtml(TXT('js.aval.vazio_texto', 'Foi nosso cliente? Adoraríamos ouvir a sua opinião.')) + '</p></div>';
        if (resumo) resumo.classList.add('hidden');
        return;
    }

    grelha.innerHTML = lista.map(r => {
        const selo = r.verificada
            ? '<span class="selo">' + icoSvg('visto') + ' Verificada</span>'
            : '';
        const contexto = [r.local, formatarMes(r.data)].filter(Boolean).map(escaparHtml).join(' · ');

        return '<article class="review">' +
            estrelasHtml(r.estrelas) +
            '<blockquote>&ldquo;' + escaparHtml(r.texto) + '&rdquo;</blockquote>' +
            '<footer><div><b>' + escaparHtml(r.nome) + '</b><small>' + contexto + '</small></div>' + selo + '</footer>' +
        '</article>';
    }).join('');

    if (resumo) {
        const media = lista.reduce((soma, r) => soma + (Number(r.estrelas) || 5), 0) / lista.length;
        $('#reviewsMedia').textContent = media.toFixed(1).replace('.', ',');
        $('#reviewsEstrelas').innerHTML = estrelasHtml(media);
        $('#reviewsContagem').textContent = lista.length === 1
            ? '1 avaliação publicada'
            : lista.length + ' avaliações publicadas';
        resumo.classList.remove('hidden');
    }
}

/* --------------------------------------------------------------------------
   Trabalhos efetuados
   -------------------------------------------------------------------------- */

const TRABALHOS_VISIVEIS = 6;

function cartaoTrabalho(t, oculto) {
    const imagem = t.imagem
        ? '<img src="' + escaparHtml(t.imagem) + '" alt="' + escaparHtml(t.alt || t.titulo) + '" loading="lazy" decoding="async">'
        : icoSvg('imagem');

    const meta = (icone, valor) => valor
        ? '<span>' + icoSvg(icone) + escaparHtml(valor) + '</span>'
        : '';

    const destaques = (t.destaques || []).length
        ? '<ul>' + t.destaques.map(d => '<li>' + icoSvg('visto') + '<span>' + escaparHtml(d) + '</span></li>').join('') + '</ul>'
        : '';

    const dadosMeta = meta('regua', t.area) + meta('relogio', t.duracao);

    return '<article class="trabalho trabalho-item' + (oculto ? ' hidden' : '') + '">' +
        '<div class="trabalho-img">' + imagem +
            '<span class="trabalho-data">' + escaparHtml(formatarMes(t.data)) + '</span></div>' +
        '<div class="trabalho-corpo">' +
            '<h3>' + escaparHtml(t.titulo) + '</h3>' +
            (t.local ? '<p class="trabalho-local">' + icoSvg('pino') + escaparHtml(t.local) + '</p>' : '') +
            '<p>' + escaparHtml(t.descricao) + '</p>' +
            destaques +
            (dadosMeta ? '<div class="trabalho-meta">' + dadosMeta + '</div>' : '') +
        '</div>' +
    '</article>';
}

function desenharTrabalhos(trabalhos) {
    const grelha = $('#trabalhosGrid');
    if (!grelha) return;

    const lista = (trabalhos || []).slice().sort(porDataDecrescente);
    const botao = $('#trabalhosVerMais');
    const contagem = $('#trabalhosContagem');

    if (!lista.length) {
        grelha.innerHTML =
            '<div class="vazio"><strong>' + escaparHtml(TXT('js.trab.vazio_titulo', 'Os trabalhos deste serviço estão a ser preparados para publicação.')) + '</strong>' +
            '<p>' + escaparHtml(TXT('js.trab.vazio_texto', 'Contacte-nos e mostramos-lhe o portefólio completo.')) + '</p></div>';
        if (botao) botao.classList.add('hidden');
        if (contagem) contagem.classList.add('hidden');
        return;
    }

    grelha.innerHTML = lista.map((t, i) => cartaoTrabalho(t, i >= TRABALHOS_VISIVEIS)).join('');

    if (contagem) {
        contagem.textContent = lista.length + (lista.length === 1
            ? ' intervenção documentada'
            : ' intervenções documentadas');
        contagem.classList.remove('hidden');
    }

    if (botao) {
        if (lista.length > TRABALHOS_VISIVEIS) {
            const resto = lista.length - TRABALHOS_VISIVEIS;
            botao.textContent = resto === 1 ? 'Ver o trabalho restante' : 'Ver os restantes ' + resto + ' trabalhos';
            botao.classList.remove('hidden');
            botao.onclick = () => {
                $$('.trabalho-item.hidden').forEach(el => el.classList.remove('hidden'));
                botao.classList.add('hidden');
            };
        } else {
            botao.classList.add('hidden');
        }
    }
}

/* --------------------------------------------------------------------------
   Galeria: abre a imagem em grande
   -------------------------------------------------------------------------- */

function ligarGaleria() {
    $$('.gal-item').forEach(botao => {
        botao.addEventListener('click', () => {
            const img = $('img', botao);
            abrirLightbox(botao.dataset.full || img.src, img.alt);
        });
    });
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    const dados = window.LIMPARTE_SERVICO;

    if (!dados) {
        console.warn('[Limparte] Ficheiro de dados não carregado. Confirma que a página inclui ' +
                     '<script src="…/data/<serviço>.js"></script> antes deste ficheiro.');
    }

    desenharReviews(dados && dados.reviews);
    desenharTrabalhos(dados && dados.trabalhos);
    ligarGaleria();
});
