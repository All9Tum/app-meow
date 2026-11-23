/**
 * App Meow (แอพเหมียว) — Apps Script API
 * 1) สร้างโปรเจกต์ที่ script.google.com แล้ววางไฟล์นี้
 * 2) รัน setup() หนึ่งครั้ง (สร้าง Google Sheet "App Meow", โฟลเดอร์รูป และ API KEY)
 * 3) Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone)
 * ทุกคำขอต้องแนบ API KEY ไม่งั้นถูกปฏิเสธ
 */

var SHEETS = {
  Pets: ['pet_id', 'name', 'color_main', 'color_deep', 'color_tint', 'hashtag', 'birthday', 'adopted_on',
    'breed', 'coat', 'sex', 'neutered', 'microchip', 'photo_id', 'card_front_id', 'card_back_id',
    'owner_name', 'owner_address', 'card_issued_on', 'sort', 'created_at', 'updated_at'],
  Weights: ['weight_id', 'pet_id', 'date', 'kg', 'note', 'created_at'],
  CareLogs: ['log_id', 'task', 'pet_id', 'date', 'next_due', 'cal_event_id', 'note', 'created_at'],
  Health: ['rec_id', 'pet_id', 'type', 'date', 'title', 'clinic', 'detail', 'cost', 'next_due', 'cal_event_id', 'created_at'],
  Expenses: ['exp_id', 'date', 'category', 'pet_id', 'title', 'amount', 'note', 'created_at']
};
var DATE_COLS = { Weights: ['date'], CareLogs: ['date', 'next_due'], Health: ['date', 'next_due'], Expenses: ['date'] };

// งานดูแล: water/scoop/change = ทั้งบ้าน, bath = รายตัว
var CARE_TASKS = { water: 'เติมน้ำ', scoop: 'เก็บทราย', change: 'เปลี่ยนทรายทั้งกระบะ', bath: 'อาบน้ำ' };
var HEALTH_TYPES = { vaccine: 'วัคซีน', deworm: 'ถ่ายพยาธิ', flea: 'หยดหมัด', vet: 'หาหมอ', med: 'ยา' };
var EXPENSE_CATS = ['อาหาร', 'ทราย', 'ของใช้', 'หาหมอ / ยา', 'วัคซีน / ป้องกัน', 'อื่นๆ'];

// ชีตของแอพติดบ้าน (อ่านอย่างเดียว) — ดึงของหมวด "ของแมว"
var TIDBAAN_DEFAULT_ID = '1bBq8KssdreaGjuzlyv52ukZkyElwUR4jiv9gYdGAaDI';
var TIDBAAN_CAT = 'ของแมว';

// ช่องที่หน้าเว็บแก้ได้ (รูปแก้ผ่าน uploadPhoto เท่านั้น)
var PET_EDITABLE = ['name', 'hashtag', 'birthday', 'adopted_on', 'breed', 'coat', 'sex', 'neutered',
  'microchip', 'owner_name', 'owner_address', 'card_issued_on'];
var PHOTO_KINDS = { photo: 'photo_id', card_front: 'card_front_id', card_back: 'card_back_id' };

var SEED_PETS = [
  ['P01', 'Satang', '#3B6FD9', '#2853AE', '#E3ECFB', 'SatangStories'],
  ['P02', 'Mali', '#EC6FA6', '#B83A76', '#FCE4EF', 'MaliRhyme'],
  ['P03', 'Elize', '#E04B4B', '#B52F2F', '#FBE3E1', 'ElizeTales'],
  ['P04', 'Magnum', '#4CC46A', '#1F7A3A', '#E0F5E5', 'MagnumSaga'],
  ['P05', 'Sephera', '#F28C28', '#A8530A', '#FDEBD7', 'SepheraDiaries']
];

