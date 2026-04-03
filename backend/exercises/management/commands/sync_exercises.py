from django.core.management.base import BaseCommand
from exercises.services.md_parser import rebuild_exercises_json
from exercises.services.exercise_sync import sync_exercises_to_api


class Command(BaseCommand):
    help = 'Синхронизирует упражнения из knowledge_base в базу данных'

    def handle(self, *args, **options):
        self.stdout.write("Начинаем синхронизацию упражнений...")

        self.stdout.write("Перестраиваем exercises.json...")
        rebuild_exercises_json()

        self.stdout.write("Отправляем упражнения в базу...")
        sync_exercises_to_api()

        self.stdout.write(self.style.SUCCESS("Синхронизация завершена!"))