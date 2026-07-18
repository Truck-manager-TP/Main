// PTL discovery page — minimal behaviour, no build step required.

const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    nav.classList.toggle('is-open');
  });
}

// Close mobile menu after choosing a link
document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => nav.classList.remove('is-open'));
});

// Pricing: mensuel / annuel toggle
const pricingToggle = document.querySelector('.pricing-toggle');
const pricingBtns = document.querySelectorAll('.pricing-toggle-btn');

function formatPrice(n) {
  const num = parseFloat(n);
  if (Number.isNaN(num)) return n;
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${parts[0]},${parts[1]}`;
}

function formatTotal(n) {
  const num = Math.round(parseFloat(n));
  if (Number.isNaN(num)) return n;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const RATES = {
  starter: { monthly: 2.20, annual: 1.87 },
  pro: { monthly: 1.65, annual: 1.40 },
  enterprise: { monthly: 0.95, annual: 0.81 },
};

function updatePricingExamples(isAnnual) {
  const mode = isAnnual ? 'annual' : 'monthly';
  const rs = RATES.starter[mode];
  const rp = RATES.pro[mode];
  const re = RATES.enterprise[mode];

  const kgStarter = 500;
  const kgPro = 3000;
  const kgEnt = 15000;
  const kgCmp = 1200;

  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  set('exFormulaStarter', `${formatTotal(kgStarter)} kg × ${formatPrice(rs)} DH/kg`);
  set('exTotalStarter', `${formatTotal(kgStarter * rs)} DH HT`);

  set('exFormulaPro', `${formatTotal(kgPro)} kg × ${formatPrice(rp)} DH/kg`);
  set('exTotalPro', `${formatTotal(kgPro * rp)} DH HT`);

  set('exFormulaEnterprise', `${formatTotal(kgEnt)} kg × ${formatPrice(re)} DH/kg`);
  set('exTotalEnterprise', `${formatTotal(kgEnt * re)} DH HT`);

  set('exCmpStarter', `${formatTotal(kgCmp * rs)} DH`);
  set('exCmpPro', `${formatTotal(kgCmp * rp)} DH`);
  set('exCmpEnterprise', `${formatTotal(kgCmp * re)} DH`);

  const savePro = document.getElementById('exSavePro');
  const saveEnt = document.getElementById('exSaveEnterprise');

  if (isAnnual) {
    const proSave = Math.round(kgPro * (RATES.pro.monthly - RATES.pro.annual));
    const entSave = Math.round(kgEnt * (RATES.enterprise.monthly - RATES.enterprise.annual));
    if (savePro) {
      savePro.hidden = false;
      savePro.textContent = `Économie vs Standard : ${formatTotal(proSave)} DH / mois`;
    }
    if (saveEnt) {
      saveEnt.hidden = false;
      saveEnt.textContent = `Économie vs Standard : ${formatTotal(entSave)} DH / mois`;
    }
  } else {
    if (savePro) savePro.hidden = true;
    if (saveEnt) saveEnt.hidden = true;
  }
}

function setBilling(mode) {
  const isAnnual = mode === 'annual';
  if (pricingToggle) pricingToggle.classList.toggle('is-annual', isAnnual);

  document.querySelectorAll('.plan-price[data-monthly]').forEach((el) => {
    const amount = el.querySelector('.plan-amount');
    const value = isAnnual ? el.dataset.annual : el.dataset.monthly;
    if (amount) amount.textContent = formatPrice(value);
  });

  document.querySelectorAll('#tarifs .plan-note').forEach((note) => {
    note.textContent = isAnnual
      ? 'Contrat annuel −15 % au kg expédié'
      : 'Tarif standard au kg expédié';
  });

  const rateRow = document.querySelector('.matrix-row--rates');
  if (rateRow) {
    const cells = rateRow.querySelectorAll('span');
    if (cells.length >= 4) {
      cells[1].textContent = isAnnual ? '1,87 DH' : '2,20 DH';
      cells[2].textContent = isAnnual ? '1,40 DH' : '1,65 DH';
      cells[3].textContent = isAnnual ? 'dès 0,81 DH' : 'dès 0,95 DH';
    }
  }

  updatePricingExamples(isAnnual);
}

updatePricingExamples(false);

pricingBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    pricingBtns.forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    setBilling(btn.dataset.billing);
  });
});
