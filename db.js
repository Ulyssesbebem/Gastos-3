const DB = {
  CARTOES: ['Nubank', 'C6 Bank', 'Itaú', 'Bradesco', 'Santander', 'Inter', 'XP'],
  CORES: ['#16a085','#c0392b','#8e44ad','#2980b9','#d35400','#27ae60','#e67e22','#1abc9c','#9b59b6','#34495e'],
  EMOJIS: ['👤','👨','👩','👦','👧','👴','👵','🧑','👫','🧒'],

  // ── Config ──────────────────────────────────────────────
  getConfig() { return JSON.parse(localStorage.getItem('g3_config') || 'null'); },
  saveConfig(c) { localStorage.setItem('g3_config', JSON.stringify(c)); },
  isConfigured() { const c = this.getConfig(); return !!(c && c.configurado); },

  // ── Pessoas ──────────────────────────────────────────────
  getPessoas() { return JSON.parse(localStorage.getItem('g3_pessoas') || '[]'); },
  savePessoas(p) { localStorage.setItem('g3_pessoas', JSON.stringify(p)); },
  addPessoa(obj) {
    const all = this.getPessoas();
    const chave = this.gerarChave(obj.nome) + '_' + Date.now();
    const nova = { ...obj, id: Date.now(), chave };
    all.push(nova);
    this.savePessoas(all);
    return nova;
  },
  updatePessoa(id, upd) {
    const all = this.getPessoas();
    const i = all.findIndex(p => p.id === id);
    if (i !== -1) { Object.assign(all[i], upd); this.savePessoas(all); }
  },
  deletePessoa(id) { this.savePessoas(this.getPessoas().filter(p => p.id !== id)); },

  // ── Categorias extras ─────────────────────────────────────
  getCategoriasExtras() { return JSON.parse(localStorage.getItem('g3_cats') || '[]'); },
  saveCategorias(c) { localStorage.setItem('g3_cats', JSON.stringify(c)); },
  addCategoria(obj) {
    const all = this.getCategoriasExtras();
    const nova = { ...obj, id: Date.now(), chave: this.gerarChave(obj.nome) + '_' + Date.now() };
    all.push(nova);
    this.saveCategorias(all);
    return nova;
  },
  deleteCategoria(id) { this.saveCategorias(this.getCategoriasExtras().filter(c => c.id !== id)); },

  // ── Monta lista completa de categorias ────────────────────
  getCategorias() {
    const cfg = this.getConfig();
    if (!cfg) return [];
    const cats = [];
    if (cfg.modoCasa) cats.push({ chave:'casa', nome:'Contas de Casa', emoji:'🏠', cor:'#e67e22', tipo:'casa' });
    this.getPessoas().forEach(p => cats.push({ chave: p.chave, nome: p.nome, emoji: p.emoji, cor: p.cor, tipo:'pessoa', pessoaId: p.id }));
    cats.push({ chave:'pessoal', nome: cfg.nomePrincipal || 'Meus Gastos', emoji: cfg.emojiPrincipal || '👤', cor:'#2980b9', tipo:'pessoal' });
    this.getCategoriasExtras().forEach(c => cats.push({ ...c, tipo:'extra' }));
    return cats;
  },

  // ── Despesas ─────────────────────────────────────────────
  getDespesas() { return JSON.parse(localStorage.getItem('g3_despesas') || '[]'); },
  getReceitas() { return JSON.parse(localStorage.getItem('g3_receitas') || '[]'); },
  saveDespesas(d) { localStorage.setItem('g3_despesas', JSON.stringify(d)); },
  saveReceitas(r) { localStorage.setItem('g3_receitas', JSON.stringify(r)); },

  addDespesa(obj) {
    const all = this.getDespesas();
    const match = (obj.parcela || '').match(/^(\d+)\s*\/\s*(\d+)$/);
    if (match) {
      const ini = parseInt(match[1]), tot = parseInt(match[2]);
      let mes = obj.mes;
      for (let i = ini; i <= tot; i++) {
        all.push({ ...obj, id: Date.now() + i, parcela: `${i}/${tot}`, mes, criado_em: new Date().toISOString() });
        mes = this.mesProximo(mes);
      }
    } else {
      all.push({ ...obj, id: Date.now(), criado_em: new Date().toISOString() });
    }
    this.saveDespesas(all);
  },
  updateDespesa(id, upd) {
    const all = this.getDespesas();
    const idx = all.findIndex(d => d.id === id);
    if (idx === -1) return;
    const orig = all[idx];
    const match = (orig.parcela || '').match(/^(\d+)\/(\d+)$/);
    if (match) {
      const num = parseInt(match[1]), tot = parseInt(match[2]);
      for (let i = num + 1; i <= tot; i++) {
        const irma = all.find(d => d.descricao === orig.descricao && d.categoria === orig.categoria && d.parcela === `${i}/${tot}`);
        if (irma) Object.assign(irma, { categoria: upd.categoria, descricao: upd.descricao, valor: upd.valor, cartao: upd.cartao });
      }
    }
    Object.assign(all[idx], upd);
    this.saveDespesas(all);
  },
  deleteDespesa(id) { this.saveDespesas(this.getDespesas().filter(d => d.id !== id)); },

  addReceita(obj) {
    const all = this.getReceitas();
    all.push({ ...obj, id: Date.now(), criado_em: new Date().toISOString() });
    this.saveReceitas(all);
  },
  updateReceita(id, upd) {
    const all = this.getReceitas();
    const i = all.findIndex(r => r.id === id);
    if (i !== -1) { Object.assign(all[i], upd); this.saveReceitas(all); }
  },
  deleteReceita(id) { this.saveReceitas(this.getReceitas().filter(r => r.id !== id)); },

  // ── Cálculos ──────────────────────────────────────────────
  calcularMes(mes) {
    const cfg = this.getConfig();
    const despesas = this.getDespesas().filter(d => d.mes === mes);
    const receitas = this.getReceitas().filter(r => r.mes === mes);
    const pessoas = this.getPessoas();
    const cats = this.getCategorias();

    const totais = {};
    cats.forEach(c => {
      totais[c.chave] = despesas.filter(d => d.categoria === c.chave).reduce((s, d) => s + d.valor, 0);
    });

    const totalCasa = totais['casa'] || 0;
    const pessoasQueDividemCasa = pessoas.filter(p => p.divideCasa);
    const numDivisoesCasa = pessoasQueDividemCasa.length + 1;
    const casaPorPessoa = cfg.modoCasa ? totalCasa / numDivisoesCasa : 0;

    const devedores = {};
    pessoas.forEach(p => {
      let total = 0;
      if (p.usaCartao) total += totais[p.chave] || 0;
      if (p.divideCasa) total += casaPorPessoa;
      devedores[p.chave] = total;
    });

    const totalDevedores = Object.values(devedores).reduce((s, v) => s + v, 0);
    const totalReceitaManual = receitas.reduce((s, r) => s + r.valor, 0);
    const totalReceitas = totalReceitaManual + totalDevedores;
    const totalDespesas = Object.values(totais).reduce((s, v) => s + v, 0);
    const meusGastosReais = (totais['pessoal'] || 0) + casaPorPessoa;
    const saldo = totalReceitas - totalDespesas;

    return { totais, totalCasa, casaPorPessoa, numDivisoesCasa, devedores, totalDevedores, totalReceitaManual, totalReceitas, totalDespesas, meusGastosReais, saldo };
  },

  // ── Tempo ─────────────────────────────────────────────────
  getMesAtual() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },
  mesAnterior(mes) {
    const [a, m] = mes.split('-').map(Number);
    return m === 1 ? `${a-1}-12` : `${a}-${String(m-1).padStart(2,'0')}`;
  },
  mesProximo(mes) {
    const [a, m] = mes.split('-').map(Number);
    return m === 12 ? `${a+1}-01` : `${a}-${String(m+1).padStart(2,'0')}`;
  },
  getMesesDisponiveis(mesAtual) {
    const s = new Set();
    this.getDespesas().forEach(d => s.add(d.mes));
    this.getReceitas().forEach(r => s.add(r.mes));
    const atual = mesAtual || this.getMesAtual();
    s.add(atual); s.add(this.mesAnterior(atual)); s.add(this.mesProximo(atual));
    return [...s].sort().reverse();
  },
  formatarMes(mes) {
    const n = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const [a, m] = mes.split('-').map(Number);
    return `${n[m-1]} ${a}`;
  },

  // ── Utilitários ───────────────────────────────────────────
  gerarChave(nome) {
    return nome.toLowerCase()
      .replace(/[ãáâà]/g,'a').replace(/[éê]/g,'e').replace(/[íî]/g,'i')
      .replace(/[óôõ]/g,'o').replace(/[úû]/g,'u').replace(/ç/g,'c')
      .replace(/[^a-z0-9]/g,'').slice(0, 12);
  },
  fmt(v) { return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
  fmt0(v) { return Math.round(v).toLocaleString('pt-BR'); },
  escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); },
  hoje() { return new Date().toISOString().split('T')[0]; },
};
