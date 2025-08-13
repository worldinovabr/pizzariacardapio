
const $ = (q, el=document)=>el.querySelector(q);
const $$ = (q, el=document)=>Array.from(el.querySelectorAll(q));

const state = { data:null, categoriaAtual:null };

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
}
async function saveData(){
  await db.collection('cardapio').doc('dados').set(state.data);
  alert('Dados salvos com sucesso!');
}

function money(v){ return v==null||v===''? '' : Number(v).toFixed(2); }

function renderPromo(){
  const f = $('#formPromo');
  const p = state.data.promocaoDoDia || {};
  f.nome.value = p.nome || '';
  f.sabores.value = p.sabores || '';
  f.valor.value = p.valor || '';
  f.addEventListener('submit', (e)=>{
    e.preventDefault();
    state.data.promocaoDoDia = {
      nome: f.nome.value.trim(),
      sabores: f.sabores.value.trim(),
      valor: f.valor.value.trim()
    };
    saveData();
  });
  $('#btnClearPromo').addEventListener('click', ()=>{
    state.data.promocaoDoDia = {nome:'', sabores:'', valor:''};
    renderPromo(); saveData();
  });
}

function renderPizzas(){
  const tbody = $('#tblPizzas tbody'); tbody.innerHTML = '';
  state.data.pizzas.forEach((p, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${p.nome}"></td>
      <td><input value="${p.descricao}"></td>
      <td><input type="number" min="1" value="${p.saboresPermitidos}"></td>
      <td><input type="number" step="0.01" value="${money(p.valor)}"></td>
      <td><button class="btn-ghost" data-del="${idx}">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.addEventListener('change', (e)=>{
    const tr = e.target.closest('tr'); if(!tr) return;
    const i = [...tbody.children].indexOf(tr);
    const [nome, descricao, saboresPermitidos, valor] = $$('input', tr).map(x=>x.value);
    Object.assign(state.data.pizzas[i], {
      nome, descricao, saboresPermitidos:Number(saboresPermitidos), valor:Number(valor)
    });
    saveData();
  });
  tbody.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-del]'); if(!btn) return;
    const i = Number(btn.dataset.del);
    if(confirm('Excluir pizza?')){
      state.data.pizzas.splice(i,1); renderPizzas(); saveData();
    }
  });
  $('#addPizza').onclick = ()=>{
    state.data.pizzas.push({nome:'Nova', descricao:'', saboresPermitidos:1, valor:0});
    renderPizzas(); saveData();
  };
}

function renderCalzones(){
  const tbody = $('#tblCalzones tbody'); tbody.innerHTML = '';
  state.data.calzones.forEach((c, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${c.nome}"></td>
      <td><input value="${c.descricao}"></td>
      <td><input type="number" step="0.01" value="${money(c.valor)}"></td>
      <td><button class="btn-ghost" data-del="${idx}">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.addEventListener('change', (e)=>{
    const tr = e.target.closest('tr'); if(!tr) return;
    const i = [...tbody.children].indexOf(tr);
    const [nome, descricao, valor] = $$('input', tr).map(x=>x.value);
    Object.assign(state.data.calzones[i], {nome, descricao, valor:Number(valor)});
    saveData();
  });
  tbody.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-del]'); if(!btn) return;
    const i = Number(btn.dataset.del);
    if(confirm('Excluir calzone?')){
      state.data.calzones.splice(i,1); renderCalzones(); saveData();
    }
  });
  $('#addCalzone').onclick = ()=>{
    state.data.calzones.push({nome:'Novo', descricao:'', valor:0});
    renderCalzones(); saveData();
  };
}

function fillCategorias(){
  const sel = $('#selCategoria'); sel.innerHTML='';
  Object.keys(state.data.sabores).forEach((k,i)=>{
    const opt = document.createElement('option');
    opt.value = k; opt.textContent = k; sel.appendChild(opt);
    if(i===0) state.categoriaAtual = k;
  });
  sel.value = state.categoriaAtual;
  sel.addEventListener('change', ()=>{ state.categoriaAtual = sel.value; renderSabores(); });
}

