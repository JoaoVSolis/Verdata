// Verdata — lógica do site em JavaScript puro
// (reescrita da class Component de referencia/Main.dc.html)

(function () {
  'use strict';

  // Estado da página, igual ao da referência
  const estado = {
    atual: 0,      // seção visível (barra de progresso)
    escuro: false, // tema
    item: -1,      // opção escolhida em "O que você tem em casa?"
    lateral: null, // painel aberto na barra da direita: 'Contato' | 'Equipe' | null
    zoom: false    // painel do Power BI ampliado
  };

  const pagina = document.getElementById('pagina');

  // ---------- Animação da abertura (#inicio) ----------
  // Mesmas fórmulas da referência: o fundo flutua, o caminhão vai e volta
  // sem sair da imagem e as rodas giram sempre para a frente.
  const flutua = pagina.querySelector('.flutua');
  const flutua2 = pagina.querySelector('.flutua2');
  const caminhao = pagina.querySelector('.caminhao');
  const rodas = Array.from(pagina.querySelectorAll('.roda')).map(function (roda) {
    const c = roda.querySelector('circle');
    return { el: roda, cx: c.getAttribute('cx'), cy: c.getAttribute('cy') };
  });

  function mover(el, x, y) {
    if (el) el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
  }

  function animar(t) {
    const onda = function (periodo, atraso) { return 5 - 5 * Math.cos(2 * Math.PI * (t + atraso) / periodo); };
    mover(flutua, 0, onda(6, 0));
    mover(flutua2, 0, onda(4, 1.5));
    const x = 18 * Math.sin(2 * Math.PI * t / 9);
    mover(caminhao, x, -1 + Math.cos(2 * Math.PI * t / 1.2));
    const giro = (t * 72) % 360;
    rodas.forEach(function (r) {
      r.el.setAttribute('transform', 'rotate(' + giro.toFixed(1) + ' ' + r.cx + ' ' + r.cy + ')');
    });
  }

  let inicio = null;
  function quadro(agora) {
    if (inicio === null) inicio = agora;
    animar((agora - inicio) / 1000);
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);

  // ---------- "O que você tem em casa?" (#pontos) ----------
  // Começa sem nada escolhido; clicar mostra o "Como separar",
  // clicar de novo no mesmo item fecha.
  const opcoes = pagina.querySelectorAll('[data-item]');
  const guias = pagina.querySelectorAll('[data-guia]');

  function mostrarItem() {
    opcoes.forEach(function (botao) {
      botao.setAttribute('aria-pressed', String(Number(botao.dataset.item) === estado.item));
    });
    guias.forEach(function (guia) {
      guia.hidden = Number(guia.dataset.guia) !== estado.item;
    });
  }

  opcoes.forEach(function (botao) {
    botao.addEventListener('click', function () {
      const k = Number(botao.dataset.item);
      estado.item = estado.item === k ? -1 : k;
      mostrarItem();
    });
  });
  mostrarItem();

  // ---------- Tema claro / escuro ----------
  // O sol de #tres-rs (e, depois, o botão da barra lateral) alterna o tema da página inteira.
  const sol = pagina.querySelector('.sol');

  function aplicarTema() {
    const escuro = estado.escuro;
    pagina.classList.toggle('escuro', escuro);
    const dica = escuro ? 'Clique para voltar ao tema claro' : 'Clique para ver o tema escuro';
    if (sol) {
      sol.setAttribute('aria-label', dica);
      sol.querySelector('.dica').textContent = dica;
      // SVG não tem a propriedade .hidden: usa o atributo direto
      sol.querySelector('.sol-claro').toggleAttribute('hidden', escuro);
      sol.querySelector('.sol-escuro').toggleAttribute('hidden', !escuro);
    }
    // Botão de tema da barra da direita
    if (botaoTema) {
      const rotulo = escuro ? 'Modo claro' : 'Modo escuro';
      botaoTema.setAttribute('aria-label', rotulo);
      botaoTema.setAttribute('aria-pressed', String(escuro));
      botaoTema.querySelector('.tema-rotulo').textContent = rotulo;
      botaoTema.querySelector('.tema-lua').toggleAttribute('hidden', escuro);
      botaoTema.querySelector('.tema-sol').toggleAttribute('hidden', !escuro);
    }
  }

  function alternarTema() {
    estado.escuro = !estado.escuro;
    aplicarTema();
  }

  const botaoTema = pagina.querySelector('.lateral-tema');
  if (sol) sol.addEventListener('click', alternarTema);
  if (botaoTema) botaoTema.addEventListener('click', alternarTema);
  aplicarTema();

  // ---------- Painel de dados (#painel) ----------
  // "Ampliar" mostra a imagem a 2200px com rolagem; "Reduzir" volta à largura do card.
  const painelCard = pagina.querySelector('.painel-card');
  const botaoZoom = pagina.querySelector('.botao-zoom');

  function aplicarZoom() {
    if (!painelCard || !botaoZoom) return;
    painelCard.classList.toggle('ampliado', estado.zoom);
    botaoZoom.setAttribute('aria-pressed', String(estado.zoom));
    botaoZoom.querySelector('.botao-zoom-rotulo').textContent = estado.zoom ? 'Reduzir' : 'Ampliar';
  }

  if (botaoZoom) {
    botaoZoom.addEventListener('click', function () {
      estado.zoom = !estado.zoom;
      aplicarZoom();
    });
  }
  aplicarZoom();

  // ---------- Barra da esquerda: progresso ----------
  // A seção atual é a última cujo topo passou de 45% da altura da tela;
  // no fim da página, a última parada fica ativa.
  const ids = ['inicio', 'descricao', 'pontos', 'tres-rs', 'cores', 'painel', 'equipe', 'contato'];
  const paradasTrilha = pagina.querySelectorAll('.trilha-parada');
  const percorrido = pagina.querySelector('.trilha-percorrido');
  const marcador = pagina.querySelector('.trilha-marcador');
  const icones = marcador ? marcador.querySelectorAll('.icone') : [];
  let quadroMedida = null;

  function mostrarProgresso() {
    const passo = estado.atual * 425 / 7;
    if (percorrido) percorrido.style.height = passo.toFixed(1) + 'px';
    if (marcador) marcador.style.top = (8 + passo).toFixed(1) + 'px';
    paradasTrilha.forEach(function (p, k) { p.classList.toggle('passou', k <= estado.atual); });
    // SVG: usa o atributo hidden; ao reaparecer, o ícone roda a animação "surgir"
    icones.forEach(function (svg, k) { svg.toggleAttribute('hidden', k !== estado.atual); });
  }

  function medir() {
    const r = pagina.getBoundingClientRect();
    const max = r.height - window.innerHeight;
    if (max <= 0) return;
    const linha = window.innerHeight * 0.45;
    let atual = 0;
    ids.forEach(function (id, k) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= linha) atual = k;
    });
    if (-r.top >= max - 4) atual = ids.length - 1;
    if (atual !== estado.atual) {
      estado.atual = atual;
      mostrarProgresso();
    }
  }

  function aoRolar() {
    if (quadroMedida) return;
    quadroMedida = requestAnimationFrame(function () { quadroMedida = null; medir(); });
  }

  window.addEventListener('scroll', aoRolar, true);
  window.addEventListener('resize', aoRolar);
  mostrarProgresso();
  aoRolar();

  // ---------- Barra da direita: Contato e Equipe ----------
  // Clicar abre o painel; clicar de novo no mesmo ícone fecha.
  const botoesLateral = pagina.querySelectorAll('[data-lateral]');
  const membros = pagina.querySelectorAll('.membro');
  const painelContato = pagina.querySelector('.lateral-painel');

  function mostrarLateral() {
    botoesLateral.forEach(function (b) {
      b.setAttribute('aria-expanded', String(estado.lateral === b.dataset.lateral));
    });
    membros.forEach(function (m) { m.classList.toggle('aberto', estado.lateral === 'Equipe'); });
    if (painelContato) painelContato.hidden = estado.lateral !== 'Contato';
  }

  botoesLateral.forEach(function (b) {
    b.addEventListener('click', function () {
      estado.lateral = estado.lateral === b.dataset.lateral ? null : b.dataset.lateral;
      mostrarLateral();
    });
  });
  const fechar = pagina.querySelector('.contato-fechar');
  if (fechar) fechar.addEventListener('click', function () { estado.lateral = null; mostrarLateral(); });
  mostrarLateral();
})();
