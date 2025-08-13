

const $ = (q, el=document)=>el.querySelector(q);
const $$ = (q, el=document)=>Array.from(el.querySelectorAll(q));

const state = {
  data: null,
  activeKey: null,
};

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCPeNc1uPmxStjIfEZJqjeN-ntcwVgjB-I",
  authDomain: "pizzariabarra-9efdb.firebaseapp.com",
  projectId: "pizzariabarra-9efdb",
  storageBucket: "pizzariabarra-9efdb.firebasestorage.app",
  messagingSenderId: "821493672837",
  appId: "1:821493672837:web:471a7e2b4b6c59077732ec",
  measurementId: "G-G7SCY0WWR7"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function loadData(){
  const doc = await db.collection('cardapio').doc('dados').get();
  state.data = doc.exists ? doc.data() : {};
  // Garante que todos os campos existam para evitar erros de renderização
  state.data.promocaoDoDia = state.data.promocaoDoDia || {nome: '', sabores: '', valor: ''};
  state.data.pizzas = state.data.pizzas || [];
  state.data.calzones = state.data.calzones || [];
  state.data.bordas = state.data.bordas || {salgadas:{}, doces:{}};
  state.data.sabores = state.data.sabores || {};
  state.data.bebidas = state.data.bebidas || [];
}

function formatMoney(v){
  if(v === null || v === undefined || v === '') return '—';
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}

function buildTabs(){
  const tabs = $('#tabs');
  tabs.innerHTML = '';

  const categories = [
    {key:'pizzas', label:'Pizzas'},
    {key:'calzones', label:'Calzones'},
    {key:'bordas', label:'Bordas'},
  ];

  // sabores categories
  Object.keys(state.data.sabores).forEach(cat=>{
    categories.push({key:`sabores:${cat}`, label:cat});
  });

  categories.push({key:'bebidas', label:'Bebidas'});

  categories.forEach((c, i)=>{
    const btn = document.createElement('button');
    btn.textContent = c.label;
    btn.className = 'tab-btn' + (i===0?' active':'');
    btn.addEventListener('click', ()=>{
      $$('.tabs button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderCards(c.key);
      const back = $('#btnBack'); back.hidden = true;
    });
    tabs.appendChild(btn);
    if(i===0) state.activeKey = c.key;
  });
}

function renderPromo(){
  const promo = state.data.promocaoDoDia || {};
  const el = $('#promo');
  if((promo.nome && promo.nome.trim()) || (promo.sabores && promo.sabores.trim()) || (promo.valor && promo.valor !== '')){
    el.innerHTML = `
      <div class="chip">🎉 Promoção do dia</div>
      <h2>${promo.nome || ''}</h2>
      <p>${promo.sabores || ''}</p>
      <strong>${promo.valor ? formatMoney(Number(promo.valor)) : ''}</strong>
    `;
  } else {
    el.innerHTML = `<div class="chip">🎉 Promoção do dia</div><p>Nenhuma promoção cadastrada.</p>`;
  }
}

function renderCards(key){
  state.activeKey = key;
  const wrap = $('#cards');
  wrap.innerHTML = '';

  if(key==='pizzas'){
    (state.data.pizzas||[]).forEach(p=>{
      const card = cardFrom({
        title: p.nome,
        desc: (p.descricao || '') + (p.saboresPermitidos ? ` • até ${p.saboresPermitidos} sabor(es)` : ''),
        price: p.valor,
        details: `${p.nome} — ${p.descricao}. Você pode escolher até ${p.saboresPermitidos} sabor(es).`
      });
      wrap.appendChild(card);
    });
  } else if(key==='calzones'){
    (state.data.calzones||[]).forEach(c=>{
      const card = cardFrom({
        title: `Calzone ${c.nome}`,
        desc: c.descricao,
        price: c.valor,
        details: `Calzone ${c.nome}: ${c.descricao}.`
      });
      wrap.appendChild(card);
    });
  } else if(key==='bordas'){
    const sal = (state.data.bordas && state.data.bordas.salgadas) ? state.data.bordas.salgadas : {};
    const doc = (state.data.bordas && state.data.bordas.doces) ? state.data.bordas.doces : {};
    const makeList = (titulo, obj)=>{
      const lines = Object.entries(obj).map(([sabor, precos])=>{
        return `${sabor}: Speed ${formatMoney(precos.Speed)}, Classic ${formatMoney(precos.Classic)}, Premium ${formatMoney(precos.Premium)}`;
      }).join('\n');
      const card = cardFrom({
        title: titulo,
        desc: lines.replaceAll('\n','<br>'),
        price: null,
        details: lines.replaceAll('\n','<br>')
      });
      wrap.appendChild(card);
    };
    makeList('Bordas Salgadas', sal);
    makeList('Bordas Doces', doc);
  } else if(key.startsWith('sabores:')){
    const cat = key.split(':')[1];
    const itens = (state.data.sabores && state.data.sabores[cat]) ? state.data.sabores[cat] : [];
    itens.forEach(s=>{
      const desc = s.ingredientes + (s.acrescimo? ` • Acréscimo: ${formatMoney(s.acrescimo)}`:'');
      wrap.appendChild(cardFrom({
        title: s.nome,
        desc: desc,
        price: null,
        details: `<strong>${s.nome}</strong><br>${desc}`
      }));
    });
  } else if(key==='bebidas'){
    (state.data.bebidas||[]).forEach(b=>{
      wrap.appendChild(cardFrom({
        title: b.nome,
        desc: 'Bebida',
        price: b.valor,
        details: `${b.nome} — ${b.valor?formatMoney(b.valor):'valor não informado'}`
      }));
    });
  }

  $('#taxa').textContent = (state.data.observacoesGerais||[]).join(' ');
}

function cardFrom({title, desc, price, details}){
  const tpl = $('#card-tpl');
  const node = tpl.content.cloneNode(true);
  $('.card-title', node).textContent = title;
  $('.card-desc', node).innerHTML = desc;
  $('.price', node).textContent = price!=null? formatMoney(Number(price)): '—';
  $('.btn-ghost', node).addEventListener('click', ()=>openDialog(title, details || desc));
  return node;
}

function openDialog(title, html){
  const dlg = $('#dlg');
  $('#dlgTitle').textContent = title;
  $('#dlgText').innerHTML = html;
  dlg.showModal();
}
$('#dlgClose')?.addEventListener('click',()=>$('#dlg').close());

async function init(){
  await loadData();
  $('#year').textContent = new Date().getFullYear();
  renderPromo();
  buildTabs();
  renderCards(state.activeKey);
}
init();
