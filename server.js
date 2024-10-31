const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Порт для запуска сервера
const PORT = process.env.PORT || 3000;

// Настройка Nodemailer для отправки email
const transporter = nodemailer.createTransport({
  service: 'gmail', // Замените на ваш email-провайдер, если не Gmail
  auth: {
    user: process.env.EMAIL_USER, // Учетные данные вашей почты
    pass: process.env.EMAIL_PASS  // Пароль почты
  }
});

// Эндпоинт для приема уведомлений
app.post('/yoomoney-webhook', async (req, res) => {
  try {
    const { label, amount, datetime, sender } = req.body; // Извлекаем данные из уведомления

    // Формируем сообщение для отправки по email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'asdsasaddsa400@gmail.com', // Укажите ваш email для уведомлений
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