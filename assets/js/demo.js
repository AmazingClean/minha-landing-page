/* ==========================================================================
   Limparte v2 — conteúdo de exemplo, SÓ PARA A PRÉ-VISUALIZAÇÃO
   ==========================================================================
   Os ficheiros em data/ estão vazios de propósito: publicar avaliações que
   não são reais é ilegal em Portugal. Isso deixa as secções de avaliações e
   de trabalhos só com o estado vazio, o que impede de avaliar o desenho.

   Com #demo no endereço (ou a ligação no rodapé), este ficheiro preenche o
   que estiver vazio com entradas claramente marcadas como exemplo. Nada
   disto altera o data/ e desaparece ao recarregar sem o #demo.

   Este ficheiro NÃO deve ser incluído no site publicado.
   ========================================================================== */

(function () {
    'use strict';

    window.addEventListener('hashchange', function () {
        if (location.hash === '#demo') location.reload();
    });

    if (location.hash !== '#demo') return;

    var dados = window.LIMPARTE_SERVICO;
    if (!dados) return;

    if (!dados.reviews || !dados.reviews.length) {
        dados.reviews = [
            { nome: 'Cliente de exemplo', local: 'Exemplo · moradia', data: '2026-08', estrelas: 5, verificada: true,
              texto: 'Texto de demonstração. Aqui aparece a avaliação real de um cliente, escrita por ele e publicada com a sua autorização.' },
            { nome: 'Cliente de exemplo', local: 'Exemplo · condomínio', data: '2026-06', estrelas: 5,
              texto: 'Texto de demonstração. As avaliações mais recentes aparecem primeiro e a data é escrita por extenso.' },
            { nome: 'Cliente de exemplo', local: 'Exemplo · comércio', data: '2026-03', estrelas: 4,
              texto: 'Texto de demonstração. A média e o número de avaliações do topo calculam-se sozinhos a partir destas entradas.' }
        ];
    }

    if (!dados.trabalhos || !dados.trabalhos.length) {
        var fotos = [].slice.call(document.querySelectorAll('.gal-item img'));
        var exemplos = [
            ['2026-08', 'Vila do Conde', '180 m²', '2 dias'],
            ['2026-07', 'Matosinhos', '240 m²', '3 dias'],
            ['2026-06', 'Maia', '95 m²', '1 dia'],
            ['2026-05', 'Porto', '310 m²', '4 dias'],
            ['2026-04', 'Póvoa de Varzim', '60 m²', '1 dia'],
            ['2026-03', 'Gondomar', '150 m²', '2 dias'],
            ['2026-02', 'Espinho', '120 m²', '2 dias']
        ];

        dados.trabalhos = exemplos.map(function (e, i) {
            var foto = fotos[i % Math.max(fotos.length, 1)];
            return {
                titulo: 'Trabalho de exemplo ' + (i + 1),
                local: e[1] + ' · exemplo',
                data: e[0],
                descricao: 'Texto de demonstração. Cada trabalho tem título, local, data, uma descrição do que foi feito, a área e a duração.',
                area: e[2],
                duracao: e[3],
                imagem: i === exemplos.length - 1 || !foto ? '' : foto.src,
                alt: foto ? foto.alt : '',
                destaques: ['Primeiro ponto que valoriza o trabalho', 'Segundo ponto']
            };
        });
    }
})();
