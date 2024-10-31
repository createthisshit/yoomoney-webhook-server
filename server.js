const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Порт для запуска сервера
const PORT = process.env.PORT || 3000;

// Конфигурация для отправки email через Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Замените на нужного email-провайдера
  auth: {
    user: process.env.EMAIL_USER, // Ваша почта
    pass: process.env.EMAIL_PASS  // Пароль почты
  }
});

// Функция для проверки подписи уведомления от YooMoney
function verifyYooMoneySignature(params, secretKey) {
  const str = [
    params.notification_type,
    params.operation_id,
    params.amount,
    params.currency,
    params.datetime,
    params.sender,
    params.codepro,
    secretKey,
    params.label
  ].join('&');

  const hash = crypto.createHash('sha1').update(str).digest('hex');
  return hash === params.sha1_hash;
}

// Эндпоинт для приема уведомлений
app.post('/yoomoney-webhook', async (req, res) => {
  try {
    const { notification_type, operation_id, amount, datetime, sender, label, sha1_hash } = req.body;

    // Проверка подписи уведомления
    if (!verifyYooMoneySignature(req.body, process.env.YOOMONEY_SECRET_KEY)) {
      console.warn("Неверная подпись уведомления");
      return res.status(400).send("Invalid signature");
    }

    // Формирование данных для отправки по email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'asdsasaddsa400@gmail.com',
      subject: `Новый платеж от YooMoney`,
      text: `Получен новый платеж:
             ID пользователя: ${label}
             Сумма: ${amount} рублей
             Дата и время: ${datetime}
             Отправитель: ${sender}
             ID операции: ${operation_id}`
    };

    // Отправляем email
    await transporter.sendMail(mailOptions);

    // Отправляем ответ YooMoney
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