# Initial schema: sources, alerts, alert_areas, ingestion_logs
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = chr(48)+chr(48)+chr(48)+chr(49)
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis')
    # sources table
    op.create_table(
        'sources',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('url', sa.Text, nullable=False, unique=True),
        sa.Column('classification', sa.String(20), nullable=False),
        sa.Column('verification_level', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('https_verified', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('domain_reputation', sa.String(20), nullable=True),
        sa.Column('listed_in_registry', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('registry_name', sa.String(255), nullable=True),
        sa.Column('country', sa.String(2), nullable=True),
        sa.Column('region', sa.String(255), nullable=True),
        sa.Column('coverage', postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column('last_ingested_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('error_rate', sa.Numeric(5, 2), server_default='0.0'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('metadata', postgresql.JSONB, nullable=True),
    )
    op.create_index('idx_sources_classification', 'sources', ['classification'])
    op.create_index('idx_sources_status', 'sources', ['status'])
    op.create_index('idx_sources_url_hash', 'sources', ['url'], postgresql_using='hash')

    # alerts table
    op.create_table(
        'alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('external_id', sa.String(255), nullable=False),
        sa.Column('source_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('event', sa.String(255), nullable=False),
        sa.Column('headline', sa.Text, nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('instruction', sa.Text, nullable=True),
        sa.Column('effective', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('expires', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('onset', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('raw_data', postgresql.JSONB, nullable=False),
        sa.Column('ingested_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('source_id', 'external_id', name='uq_alerts_source_external'),
    )
    op.execute("SELECT AddGeometryColumn('alerts', 'geometry', 4326, 'GEOMETRY', 2)")
    op.create_index('idx_alerts_source_id', 'alerts', ['source_id'])
    op.create_index('idx_alerts_severity', 'alerts', ['severity'])
    op.create_index('idx_alerts_expires', 'alerts', ['expires'])
    op.create_index('idx_alerts_effective', 'alerts', ['effective'])
    op.create_index('idx_alerts_geometry', 'alerts', ['geometry'], postgresql_using='gist')

    # alert_areas table
    op.create_table(
        'alert_areas',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('alert_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('area_description', sa.String(255), nullable=False),
        sa.Column('sort_order', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['alert_id'], ['alerts.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_alert_areas_alert_id', 'alert_areas', ['alert_id'])

    # ingestion_logs table
    op.create_table(
        'ingestion_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('source_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('alerts_ingested', sa.Integer, server_default='0'),
        sa.Column('alerts_updated', sa.Integer, server_default='0'),
        sa.Column('alerts_skipped', sa.Integer, server_default='0'),
        sa.Column('error_count', sa.Integer, server_default='0'),
        sa.Column('error_details', postgresql.JSONB, nullable=True),
        sa.Column('duration_ms', sa.Integer, nullable=True),
        sa.Column('metadata', postgresql.JSONB, nullable=True),
        sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ondelete='CASCADE'),
        sa.CheckConstraint("status IN ('success', 'partial', 'failed')", name='ingestion_logs_status_check'),
    )
    op.create_index('idx_ingestion_logs_source_id', 'ingestion_logs', ['source_id'])
    op.create_index('idx_ingestion_logs_started_at', 'ingestion_logs', ['started_at'])


def downgrade():
    op.drop_table('ingestion_logs')
    op.drop_table('alert_areas')
    op.drop_table('alerts')
    op.drop_table('sources')
    op.execute('DROP EXTENSION IF EXISTS postgis')
