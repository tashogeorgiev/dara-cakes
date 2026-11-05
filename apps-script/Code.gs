/**
 * Can Cakes – приемане на запитвания от формата на сайта.
 * Сайтът праща данните тук, а скриптът ги изпраща като имейл
 * от Gmail акаунта, в който е публикуван (todor.petrovich@gmail.com).
 *
 * Публикуване: Deploy → New deployment → Web app
 *   Execute as: Me    Who has access: Anyone
 */

const TO = 'todor.petrovich@gmail.com';
const SUBJECT = 'Ново запитване от сайта на Can Cakes';
const LABELS = { email: 'Имейл' };          // по-четими имена в писмото
const MAX_LEN = 2000;                        // таван за дължина на всяко поле

// Пусни веднъж от редактора (▶ Run), за да дадеш разрешение и да получиш пробно писмо.
function testSend() {
  const r = doPost({ postData: { contents: JSON.stringify({
    'Име': 'Тест от редактора', 'Телефон': '0888 000 000', email: TO,
    'Повод': 'Друго', 'Бележки': 'Пробно писмо от Apps Script.'
  }) } });
  Logger.log(r.getContent());
}

function doPost(e) {
  try {
    let data = {};
    const raw = e && e.postData && e.postData.contents;
    if (raw) {
      try { data = JSON.parse(raw); } catch (_) { data = e.parameter || {}; }
    } else {
      data = (e && e.parameter) || {};
    }

    // Капан за ботове: попълнено скрито поле → тихо „успех“, без имейл.
    if (data._honey) return json({ ok: true });

    const rows = Object.keys(data)
      .filter(k => k.charAt(0) !== '_' && String(data[k]).trim() !== '')
      .map(k => [LABELS[k] || k, String(data[k]).slice(0, MAX_LEN)]);

    if (!rows.length) return json({ ok: false, error: 'empty' });

    const html =
      '<div style="font-family:Arial,sans-serif;font-size:15px;color:#2A1A16">' +
      '<h2 style="color:#8E1F33;margin:0 0 12px">' + SUBJECT + '</h2><table cellspacing="0">' +
      rows.map(r => '<tr><th align="left" valign="top" style="padding:6px 16px 6px 0;color:#6B5650;font-weight:600">' +
        esc(r[0]) + '</th><td style="padding:6px 0;white-space:pre-wrap">' + esc(r[1]) + '</td></tr>').join('') +
      '</table></div>';
    const text = rows.map(r => r[0] + ': ' + r[1]).join('\n');

    const opts = { htmlBody: html, name: 'Can Cakes сайт' };
    const reply = String(data.email || '').trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reply)) opts.replyTo = reply;

    MailApp.sendEmail(TO, SUBJECT, text, opts);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Отваряне на адреса в браузър – само за проверка, че е публикуван.
function doGet() {
  return json({ ok: true, service: 'Can Cakes form' });
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
