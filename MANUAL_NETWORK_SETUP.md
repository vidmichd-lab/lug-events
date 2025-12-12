# Ручная настройка сети для Yandex Cloud

## Проблема

Квота на создание сетей исчерпана. Нужно использовать существующую сеть или попросить увеличить квоту.

## Решение 1: Использовать существующую сеть

Если у вас есть существующая сеть в другом каталоге, можно использовать её:

```bash
# Найдите ID существующей сети
yc vpc network list --format json | jq -r '.[] | "\(.id) - \(.name) - folder: \(.folder_id)"'

# Используйте этот ID в скрипте или создайте базу данных напрямую:
yc managed-postgresql cluster create \
  --name events-db \
  --folder-id b1ggdi2brlp9vqlbg90a \
  --network-id <EXISTING_NETWORK_ID> \
  --resource-preset s2.micro \
  --disk-type network-ssd \
  --disk-size 20 \
  --host zone-id=ru-central1-a,subnet-id=<EXISTING_SUBNET_ID> \
  --user name=events_user,password=YOUR_PASSWORD \
  --database name=events_db,owner=events_user
```

## Решение 2: Увеличить квоту

Обратитесь в поддержку Yandex Cloud для увеличения квоты на сети:
- Через консоль: https://console.cloud.yandex.ru
- Или через тикет в поддержку

## Решение 3: Удалить неиспользуемые сети

Если у вас есть неиспользуемые сети, удалите их:

```bash
# Список всех сетей
yc vpc network list --format json | jq -r '.[] | "\(.id) - \(.name)"'

# Удаление сети (ОСТОРОЖНО!)
yc vpc network delete --id <NETWORK_ID>
```

## Временное решение: Пропустить создание БД

Можно временно пропустить создание базы данных и создать её позже, когда будет доступна сеть.

