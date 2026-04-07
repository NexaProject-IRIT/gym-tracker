from django.apps import AppConfig
import threading


class ExercisesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'exercises'

    def ready(self):
        def run_sync():
            import time
            from .services.md_parser import rebuild_exercises_json
            from .services.exercise_sync import sync_exercises_to_db

            time.sleep(5)
            print("[Exercises] Запуск автоматической синхронизации...")
            rebuild_exercises_json()
            sync_exercises_to_db()

        thread = threading.Thread(target=run_sync)
        thread.daemon = True
        thread.start()