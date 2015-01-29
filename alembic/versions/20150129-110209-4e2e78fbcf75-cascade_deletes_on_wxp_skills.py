"""cascade deletes on wxp skills

Revision ID: 4e2e78fbcf75
Revises: 10863e962fd1
Create Date: 2015-01-29 11:02:09.486279

"""

# revision identifiers, used by Alembic.
revision = '4e2e78fbcf75'
down_revision = '10863e962fd1'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute("ALTER TABLE work_experience_skill DROP CONSTRAINT work_experience_skill_work_experience_id_fkey; ")
    op.execute("ALTER TABLE work_experience_skill ADD CONSTRAINT work_experience_skill_work_experience_id_fkey "
               "FOREIGN KEY (work_experience_id) REFERENCES work_experience(id) ON DELETE CASCADE;")


def downgrade():
    pass