// น้ำหนักจากชีต "Pet tracking" เดิม ย้ายมาทุกแถว (0 = ยังไม่มีน้องตัวนั้น จึงไม่ย้าย)
// ลำดับคอลัมน์: วันที่, Satang, Mali, Elize, Magnum
var SEED_WEIGHTS = [
  ['2021-10-01', 5.20, 0, 0, 0], ['2021-12-27', 5.20, 1.30, 0, 0], ['2022-01-14', 5.25, 1.30, 0, 0],
  ['2022-01-27', 5.25, 1.55, 0, 0], ['2022-02-26', 5.25, 1.80, 0, 0], ['2022-04-01', 5.15, 2.10, 0, 0],
  ['2022-04-12', 5.15, 2.10, 0, 0], ['2022-04-30', 5.15, 2.45, 0, 0], ['2022-05-12', 5.15, 2.55, 0, 0],
  ['2022-07-05', 5.45, 2.90, 0, 0], ['2022-08-12', 5.45, 3.24, 0, 0], ['2022-10-01', 5.50, 2.95, 0, 0],
  ['2023-04-28', 5.50, 3.80, 0, 0], ['2023-08-06', 5.70, 3.80, 0, 0], ['2023-08-10', 5.70, 3.80, 1.10, 0],
  ['2023-08-11', 5.70, 3.80, 1.20, 0], ['2023-08-13', 5.70, 3.80, 1.15, 0], ['2023-08-14', 5.70, 3.80, 1.15, 0],
  ['2023-08-22', 5.70, 3.80, 1.30, 0], ['2023-08-26', 5.70, 3.80, 1.40, 0], ['2023-09-01', 5.70, 3.80, 1.55, 0],
  ['2023-09-19', 5.70, 3.80, 1.85, 0], ['2023-09-21', 5.70, 3.80, 1.80, 0], ['2023-09-24', 5.70, 3.80, 1.95, 0],
  ['2023-09-29', 5.70, 3.80, 1.85, 0], ['2023-10-22', 5.90, 3.80, 1.85, 0], ['2023-11-10', 5.90, 3.80, 2.50, 0],
  ['2024-06-07', 5.80, 3.80, 2.40, 0], ['2024-09-28', 5.80, 3.80, 2.50, 0], ['2024-10-12', 6.00, 3.80, 2.50, 0],
  ['2025-01-05', 6.00, 3.80, 2.30, 0], ['2025-05-02', 6.00, 3.80, 2.30, 3.00], ['2025-08-03', 6.00, 3.80, 2.30, 4.70],
  ['2025-11-23', 6.00, 3.80, 4.20, 4.70], ['2026-08-30', 5.70, 3.70, 3.90, 6.10]
];

/* ---------- setup ---------- */

function setup() {
  var props = PropertiesService.getScriptProperties();
  var ss;
  var id = props.getProperty('SHEET_ID');
  if (id) ss = SpreadsheetApp.openById(id);
  else {
    ss = SpreadsheetApp.create('App Meow');
    props.setProperty('SHEET_ID', ss.getId());
  }
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
  ['Sheet1', 'แผ่นที่1', 'ชีต1'].forEach(function (n) {
    var s = ss.getSheetByName(n);
    if (s && ss.getSheets().length > 1) ss.deleteSheet(s);
  });

  var now = new Date().toISOString();
  var pets = ss.getSheetByName('Pets');
  if (pets.getLastRow() < 2) {
    var rows = SEED_PETS.map(function (p, i) {
      var r = SHEETS.Pets.map(function () { return ''; });
      r[0] = p[0]; r[1] = p[1]; r[2] = p[2]; r[3] = p[3]; r[4] = p[4]; r[5] = p[5];
      r[SHEETS.Pets.indexOf('sort')] = i + 1;
      r[SHEETS.Pets.indexOf('created_at')] = now;
      r[SHEETS.Pets.indexOf('updated_at')] = now;
      return r;
    });
    pets.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  // ตั้งคอลัมน์วันที่/ไมโครชิปเป็นข้อความ กันชีตแปลงเอง
  ['birthday', 'adopted_on', 'card_issued_on', 'microchip'].forEach(function (c) {
    pets.getRange(1, SHEETS.Pets.indexOf(c) + 1, pets.getMaxRows(), 1).setNumberFormat('@');
  });

  Object.keys(DATE_COLS).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    DATE_COLS[name].forEach(function (c) {
      sh.getRange(1, SHEETS[name].indexOf(c) + 1, sh.getMaxRows(), 1).setNumberFormat('@');
    });
  });
  if (!props.getProperty('TIDBAAN_ID')) props.setProperty('TIDBAAN_ID', TIDBAAN_DEFAULT_ID);
  // ขอสิทธิ์ปฏิทินตั้งแต่ตอน setup (ครั้งแรกจะมีหน้าขออนุญาต)
  CalendarApp.getDefaultCalendar();

  var w = ss.getSheetByName('Weights');
  if (w.getLastRow() < 2) {
    var wr = [];
    var n = 0;
    SEED_WEIGHTS.forEach(function (row) {
      for (var k = 1; k <= 4; k++) {
        if (row[k] > 0) {
          n++;
          wr.push(['W' + ('0000' + n).slice(-4), SEED_PETS[k - 1][0], row[0], row[k], 'ย้ายจากชีตเดิม', now]);
        }
      }
    });
    w.getRange(2, 1, wr.length, wr[0].length).setValues(wr);
  }

  if (!props.getProperty('FOLDER_ID')) {
    var folder = DriveApp.createFolder('App Meow – รูป');
    props.setProperty('FOLDER_ID', folder.getId());
  }
  if (!props.getProperty('API_KEY')) {
    props.setProperty('API_KEY', Utilities.getUuid().replace(/-/g, '').slice(0, 20));
  }
  Logger.log('ชีต: ' + ss.getUrl());
  Logger.log('API KEY ของคุณคือ: ' + props.getProperty('API_KEY'));
}

