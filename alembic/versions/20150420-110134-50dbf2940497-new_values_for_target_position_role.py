"""New values for target position role

Revision ID: 50dbf2940497
Revises: d947904fa9a
Create Date: 2015-04-20 11:01:34.320768

"""

# revision identifiers, used by Alembic.
revision = '50dbf2940497'
down_revision = 'd947904fa9a'

from scotty.models.tools import csv_inserter
from alembic import op
import sqlalchemy as sa


def delete_value(name):
    op.execute("DELETE FROM role WHERE name='%s'" % name)

def insert_value(name):
    delete_value(name)
    op.execute("INSERT INTO role (name, featured_order) VALUES ('%s', (SELECT max(featured_order)+1 FROM role))" % name)

def upgrade():
    op.execute("UPDATE role SET name='Software Development (general)' WHERE name='Software Development'")
    insert_value("Front-End Development")
    insert_value("Back-End Development")
    insert_value("Mobile Development")

def downgrade():
    pass
