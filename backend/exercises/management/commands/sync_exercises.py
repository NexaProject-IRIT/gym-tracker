from django.core.management.base import BaseCommand
from exercises.services.md_parser import rebuild_exercises_json
from exercises.services.exercise_sync import sync_exercises_to_db


class Command(BaseCommand):
    help = 'Parse knowledge_base .md files and sync exercises to database'

    def handle(self, *args, **options):
        self.stdout.write("Rebuilding exercises.json from .md files...")
        rebuild_exercises_json()

        self.stdout.write("Syncing exercises to database...")
        sync_exercises_to_db()

        self.stdout.write(self.style.SUCCESS("Sync complete!"))
