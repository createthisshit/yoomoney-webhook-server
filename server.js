const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Порт для запуска сервера
const PORT = process.env.PORT || 3000;

// Настройка Nodemailer для отправки email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Функция для верификации хеша
function verifyYooMoneyNotification(params, secret) {
  const { notification_type, operation_id, amount, currency, datetime, sender, codepro, label, sha1_hash } = params;

  // Формируем строку для хеширования
  const strToHash = `${notification_type}&${operation_id}&${amount}&${currency}&${datetime}&${sender}&${codepro}&${secret}&${label}`;
  
  // Генерируем SHA-1 хеш
  const hash = crypto.createHash('sha1').update(strToHash).digest('hex');

  // Сравниваем с хешем от YooMoney
  return hash === sha1_hash;
}

// Эндпоинт для приема уведомлений
app.post('/yoomoney-webhook', async (req, res) => {
  try {
    const secret = process.env.YOOMONEY_SECRET; // Секретный ключ
    if (!verifyYooMoneyNotification(req.body, secret)) {
      return res.status(403).send('Invalid notification');
    }

    const { label, amount, datetime, sender } = req.body;

    // Формируем сообщение для отправки по email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'asdsasaddsa400@gmail.com',
      subject: `Новый платеж от YooMoney`,
      text: `Получен новый платеж:
             ID пользователя: ${label}
             Сумма: ${amount} рублей
             Дата и время: ${datetime}
             Отправитель: ${sender}`
    };

    // Отправляем email
    await transporter.sendMail(mailOptions);

    // Отправляем ответ YooMoney, что уведомление получено
    res.status(200).send('Notification received');
  } catch (error) {
    console.error('Ошибка при обработке уведомления:', error);
    res.status(500).send('Error processing notification');
  }
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});