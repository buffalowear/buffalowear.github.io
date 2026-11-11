/* Buffalo Wear · site da loja
   Catálogo em produtos.js. O pedido é fechado pelo WhatsApp. */
(function () {
  'use strict';

  // ---- Configuração da loja ----
  var CONFIG = {
    whatsapp: '5537998635977',          // (37) 99863-5977, com 55 do Brasil na frente
    categorias: [
      { id: 'camisas', nome: 'Camisas', capa: 'camisa-egipcio-3' },
      { id: 'polos', nome: 'Polos', capa: 'polo-beller-2' },
      { id: 'camisetas', nome: 'Camisetas', capa: 'camiseta-beller-2' },
      { id: 'bermudas', nome: 'Bermudas e shorts', capa: 'bermuda-classic-1' },
      { id: 'calcados', nome: 'Calçados', capa: 'tenis-jake-2' },
      { id: 'acessorios', nome: 'Gravatas', capa: 'gravata-lisa-4' },
      { id: 'jaquetas', nome: 'Jaquetas', capa: 'jaqueta-rock-soda-1', foraDaVitrine: true }
    ],
    destaqueCalcados: ['tenis-jake', 'tenis-city', 'sapato-pisa', 'chinelo-hooq'],
    avaliarNoGoogle: 'https://www.google.com/maps/search/?api=1&query=Buffalo+Wear+Piumhi+MG'
  };

  var PRODUTOS = (window.CATALOGO || []).filter(function (p) { return p.ativo !== false && p.cores.length; });
  var AVALIACOES = window.AVALIACOES || [];
  var porId = {};
  PRODUTOS.forEach(function (p) { porId[p.id] = p; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var foto = function (nome, grande) { return 'img/p/' + nome + (grande ? '-g' : '') + '.jpg'; };
  var zap = function (texto) { return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto); };
  var semAcento = function (t) { return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var nomeCompleto = function (p) { return p.nome + (p.marca ? ' ' + p.marca : ''); };
  var dinheiro = function (v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  // Parcelamento do Manual da Marca: calçado em 10x sem juros; roupa até R$ 100 em 3x; acima disso em 6x.
  var parcelas = function (p) {
    if (!p.preco) return '';
    var n = p.cat === 'calcados' ? 10 : (p.preco <= 100 ? 3 : 6);
    var valor = Math.floor(p.preco / n * 100) / 100;
    return 'ou ' + n + 'x de ' + dinheiro(valor) + (p.cat === 'calcados' ? ' sem juros' : '');
  };

  // ---- Cartão de produto ----
  function cartao(p) {
    var segunda = p.extras[0] || (p.cores[1] && p.cores[1].img);
    var n = p.cores.length;
    var cores = n > 1 ? n + ' cores' : esc(p.cores[0].cor);
    var meta = p.preco ? '<strong>' + dinheiro(p.preco) + '</strong> · ' + cores : cores;
    return '<button class="cartao" type="button" data-produto="' + esc(p.id) + '">' +
      '<span class="cartao-foto">' +
        (p.novo ? '<span class="selo">Novo</span>' : '') +
        '<img src="' + foto(p.cores[0].img) + '" alt="' + esc(nomeCompleto(p) + ', ' + p.cores[0].cor) + '" loading="lazy" width="540" height="720">' +
        (segunda ? '<img class="alt" src="' + foto(segunda) + '" alt="" loading="lazy" width="540" height="720">' : '') +
        '<span class="cartao-ver">Ver detalhes</span>' +
      '</span>' +
      '<span class="cartao-info">' +
        '<span class="cartao-marca">' + esc(p.marca) + '</span>' +
        '<span class="cartao-nome">' + esc(p.nome) + '</span>' +
        '<span class="cartao-meta">' + meta + '</span>' +
      '</span></button>';
  }

  // ---- Vitrines ----
  function montarVitrines() {
    $('#categorias').innerHTML = CONFIG.categorias.filter(function (c) { return !c.foraDaVitrine; }).map(function (c) {
      return '<a class="cat" href="#catalogo" data-cat="' + c.id + '">' +
        '<span class="cat-foto"><img src="' + foto(c.capa) + '" alt="" loading="lazy" width="540" height="720"></span>' +
        '<span class="cat-nome"><span>' + esc(c.nome) + '</span><span aria-hidden="true">→</span></span></a>';
    }).join('');

    $('#grade-novidades').innerHTML = PRODUTOS.filter(function (p) { return p.novo; }).map(cartao).join('');
    $('#grade-calcados').innerHTML = CONFIG.destaqueCalcados.map(function (id) { return porId[id]; }).filter(Boolean).map(cartao).join('');

    var abas = [{ id: 'todos', nome: 'Todos' }].concat(CONFIG.categorias).filter(function (c) {
      return c.id === 'todos' || PRODUTOS.some(function (p) { return p.cat === c.id; });
    });
    $('#abas').innerHTML = abas.map(function (c) {
      return '<button class="aba" role="tab" type="button" data-cat="' + c.id + '" aria-selected="false">' + esc(c.nome) + '</button>';
    }).join('');
  }

  // ---- Catálogo com filtro e busca ----
  var filtro = { cat: 'todos', termo: '' };
  function desenharCatalogo() {
    var termo = semAcento(filtro.termo.trim());
    var lista = PRODUTOS.filter(function (p) {
      if (filtro.cat !== 'todos' && p.cat !== filtro.cat) return false;
      if (!termo) return true;
      var palheiro = semAcento([p.nome, p.marca, p.cat, p.desc, p.cores.map(function (c) { return c.cor; }).join(' ')].join(' '));
      return termo.split(/\s+/).every(function (t) { return palheiro.indexOf(t) > -1; });
    });
    $('#grade-catalogo').innerHTML = lista.map(cartao).join('');
    $('#vazio').hidden = lista.length > 0;
    $('#contagem').textContent = lista.length + (lista.length === 1 ? ' produto' : ' produtos') + (filtro.termo ? ' para "' + filtro.termo + '"' : '');
    $$('#abas .aba').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.cat === filtro.cat)); });
  }
  function filtrar(cat, termo) {
    filtro.cat = cat || 'todos';
    filtro.termo = termo || '';
    desenharCatalogo();
  }

  // ---- Janela do produto ----
  var janela = $('#janela');
  var atual = { p: null, cor: 0, tam: '' };
  function abrirProduto(id) {
    var p = porId[id];
    if (!p) return;
    atual = { p: p, cor: 0, tam: '' };
    $('#j-marca').textContent = p.marca || 'Buffalo Wear';
    $('#j-nome').textContent = p.nome;
    $('#j-preco').textContent = p.preco ? dinheiro(p.preco) : '';
    $('#j-parcela').textContent = parcelas(p);
    $('#j-desc').textContent = p.desc;
    $('#j-cores').innerHTML = p.cores.map(function (c, i) {
      return '<button type="button" role="radio" aria-checked="false" data-cor="' + i + '" title="' + esc(c.cor) + '" aria-label="' + esc(c.cor) + '">' +
        '<img src="' + foto(c.img) + '" alt="" width="48" height="64" loading="lazy"></button>';
    }).join('');
    escolherCor(0);
    if (!janela.open) janela.showModal();
    janela.scrollTop = 0;
  }
  function mostrarFoto(nome, alt) {
    var img = $('#j-foto');
    img.src = foto(nome, true);
    img.alt = alt;
    $$('#j-fotos button').forEach(function (b) { b.setAttribute('aria-current', String(b.dataset.foto === nome)); });
  }
  function escolherCor(i) {
    var p = atual.p, c = p.cores[i];
    atual.cor = i;
    $('#j-cor').textContent = c.cor;
    $$('#j-cores button').forEach(function (b, k) { b.setAttribute('aria-checked', String(k === i)); });
    var fotos = [c.img].concat(p.extras);
    $('#j-fotos').innerHTML = fotos.length > 1 ? fotos.map(function (f, k) {
      return '<button type="button" data-foto="' + f + '" aria-label="Foto ' + (k + 1) + '"><img src="' + foto(f) + '" alt="" width="60" height="80" loading="lazy"></button>';
    }).join('') : '';
    mostrarFoto(c.img, nomeCompleto(p) + ', ' + c.cor);
    var tams = c.tam || [];
    atual.tam = tams.length === 1 ? tams[0] : '';
    $('#j-bloco-tam').hidden = tams.length === 0;
    $('#j-tams').innerHTML = tams.map(function (t) {
      return '<button type="button" role="radio" aria-checked="' + (t === atual.tam) + '" data-tam="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');
    atualizarZap();
  }
  function descreve(p, cor, tam) {
    return nomeCompleto(p) + ' · cor ' + p.cores[cor].cor + (tam ? ' · tamanho ' + tam : '');
  }
  function atualizarZap() {
    var p = atual.p;
    $('#j-tam-escolhido').textContent = atual.tam;
    $('#j-zap').href = zap('Olá! Vi no site da Buffalo Wear e quero comprar:\n\n• ' + descreve(p, atual.cor, atual.tam) +
      (p.preco ? ' · ' + dinheiro(p.preco) : '') + '\n\n' + (atual.tam ? 'Pode separar pra mim?' : 'Pode me ajudar com o tamanho?'));
  }
  function faltaTamanho() {
    var tams = atual.p.cores[atual.cor].tam || [];
    if (tams.length && !atual.tam) { recado('Escolha o tamanho.'); return true; }
    return false;
  }

  // ---- Sacola ----
  var CHAVE = 'buffalo-sacola';
  var sacola = [];
  try { sacola = JSON.parse(localStorage.getItem(CHAVE) || '[]').filter(function (i) { return porId[i.id] && porId[i.id].cores[i.cor]; }).map(function (i) { i.tam = i.tam || ''; return i; }); } catch (e) { sacola = []; }
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(sacola)); } catch (e) { /* segue sem guardar */ } }
  function desenharSacola() {
    var total = sacola.reduce(function (s, i) { return s + i.qtd; }, 0);
    var conta = $('#conta-sacola');
    conta.textContent = total;
    conta.hidden = total === 0;
    $('#btn-sacola').setAttribute('aria-label', 'Abrir sacola, ' + total + (total === 1 ? ' item' : ' itens'));
    $('#s-vazia').hidden = total > 0;
    $('.gaveta-pe').hidden = total === 0;
    $('#s-itens').innerHTML = sacola.map(function (i, k) {
      var p = porId[i.id], c = p.cores[i.cor];
      return '<li><img src="' + foto(c.img) + '" alt="" width="72" height="96">' +
        '<div><h3>' + esc(p.nome) + '</h3><p>' + esc((p.marca ? p.marca + ' · ' : '') + c.cor + (i.tam ? ' · ' + i.tam : '')) + '</p>' +
        (p.preco ? '<p class="item-preco">' + dinheiro(p.preco * i.qtd) + '</p>' : '') +
        '<span class="qtd"><button type="button" data-menos="' + k + '" aria-label="Diminuir quantidade">−</button><span>' + i.qtd + '</span><button type="button" data-mais="' + k + '" aria-label="Aumentar quantidade">+</button></span></div>' +
        '<button class="tirar" type="button" data-tirar="' + k + '">Tirar</button></li>';
    }).join('');
    var linhas = sacola.map(function (i) {
      var p = porId[i.id];
      return '• ' + i.qtd + 'x ' + descreve(p, i.cor, i.tam) + (p.preco ? ' · ' + dinheiro(p.preco * i.qtd) : '');
    });
    var soma = sacola.reduce(function (s, i) { return s + (porId[i.id].preco || 0) * i.qtd; }, 0);
    $('#s-total').textContent = dinheiro(soma);
    $('#s-enviar').href = zap('Olá! Montei esta sacola no site da Buffalo Wear:\n\n' + linhas.join('\n') + '\n\nTotal: ' + dinheiro(soma) + '\n\nPode separar pra mim? Quero combinar o pagamento e a entrega.');
  }
  function colocarNaSacola(id, cor, tam) {
    var item = sacola.find(function (i) { return i.id === id && i.cor === cor && i.tam === tam; });
    if (item) item.qtd += 1; else sacola.push({ id: id, cor: cor, tam: tam, qtd: 1 });
    guardar(); desenharSacola();
  }

  // ---- Recado rápido ----
  var relogio;
  function recado(texto) {
    var r = $('#recado');
    r.textContent = texto;
    r.classList.add('ativo');
    clearTimeout(relogio);
    relogio = setTimeout(function () { r.classList.remove('ativo'); }, 2600);
  }

  // ---- Eventos ----
  document.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-produto]'))) { e.preventDefault(); abrirProduto(el.dataset.produto); return; }
    if ((el = e.target.closest('[data-cat]'))) {
      filtrar(el.dataset.cat, '');
      $('#menu').classList.remove('aberto');
      $('#btn-menu').setAttribute('aria-expanded', 'false');
      if (el.classList.contains('aba')) return;
      return; // links seguem para #catalogo
    }
    if ((el = e.target.closest('[data-fechar]'))) { el.closest('dialog').close(); return; }
    if ((el = e.target.closest('#j-cores [data-cor]'))) { escolherCor(Number(el.dataset.cor)); return; }
    if ((el = e.target.closest('#j-tams [data-tam]'))) {
      atual.tam = el.dataset.tam;
      $$('#j-tams button').forEach(function (b) { b.setAttribute('aria-checked', String(b === el)); });
      atualizarZap(); return;
    }
    if ((el = e.target.closest('#j-fotos [data-foto]'))) { mostrarFoto(el.dataset.foto, nomeCompleto(atual.p)); return; }
    if ((el = e.target.closest('[data-mais]'))) { sacola[el.dataset.mais].qtd += 1; guardar(); desenharSacola(); return; }
    if ((el = e.target.closest('[data-menos]'))) {
      var k = Number(el.dataset.menos);
      sacola[k].qtd -= 1;
      if (sacola[k].qtd < 1) sacola.splice(k, 1);
      guardar(); desenharSacola(); return;
    }
    if ((el = e.target.closest('[data-tirar]'))) { sacola.splice(Number(el.dataset.tirar), 1); guardar(); desenharSacola(); return; }
    if (e.target.tagName === 'DIALOG') e.target.close(); // clique fora fecha
  });

  $('#j-zap').addEventListener('click', function (e) { if (faltaTamanho()) e.preventDefault(); });
  $('#j-sacola').addEventListener('click', function () {
    if (faltaTamanho()) return;
    colocarNaSacola(atual.p.id, atual.cor, atual.tam);
    janela.close();
    recado(atual.p.nome + ' na sacola.');
  });
  $('#btn-sacola').addEventListener('click', function () { $('#sacola').showModal(); });
  $('#s-limpar').addEventListener('click', function () { sacola = []; guardar(); desenharSacola(); });
  $('#btn-menu').addEventListener('click', function () {
    var aberto = $('#menu').classList.toggle('aberto');
    this.setAttribute('aria-expanded', String(aberto));
  });
  $('#btn-busca').addEventListener('click', function () {
    var f = $('#busca');
    f.hidden = !f.hidden;
    if (!f.hidden) $('#campo-busca').focus();
  });
  $('#busca').addEventListener('submit', function (e) {
    e.preventDefault();
    filtrar('todos', $('#campo-busca').value);
    $('#catalogo').scrollIntoView();
  });
  $('#campo-busca').addEventListener('input', function () { filtrar('todos', this.value); });

  // Links de WhatsApp com mensagem pronta
  $$('[data-zap]').forEach(function (a) {
    a.href = zap(a.dataset.zap);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // ---- Avaliações (avaliacoes.js) ----
  function montarAvaliacoes() {
    var estrelas = function (n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); };
    $('#lista-avaliacoes').innerHTML = AVALIACOES.map(function (a) {
      return '<li class="avaliacao"><p class="estrelas" aria-label="' + a.nota + ' de 5 estrelas">' + estrelas(a.nota) + '</p>' +
        '<blockquote>' + esc(a.texto) + '</blockquote>' +
        '<p class="autor"><strong>' + esc(a.nome) + '</strong><span>' + esc(a.origem) + '</span></p></li>';
    }).join('');
    $('#avaliar-google').href = CONFIG.avaliarNoGoogle;
  }

  $('#ano').textContent = new Date().getFullYear();
  montarAvaliacoes();
  montarVitrines();
  desenharCatalogo();
  desenharSacola();
})();