function showApiKey() {
  Logger.log('API KEY ของคุณคือ: ' + PropertiesService.getScriptProperties().getProperty('API_KEY'));
}

/* ---------- web ---------- */

function doGet() {
  return json_({ ok: true, app: 'pet-tracking' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var key = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (!key || req.key !== key) return json_({ ok: false, error: 'API KEY ไม่ถูกต้อง' });
    var fn = ACTIONS[req.action];
    if (!fn) return json_({ ok: false, error: 'ไม่รู้จักคำสั่ง ' + req.action });
    lock.waitLock(20000);
    var data = fn(req.payload || {});
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

var ACTIONS = {
  getAll: function () {
    var care = readAll_('CareLogs');
    return {
      pets: readAll_('Pets'), weights: readAll_('Weights'),
      care: care.slice(-300), health: readAll_('Health'), expenses: readAll_('Expenses'),
      tidbaan: tidbaan_()
    };
  },

  /* ----- งานดูแล ----- */
  logCare: function (p) {
    if (!CARE_TASKS[p.task]) throw new Error('ไม่รู้จักงานนี้');
    if (p.task === 'bath' && !petExists_(p.pet_id)) throw new Error('ไม่พบน้อง');
    var date = checkDate_(p.date || today_(), 'วันที่');
    var next = p.next_due ? checkDate_(p.next_due, 'วันนัดครั้งถัดไป') : '';
    var row = { log_id: id_('C'), task: p.task, pet_id: p.task === 'bath' ? p.pet_id : '', date: date,
      next_due: next, cal_event_id: '', note: clean_(p.note || ''), created_at: new Date().toISOString() };
    if (next && p.calendar) row.cal_event_id = calEvent_('[App Meow] ' + CARE_TASKS[p.task], next, 'นัดจาก App Meow');
    append_('CareLogs', row);
    return row;
  },
  deleteCare: function (p) { return deleteById_('CareLogs', 'log_id', p.log_id); },

  /* ----- สุขภาพ ----- */
  addHealth: function (p) {
    if (!HEALTH_TYPES[p.type]) throw new Error('ประเภทไม่ถูกต้อง');
    var pet = readAll_('Pets').filter(function (r) { return r.pet_id === p.pet_id; })[0];
    if (!pet) throw new Error('ไม่พบน้อง');
    var cost = p.cost === '' || p.cost == null ? '' : Number(p.cost);
    if (cost !== '' && !(cost >= 0 && cost < 1e7)) throw new Error('ค่าใช้จ่ายไม่ถูกต้อง');
    var row = { rec_id: id_('H'), pet_id: p.pet_id, type: p.type, date: checkDate_(p.date, 'วันที่'),
      title: clean_(p.title || ''), clinic: clean_(p.clinic || ''), detail: clean_(p.detail || ''), cost: cost,
      next_due: p.next_due ? checkDate_(p.next_due, 'วันนัดครั้งถัดไป') : '', cal_event_id: '',
      created_at: new Date().toISOString() };
    if (row.next_due && p.calendar) {
      row.cal_event_id = calEvent_('[App Meow] ' + HEALTH_TYPES[p.type] + ' ' + pet.name, row.next_due,
        [row.title, row.clinic].filter(String).join(' · '));
    }
    append_('Health', row);
    return row;
  },
  deleteHealth: function (p) { return deleteById_('Health', 'rec_id', p.rec_id); },

  /* ----- ค่าใช้จ่าย (กรอกเอง) ----- */
  addExpense: function (p) {
    if (EXPENSE_CATS.indexOf(p.category) < 0) throw new Error('หมวดไม่ถูกต้อง');
    var amount = Number(p.amount);
    if (!(amount > 0 && amount < 1e7)) throw new Error('จำนวนเงินไม่ถูกต้อง');
    if (p.pet_id && !petExists_(p.pet_id)) throw new Error('ไม่พบน้อง');
    var row = { exp_id: id_('E'), date: checkDate_(p.date, 'วันที่'), category: p.category, pet_id: p.pet_id || '',
      title: clean_(p.title || ''), amount: Math.round(amount * 100) / 100, note: clean_(p.note || ''),
      created_at: new Date().toISOString() };
    append_('Expenses', row);
    return row;
  },
  deleteExpense: function (p) { return deleteById_('Expenses', 'exp_id', p.exp_id); },

  savePet: function (p) {
    var sh = sheet_('Pets');
    var rows = readAll_('Pets');
    var idx = -1;
    for (var i = 0; i < rows.length; i++) if (rows[i].pet_id === p.pet_id) idx = i;
    if (idx < 0) throw new Error('ไม่พบน้อง ' + p.pet_id);
    var row = rows[idx];
    PET_EDITABLE.forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(p, k)) row[k] = clean_(p[k]);
    });
    if (!String(row.name).trim()) throw new Error('ต้องมีชื่อน้อง');
    row.updated_at = new Date().toISOString();
    writeRow_(sh, idx + 2, 'Pets', row);
    return row;
  },

  addWeight: function (p) {
    var kg = Number(p.kg);
    if (!(kg > 0 && kg < 30)) throw new Error('น้ำหนักต้องอยู่ระหว่าง 0–30 กก.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date || ''))) throw new Error('วันที่ไม่ถูกต้อง');
    if (!petExists_(p.pet_id)) throw new Error('ไม่พบน้อง');
    var row = { weight_id: 'W' + Date.now().toString(36) + Math.floor(Math.random() * 1000),
      pet_id: p.pet_id, date: p.date, kg: Math.round(kg * 100) / 100, note: clean_(p.note || ''),
      created_at: new Date().toISOString() };
    var sh = sheet_('Weights');
    writeRow_(sh, sh.getLastRow() + 1, 'Weights', row);
    return row;
  },

  deleteWeight: function (p) {
    var sh = sheet_('Weights');
    var rows = readAll_('Weights');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].weight_id === p.weight_id) { sh.deleteRow(i + 2); return { weight_id: p.weight_id }; }
    }
    throw new Error('ไม่พบรายการนี้');
  },

  uploadPhoto: function (p) {
    var col = PHOTO_KINDS[p.kind];
    if (!col) throw new Error('ประเภทรูปไม่ถูกต้อง');
    var m = String(p.dataUrl || '').match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
    if (!m) throw new Error('ไฟล์รูปไม่ถูกต้อง');
    var bytes = Utilities.base64Decode(m[3]);
    if (bytes.length > 3 * 1024 * 1024) throw new Error('รูปใหญ่เกิน 3MB');
    var sh = sheet_('Pets');
    var rows = readAll_('Pets');
    var idx = -1;
    for (var i = 0; i < rows.length; i++) if (rows[i].pet_id === p.pet_id) idx = i;
    if (idx < 0) throw new Error('ไม่พบน้อง');
    var row = rows[idx];
    var folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOLDER_ID'));
    var blob = Utilities.newBlob(bytes, m[1], row.name + '_' + p.kind + '_' + Date.now() + '.' + (m[2] === 'jpeg' ? 'jpg' : m[2]));
    var file = folder.createFile(blob);
    if (row[col]) { try { DriveApp.getFileById(row[col]).setTrashed(true); } catch (x) {} }
    row[col] = file.getId();
    row.updated_at = new Date().toISOString();
    writeRow_(sh, idx + 2, 'Pets', row);
    return row;
  },

  getPhoto: function (p) {
    // อ่านได้เฉพาะไฟล์ที่ผูกกับน้องในชีตเท่านั้น
    var ok = readAll_('Pets').some(function (r) {
      return r.photo_id === p.file_id || r.card_front_id === p.file_id || r.card_back_id === p.file_id;
    });
    if (!p.file_id || !ok) throw new Error('ไม่พบรูป');
    var blob = DriveApp.getFileById(p.file_id).getBlob();
    return { file_id: p.file_id, dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
  }
};

