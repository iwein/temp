"""fixed degree values

Revision ID: eeeaa514909
Revises: 501dc7ec82c4
Create Date: 2014-12-30 12:20:27.454061

"""

# revision identifiers, used by Alembic.
revision = 'eeeaa514909'
down_revision = '501dc7ec82c4'

from alembic import op
import sqlalchemy as sa


def upgrade():
    values = ['PhD', 'Master', 'Bachelor', 'Vocational training']
    formatted = "'%s'" % "','".join(values)

    op.execute("update education set degree_id=null "
               "where degree_id not in (select id from degree where name in (%s));" % formatted)

    op.execute("delete from degree where name not in (%s);" % formatted)

    op.execute("insert into degree (name) select unnest "
               "from unnest(array[%s]) "
               "left outer join degree on degree.name = unnest "
               "where degree.id is null;" % formatted)


def downgrade():
    pass
