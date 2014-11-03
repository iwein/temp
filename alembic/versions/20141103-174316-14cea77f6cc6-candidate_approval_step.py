"""candidate approval step



Revision ID: 14cea77f6cc6

Revises: 36ec1e177615

Create Date: 2014-11-03 17:43:16.161000



"""



# revision identifiers, used by Alembic.

revision = '14cea77f6cc6'

down_revision = '36ec1e177615'



from alembic import op

import sqlalchemy as sa





def upgrade():
    op.execute("insert into candidatestatus (name) values ('pending');")
    op.execute("""
CREATE OR REPLACE FUNCTION candidatestatus_pending() RETURNS int LANGUAGE SQL AS
  $$ select max(id) from candidatestatus where name  ='pending'; $$;
alter table candidate alter status_id SET DEFAULT candidatestatus_pending();""")
    op.execute("alter table candidate alter status_id SET NOT NULL;")





def downgrade():
    op.execute("update candidate set status_id = 1 where status_id in (select id from candidatestatus where name = 'pending';")
    op.execute("delete from candidatestatus where name = 'pending';")