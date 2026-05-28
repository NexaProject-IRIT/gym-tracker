from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0006_alter_workoutexercise_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='workoutexercise',
            name='sets_done',
            field=models.IntegerField(default=0),
        ),
    ]
