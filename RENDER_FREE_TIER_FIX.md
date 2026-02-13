# Решение проблемы 409 на Render Free Tier

## Проблема

На бесплатном плане Render **нельзя управлять количеством инстансов**. Во время деплоя Render запускает новый инстанс, пока старый еще работает → получается 2 бота одновременно → **409 ошибка**.

## Решение (уже реализовано в коде!)

Я обновил код бота, чтобы он **автоматически** справлялся с этой проблемой:

### Что изменилось:

1. ✅ **Автоматическое удаление webhook** при старте
2. ✅ **Умный механизм retry**: до 10 попыток с задержкой 10 секунд
3. ✅ **Гибкая конфигурация** через environment variables
4. ✅ **Опциональный режим Background Worker** (отключает HTTP сервер)

### Что теперь будет происходить:

При деплое вы увидите в логах:

```
Preparing bot...
✓ Webhook deleted (if any existed)
Health-check server listening on port 10000
Starting PoliticianBot...
⚠ 409 Conflict: Another bot instance is running
  Waiting 10.0s before retry (9 attempts left)...
⚠ 409 Conflict: Another bot instance is running
  Waiting 10.0s before retry (8 attempts left)...
✓ Webhook deleted (if any existed)
✓ Bot @politician_answer_bot is up and running!
```

**Это нормально!** Бот ждет, пока старый инстанс завершится, и затем успешно запускается.

---

## Что нужно сделать СЕЙЧАС:

### 1. Задеплойте обновленный код

```bash
git add .
git commit -m "Fix 409 errors with retry mechanism"
git push
```

Render автоматически задеплоит изменения.

### 2. (Опционально) Настройте retry параметры

Если хотите изменить поведение, добавьте в Render environment variables:

- `MAX_RETRIES=15` — максимум попыток (по умолчанию 10)
- `RETRY_DELAY_MS=15000` — задержка между попытками в мс (по умолчанию 10000)

### 3. Подождите 1-2 минуты после деплоя

После пуша на GitHub:
1. Render начнет деплой (~2-3 минуты)
2. Новый инстанс запустится и получит 409 ошибку
3. Подождет 10-20 секунд пока старый инстанс завершится
4. Успешно запустится

**Общее время: 3-5 минут**

---

## Альтернативное решение: Background Worker

Если проблема все равно возникает, переключитесь на **Background Worker**:

### Плюсы:
- ✅ **Никогда не бывает 2 инстансов** - Background Worker всегда запускает только 1
- ✅ Нет лишнего HTTP сервера

### Минусы:
- ❌ На free tier засыпает через 15 минут (нельзя разбудить через UptimeRobot)
- ❌ Нужен платный план для постоянной работы

### Как переключиться:

1. На Render создайте новый **Background Worker** (вместо Web Service)
2. В environment variables добавьте: `WORKER_MODE=true`
3. Задеплойте

---

## Проверка после деплоя

1. Зайдите в **Render Dashboard** → ваш сервис → **Logs**
2. Найдите строку: `✓ Bot @politician_answer_bot is up and running!`
3. Протестируйте в Telegram: reply на сообщение + `@politician_answer_bot`

---

## Если бот все равно не запускается

Проверьте:

1. **Бот не запущен локально** на вашем компьютере:
   ```bash
   pkill -f "node.*politician"
   ```

2. **Webhook не установлен**:
   ```bash
   BOT_TOKEN=your_token npm run bot:status
   ```

3. **Privacy Mode отключен** в @BotFather:
   - `/mybots` → выбрать бота → **Bot Settings** → **Group Privacy** → **Turn off**

---

## Итого

✅ Код уже исправлен  
✅ Просто задеплойте изменения  
✅ Бот автоматически справится с 409 ошибками  
✅ Подождите 3-5 минут после деплоя  

**Больше ничего делать не нужно!**
