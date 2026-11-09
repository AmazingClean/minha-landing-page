/* ==========================================================================
   Limparte v2 — página de destino (orcamento.html)
   ==========================================================================
   - Valida e envia o formulário (Formspree, ou WhatsApp se ainda não estiver
     configurado — o pedido nunca se perde).
   - Pré-seleciona o serviço quando se toca num cartão.
   - Guarda a origem da campanha (utm_*, gclid, fbclid) e envia-a com o pedido.
   - Regista eventos no dataLayer (Google Tag Manager / GA4):
       generate_lead  ·  click_telefone  ·  click_whatsapp
   - Esconde a barra do telemóvel quando o formulário está à vista.

   Os textos vêm de atributos data-* do próprio formulário, por isso editam-se
   no backoffice (Páginas › Página de destino › Formulário).
   ========================================================================== */
(function () {
    'use strict';

    var CFG = (window.LIMPARTE_CONFIG && window.LIMPARTE_CONFIG.geral) || {};
    var ENDPOINT = CFG.formspreeEndpoint || '';
    var WHATSAPP = CFG.whatsapp || '351912320585';

    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

    /* ------------------------------------------------------------------ *
     * Medição
     * ------------------------------------------------------------------ */
    /** telemóvel / tablet / computador — para medir qual converte (a campanha vem quase toda de telemóvel). */
    function dispositivo() {
        var l = window.innerWidth;
        var toque = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (l < 768) return 'telemovel';
        if (l < 1100 && toque) return 'tablet';
        return 'computador';
    }

    /** 'telefone' (dentro do horário de atendimento) ou 'mensagem' (fora). Calculado no <head>. */
    function modo() { return document.documentElement.getAttribute('data-modo') || 'telefone'; }

    // A página pode ficar aberta de um lado ao outro das 9h ou das 19h: reavalia de minuto a minuto.
    if (typeof window.limparteModo === 'function') {
        setInterval(function () { document.documentElement.setAttribute('data-modo', window.limparteModo()); }, 60000);
    }

    function evento(nome, dados) {
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(Object.assign({ event: nome, dispositivo: dispositivo(), modo: modo() }, dados || {}));
        } catch (e) { /* medir nunca pode estragar a página */ }
    }

    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('[data-evento]');
        if (a) evento(a.getAttribute('data-evento'), { local: localDe(a) });
    });

    function localDe(el) {
        var s = el.closest('section, header, footer, .lp-barra');
        return s ? (s.id || s.className.split(' ')[0]) : 'pagina';
    }

    /* ------------------------------------------------------------------ *
     * Origem da campanha
     * ------------------------------------------------------------------ */
    var CHAVES_UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

    function origem() {
        var out = {};
        var guardado = {};
        try { guardado = JSON.parse(sessionStorage.getItem('limparte_utm') || '{}'); } catch (e) { /* sem storage */ }
        var params = new URLSearchParams(window.location.search);
        CHAVES_UTM.forEach(function (k) {
            var v = params.get(k) || guardado[k];
            if (v) out[k] = String(v).slice(0, 120);
        });
        try { if (Object.keys(out).length) sessionStorage.setItem('limparte_utm', JSON.stringify(out)); } catch (e) { /* ignora */ }
        return out;
    }
    var ORIGEM = origem();

    /* ------------------------------------------------------------------ *
     * Validação
     * ------------------------------------------------------------------ */
    function telefoneValido(v) {
        var d = String(v || '').replace(/[\s.()-]/g, '').replace(/^(\+351|00351)/, '');
        return /^[29]\d{8}$/.test(d);
    }
    function emailValido(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
    }

    function marcar(campo, invalido) {
        if (!campo) return;
        if (invalido) campo.setAttribute('aria-invalid', 'true'); else campo.removeAttribute('aria-invalid');
    }

    function mostrarErro(form, msg, campo) {
        var caixa = $('.lp-erro', form);
        caixa.textContent = msg;
        caixa.hidden = false;
        if (campo) campo.focus();
    }
    function limparErro(form) {
        var caixa = $('.lp-erro', form);
        caixa.hidden = true;
        caixa.textContent = '';
        $$('[aria-invalid]', form).forEach(function (c) { c.removeAttribute('aria-invalid'); });
    }

    /* ------------------------------------------------------------------ *
     * Envio
     * ------------------------------------------------------------------ */
    function rotuloServico(form, valor) {
        var sel = $('select[name="servico"]', form);
        if (!valor || !sel) return '';
        var op = sel.querySelector('option[value="' + valor + '"]');
        return op ? op.textContent.trim() : '';
    }

    function mensagemWhatsApp(d) {
        var linhas = ['Olá! Gostaria de pedir uma visita técnica grátis.', ''];
        if (d.nome) linhas.push('Nome: ' + d.nome);
        if (d.telefone) linhas.push('Telefone: ' + d.telefone);
        if (d.email) linhas.push('Email: ' + d.email);
        if (d.servico) linhas.push('Serviço: ' + d.servico);
        return linhas.join('\n');
    }
    function linkWhatsApp(texto) {
        return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
    }

    function nomeNoTexto(texto, nome) {
        if (texto.indexOf('{nome}') === -1) return texto;
        return texto.replace(nome ? '{nome}' : /\s*,?\s*\{nome\}/, function () { return nome || ''; });
    }

    function mostrarSucesso(cartao, form, dados, porWhatsApp, urlWa) {
        var d = form.dataset;
        var painel = $('.lp-sucesso', cartao);
        var primeiroNome = (dados.nome || '').trim().split(/\s+/)[0];

        $('[data-s="titulo"]', painel).textContent = porWhatsApp ? d.okwaTitulo : d.okTitulo;
        $('[data-s="texto"]', painel).textContent = nomeNoTexto(porWhatsApp ? d.okwaTexto : d.okTexto, primeiroNome);

        var wa = $('[data-s="wa"]', painel);
        var foto = $('[data-s="foto"]', painel);
        var extra = $('[data-s="extra"]', painel);
        wa.hidden = !porWhatsApp;
        foto.hidden = porWhatsApp;
        extra.hidden = porWhatsApp;
        extra.textContent = d.okExtra;
        if (porWhatsApp) wa.href = urlWa;

        $('.lp-form-corpo', cartao).hidden = true;
        painel.hidden = false;
        // No telemóvel o cartão pode estar a meio do ecrã: trazê-lo para a vista.
        var topo = cartao.getBoundingClientRect().top;
        if (topo < 70 || topo > window.innerHeight * 0.6) {
            window.scrollTo({ top: window.pageYOffset + topo - 90, behavior: 'smooth' });
        }
        painel.focus({ preventScroll: true });
    }

    function enviar(form, cartao) {
        limparErro(form);
        var f = form.elements;
        var nome = f.nome.value.trim();
        var telefone = f.telefone.value.trim();
        var email = f.email.value.trim();

        if (f._gotcha && f._gotcha.value) return;       // robô: finge que correu bem, não envia

        if (nome.length < 2) { marcar(f.nome, true); return mostrarErro(form, form.dataset.erroNome, f.nome); }
        if (!telefoneValido(telefone)) { marcar(f.telefone, true); return mostrarErro(form, form.dataset.erroTelefone, f.telefone); }
        if (!emailValido(email)) { marcar(f.email, true); return mostrarErro(form, form.dataset.erroEmail, f.email); }
        if (!f.consentimento.checked) { return mostrarErro(form, form.dataset.erroConsentimento, f.consentimento); }

        var servico = f.servico.value;
        var dados = { nome: nome, telefone: telefone, email: email, servico: rotuloServico(form, servico) || (servico === 'aconselhamento' ? 'Preciso de aconselhamento' : '') };
        var urlWa = linkWhatsApp(mensagemWhatsApp(dados));
        var leadEvento = { servico: servico || 'nao_indicado', metodo: ENDPOINT ? 'formulario' : 'whatsapp' };

        // Sem Formspree: o pedido segue por WhatsApp, já escrito.
        if (!ENDPOINT) {
            evento('generate_lead', leadEvento);
            window.open(urlWa, '_blank', 'noopener');
            mostrarSucesso(cartao, form, dados, true, urlWa);
            return;
        }

        var botao = $('.lp-enviar', form);
        var htmlOriginal = botao.innerHTML;
        botao.disabled = true;
        botao.innerHTML = '<span class="spin" aria-hidden="true"></span> ' + form.dataset.aEnviar;

        var corpo = Object.assign({
            _subject: 'Novo pedido de visita — página de destino',
            Nome: dados.nome,
            Telefone: dados.telefone,
            Email: dados.email || '(não indicou)',
            'Serviço': dados.servico || '(não indicou)',
            'Página': 'Landing page (orcamento)',
            Dispositivo: dispositivo(),
            'Horário': modo() === 'telefone' ? 'Dentro do horário telefónico' : 'Fora do horário telefónico'
        }, ORIGEM);

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(corpo)
        }).then(function (r) {
            if (!r.ok) throw new Error('Resposta ' + r.status);
            evento('generate_lead', leadEvento);
            mostrarSucesso(cartao, form, dados, false, urlWa);
        }).catch(function (erro) {
            console.warn('[Limparte] Falha no envio do formulário:', erro);
            mostrarErro(form, form.dataset.erroEnvio);
        }).then(function () {
            botao.disabled = false;
            botao.innerHTML = htmlOriginal;
        });
    }

    $$('[data-lp-form]').forEach(function (cartao) {
        var form = $('form', cartao);
        form.addEventListener('submit', function (e) { e.preventDefault(); enviar(form, cartao); });
        // Limpa o aviso assim que a pessoa corrige
        form.addEventListener('input', function (e) {
            marcar(e.target, false);
            if (!$('[aria-invalid]', form)) { var c = $('.lp-erro', form); c.hidden = true; }
        });
    });

    // O email é opcional e começa escondido: a ligação abre o campo.
    $$('[data-lp-email]').forEach(function (b) {
        b.addEventListener('click', function () {
            var campo = document.getElementById(b.getAttribute('aria-controls'));
            if (!campo) return;
            campo.hidden = false;
            b.hidden = true;
            b.setAttribute('aria-expanded', 'true');
            var i = $('input', campo);
            if (i) i.focus();
        });
    });

    /* ------------------------------------------------------------------ *
     * Cartões que pré-selecionam o serviço
     * ------------------------------------------------------------------ */
    var primeiro = $('#pedido');
    $$('[data-servico]').forEach(function (a) {
        a.addEventListener('click', function () {
            if (!primeiro) return;
            var sel = $('select[name="servico"]', primeiro);
            if (sel) sel.value = a.getAttribute('data-servico');
            evento('selecionar_servico', { servico: a.getAttribute('data-servico') });
        });
    });

    // Qualquer ligação para o formulário leva o cursor ao primeiro campo (só com rato).
    var comRato = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    $$('a[href="#pedido"]').forEach(function (a) {
        a.addEventListener('click', function () {
            if (!comRato || !primeiro) return;
            setTimeout(function () {
                var nome = $('input[name="nome"]', primeiro);
                if (nome && !$('.lp-form-corpo', primeiro).hidden) nome.focus({ preventScroll: true });
            }, 600);
        });
    });

    /* ------------------------------------------------------------------ *
     * Barra do telemóvel: some quando um formulário está à vista
     * ------------------------------------------------------------------ */
    var barra = $('.lp-barra');
    if (barra && 'IntersectionObserver' in window) {
        var visiveis = new Set();
        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (en) {
                if (en.isIntersecting) visiveis.add(en.target); else visiveis.delete(en.target);
            });
            barra.classList.toggle('escondida', visiveis.size > 0);
        }, { threshold: 0.2 });
        // A barra só aparece quando já não há um formulário nem os botões do topo à vista.
        $$('[data-lp-form], [data-lp-esconde-barra]').forEach(function (c) { obs.observe(c); });
    }
})();
