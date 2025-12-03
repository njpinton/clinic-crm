# Generated migration for adding location fields to User model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_managers'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='city',
            field=models.CharField(blank=True, help_text='City or town', max_length=100),
        ),
        migrations.AddField(
            model_name='user',
            name='province',
            field=models.CharField(blank=True, help_text='Province or state', max_length=100),
        ),
        migrations.AddField(
            model_name='user',
            name='postal_code',
            field=models.CharField(blank=True, help_text='Postal or zip code', max_length=20),
        ),
    ]
