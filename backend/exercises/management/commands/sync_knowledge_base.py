from django.core.management.base import BaseCommand

from exercises.services.exercise_sync import sync_exercises_to_db


class Command(BaseCommand):
    help = "Sync equipment and exercises from knowledge_base"

    def handle(self, *args, **options):
        self.stdout.write("Starting knowledge base synchronization...")
        sync_exercises_to_db()
        self.stdout.write(self.style.SUCCESS("Knowledge base sync completed."))