/* ---------- helpers ---------- */

function ss_() {
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
}
function sheet_(name) { return ss_().getSheetByName(name); }

function readAll_(name) {
  var sh = sheet_(name);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var head = SHEETS[name];
  var vals = sh.getRange(2, 1, last - 1, head.length).getDisplayValues();
  return vals.filter(function (r) { return r[0] !== ''; }).map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = r[i]; });
    if (name === 'Weights') o.kg = Number(o.kg);
    if (name === 'Pets') o.sort = Number(o.sort) || 0;
    if (name === 'Health') o.cost = o.cost === '' ? '' : Number(String(o.cost).replace(/,/g, ''));
    if (name === 'Expenses') o.amount = Number(String(o.amount).replace(/,/g, ''));
    return o;
  });
}

function writeRow_(sh, rowNum, name, obj) {
  var head = SHEETS[name];
  sh.getRange(rowNum, 1, 1, head.length).setValues([head.map(function (h) {
    var v = obj[h];
    return v === undefined || v === null ? '' : v;
  })]);
}

function append_(name, row) {
  var sh = sheet_(name);
  writeRow_(sh, sh.getLastRow() + 1, name, row);
}

function deleteById_(name, key, id) {
  var sh = sheet_(name);
  var rows = readAll_(name);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][key] === id) {
      if (rows[i].cal_event_id) {
        try { CalendarApp.getDefaultCalendar().getEventById(rows[i].cal_event_id).deleteEvent(); } catch (x) {}
      }
      sh.deleteRow(i + 2);
      return { id: id };
    }
  }
  throw new Error('ไม่พบรายการนี้');
}