function renderSabores(){
  const cat = state.categoriaAtual;
  const tbody = $('#tblSabores tbody'); tbody.innerHTML = '';
  (state.data.sabores[cat]||[]).forEach((s, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${s.nome}"></td>
      <td><input value="${s.ingredientes}"></td>
      <td><input type="number" step="0.01" value="${s.acrescimo||0}"></td>
      <td><button class="btn-ghost" data-del="${idx}">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.onchange = (e)=>{
    const tr = e.target.closest('tr'); if(!tr) return;
    const i = [...tbody.children].indexOf(tr);
    const [nome, ingredientes, acrescimo] = $$('input', tr).map(x=>x.value);
    Object.assign(state.data.sabores[cat][i], {nome, ingredientes, acrescimo:Number(acrescimo)});
    saveData();
  };
  tbody.onclick = (e)=>{
    const btn = e.target.closest('button[data-del]'); if(!btn) return;
    const i = Number(btn.dataset.del);
    if(confirm('Excluir sabor?')){
      state.data.sabores[cat].splice(i,1); renderSabores(); saveData();
    }
  };
  $('#addSabor').onclick = ()=>{
    state.data.sabores[cat].push({nome:'Novo sabor', ingredientes:'', acrescimo:0});
    renderSabores(); saveData();
  };
}

function renderBordas(){
  const blocos = [
    ['salgadas', $('#bordasSalgadas')],
    ['doces', $('#bordasDoces')]
  ];
  blocos.forEach(([tipo, el])=>{
    el.innerHTML = '';
    const grupo = state.data.bordas[tipo];
    Object.keys(grupo).forEach((nome)=>{
      const precos = grupo[nome];
      const box = document.createElement('div');
      box.style.marginBottom = '12px';
      box.innerHTML = `
        <strong>${nome}</strong><br>
        Speed: <input data-k="Speed" value="${precos.Speed}" type="number" step="0.01" style="width:100px">
        Classic: <input data-k="Classic" value="${precos.Classic}" type="number" step="0.01" style="width:100px">
        Premium: <input data-k="Premium" value="${precos.Premium}" type="number" step="0.01" style="width:100px">
        <button class="btn-ghost small" data-del="${nome}">Excluir</button>
      `;
      el.appendChild(box);
      box.addEventListener('change',(e)=>{
        const k = e.target.dataset.k; if(!k) return;
        state.data.bordas[tipo][nome][k] = Number(e.target.value);
        saveData();
      });
      box.querySelector('button[data-del]').onclick=()=>{
        if(confirm('Excluir sabor de borda?')){
          delete state.data.bordas[tipo][nome];
          renderBordas(); saveData();
        }
      };
    });
    // Adicionar novo
    const add = document.createElement('div');
    add.innerHTML = `
      <input placeholder="Novo sabor de borda">
      <button class="btn-ghost">+ Adicionar</button>
    `;
    const [inp, btn] = add.children;
    btn.onclick = ()=>{
      const n = inp.value.trim(); if(!n) return;
      state.data.bordas[tipo][n] = {Speed:0, Classic:0, Premium:0};
      renderBordas(); saveData();
    };
    el.appendChild(add);
  });
}

function renderBebidas(){
  const tbody = $('#tblBebidas tbody'); tbody.innerHTML='';
  state.data.bebidas.forEach((b, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${b.nome}"></td>
      <td><input type="number" step="0.01" value="${b.valor==null?'':b.valor}"></td>
      <td><button class="btn-ghost" data-del="${idx}">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.onchange = (e)=>{
    const tr = e.target.closest('tr'); if(!tr) return;
    const i = [...tbody.children].indexOf(tr);
    const [nome, valor] = $$('input', tr).map(x=>x.value);
    Object.assign(state.data.bebidas[i], {nome, valor: valor===''? null : Number(valor)});
    saveData();
  };
  tbody.onclick = (e)=>{
    const btn = e.target.closest('button[data-del]'); if(!btn) return;
    const i = Number(btn.dataset.del);
    if(confirm('Excluir bebida?')){
      state.data.bebidas.splice(i,1); renderBebidas(); saveData();
    }
  };
  $('#addBebida').onclick = ()=>{
    state.data.bebidas.push({nome:'Nova bebida', valor:0});
    renderBebidas(); saveData();
  };
}

function tabs(){
  $$('.tab-btn').forEach(btn=>{
    btn.onclick = ()=>{
      $$('.tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      $$('.panel').forEach(p=>p.classList.remove('active'));
      $('#'+tab).classList.add('active');
    };
  });
}

function backup(){
  $('#btnExport').onclick = ()=>{
    const blob = new Blob([JSON.stringify(state.data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pizzaria-data-backup.json'; a.click();
    URL.revokeObjectURL(url);
  };
  $('#fileImport').onchange = (e)=>{
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const json = JSON.parse(String(reader.result));
        state.data = json; saveData(); location.reload();
      }catch(err){ alert('JSON inválido'); }
    };
    reader.readAsText(file);
  };
  $('#btnReset').onclick = ()=>{
    if(confirm('Restaurar dados originais do app?')){
      localStorage.removeItem('pizzariaData'); location.reload();
    }
  };
}

async function init(){
  await loadData();
  $('#year').textContent = new Date().getFullYear();
  renderPromo();
  renderPizzas();
  renderCalzones();
  fillCategorias();
  renderSabores();
  renderBordas();
  renderBebidas();
  tabs();
}
init();
