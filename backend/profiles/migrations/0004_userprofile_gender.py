from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0003_alter_userprofile_created_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='gender',
            field=models.CharField(
                choices=[
                    ('male', 'Мужской'),
                    ('female', 'Женский'),
                    ('unspecified', 'Не указан'),
                ],
                default='unspecified',
                max_length=20,
                verbose_name='Пол',
            ),
        ),
    ]