function id_(prefix) { return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000); }

function today_() { return Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd'); }

function checkDate_(s, label) {
  s = String(s || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(label + 'ไม่ถูกต้อง');
  return s;
}

// นัดทั้งวันในปฏิทินหลัก (ใช้เที่ยงวันกันวันเลื่อนจากเขตเวลา)
function calEvent_(title, ymd, desc) {
  var p = ymd.split('-').map(Number);
  var ev = CalendarApp.getDefaultCalendar().createAllDayEvent(title, new Date(p[0], p[1] - 1, p[2], 12), { description: desc || '' });
  return ev.getId();
}

// อ่านสต็อกและการซื้อหมวด "ของแมว" จากชีตติดบ้าน
function tidbaan_() {
  try {
    var id = PropertiesService.getScriptProperties().getProperty('TIDBAAN_ID') || TIDBAAN_DEFAULT_ID;
    var tb = SpreadsheetApp.openById(id);
    var items = tableOf_(tb.getSheetByName('Items')).filter(function (r) { return r.category === TIDBAAN_CAT; });
    var byId = {};
    items.forEach(function (r) { byId[r.item_id] = r; });
    var stock = items.map(function (r) {
      return { item_id: r.item_id, name: r.name, brand: r.brand, group: r.group, icon: r.icon,
        unit: r.unit, qty_on_hand: Number(r.qty_on_hand) || 0 };
    });
    var purchases = tableOf_(tb.getSheetByName('Transactions')).filter(function (t) {
      return t.type === 'BUY' && byId[t.item_id];
    }).map(function (t) {
      var it = byId[t.item_id];
      var d = new Date(t.timestamp);
      return { tx_id: t.tx_id, date: isNaN(d) ? '' : Utilities.formatDate(d, 'Asia/Bangkok', 'yyyy-MM-dd'),
        name: it.name, group: it.group, amount: (Number(t.packs) || 0) * (Number(t.price_per_pack) || 0) };
    });
    return { ok: true, stock: stock, purchases: purchases };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err), stock: [], purchases: [] };
  }
}

function tableOf_(sh) {
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getDisplayValues();
  var head = v[0];
  return v.slice(1).filter(function (r) { return r[0] !== ''; }).map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = r[i]; });
    return o;
  });
}

function petExists_(id) {
  return readAll_('Pets').some(function (r) { return r.pet_id === id; });
}

// กันสูตรชีต (=, +, -, @) ถูกตีความเป็นสูตร
function clean_(v) {
  var s = String(v == null ? '' : v).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
