from ConfigParser import ConfigParser
from datetime import datetime
from cStringIO import StringIO

from inventory import SupervisorConfig, DeploymentConfig, VersionControl, Project, HostConfig
import os
from server import DEFAULT_USER, DEFAULT_USER_GROUP
from fabric.api import run, cd, get
from fabric.contrib import files
import fabric
from fabric.decorators import task
from fabric.state import env


vc = VersionControl(repository="git@github.com:HarryMcCarney/winascotty.git", branch='master',
                    alt_branches={'demo': 'demo'})
scotty = Project(root="/server/www/scotty", project_root=".", is_webserver=True)

PROJECTS = {
    'scotty': DeploymentConfig(scotty, SupervisorConfig(['p1'], '1'), vc,
                               HostConfig(["ec2-54-93-207-115.eu-central-1.compute.amazonaws.com"]))
}


def get_dc_num():
    return env.HOSTLIST.index(env.host_string)


@task
def P(project_name, env_name, user='www-data'):
    env['project_name'] = project_name
    env['env_name'] = env_name
    cfg = PROJECTS[project_name]
    cfg.hosts.resolve(user)
    env['__cfg__'] = cfg


@task
def status():
    run("free")
    result = run("ps aux | grep python | wc -l")


@task
def recover():
    cfg = env['__cfg__']
    result = run("ps aux | grep python | wc -l")
    procs = int(result.strip())
    if procs < len(cfg.sv.process_groups) * cfg.sv.numprocs:
        restart()


@task
def deploy():
    cfg = env['__cfg__']
    envname = env['env_name']
    if not files.exists(cfg.project.repo_path(envname)):
        create_env()
    VERSION_TOKEN = datetime.now().strftime("%Y%m%d-%H%M%S-%f")[:-3]
    update()
    build(VERSION_TOKEN)
    switch(VERSION_TOKEN)


@task
def stop():
    cfg = env['__cfg__']
    envname = env['env_name']
    with cd(cfg.project.get_root(envname)):
        run('./venv/bin/supervisorctl -c supervisor.cfg stop all')


@task
def restart():
    cfg = env['__cfg__']
    envname = env['env_name']
    with cd(cfg.project.get_root(envname)):
        if not files.exists("run/supervisord.pid"):
            run('./venv/bin/supervisord -c supervisor.cfg; sleep 2')
        else:
            result = run("./venv/bin/supervisorctl -c supervisor.cfg restart all")
            if "ERROR" in result:
                fabric.utils.abort("Process group did not start:{}: {}".format(pg_name, result))
            elif "refused connection" in result:
                run('./venv/bin/supervisord -c supervisor.cfg; sleep 2')


def update():
    cfg = env['__cfg__']
    envname = env['env_name']
    with cd(cfg.project.repo_path(envname)):
        run("git checkout {}".format(cfg.vc.branch))
        run("git clean -f -d")
        run("git reset --hard HEAD")
        run("git pull")


def build(version):
    cfg = env['__cfg__']
    envname = env['env_name']
    code_path = cfg.project.code_path(envname, version)
    repo_path = cfg.project.repo_path(envname)
    with cd('%s/scotty/static/' % repo_path):
        run('cp config/app-conf-s3-%s.js config/config.js' % envname)
        run("npm install")
        run("bower install")
        run("grunt build")
    run("mkdir -p %s" % code_path)
    with cd(code_path):
        run("cp -R %s/* ." % repo_path)


def switch(version):
    cfg = env['__cfg__']
    envname = env['env_name']
    code_path = cfg.project.code_path(envname, version)

    with cd('{}/{}'.format(code_path, cfg.project.project_root)):
        # STATIC_DEPS=true for lxml together with libxml2
        # run("%s/pip install -U -r requires_install.txt" % cfg.project.python_path(envname))
        run("%s/python setup.py develop" % cfg.project.python_path(envname))
    with cd(cfg.project.get_root(envname)):
        with cd("code"):
            run("cp %s/configs/config_%s.ini ./config.ini" % (cfg.project.repo_path(envname), envname))
            run("rm current;ln -s {} current".format(version))
            run('%s/alembic -c ./config.ini upgrade head' % cfg.project.python_path(envname))
    restart()


@task
def create_env():
    cfg = env['__cfg__']
    envname = env['env_name']

    env_path = cfg.project.get_root(envname)
    if files.exists(env_path):
        destroy_env()
        with cd(env_path):
            run("mkdir -p {run,logs,code,venv,repo.git}")
    else:
        run("mkdir -p %s/{run,logs,code,venv,repo.git}" % env_path)

    with cd(env_path):
        run("virtualenv --no-site-packages venv")
        add_supervisor_cfg()

    with cd(env_path):
        with cd("repo.git"):
            run("git clone {} .".format(cfg.vc.repository))
            run("git checkout {}".format(cfg.vc.branch))
        for extra in cfg.project.environment_extras:
            extra()


@task
def add_supervisor_cfg():
    cfg = env['__cfg__']
    envname = env['env_name']

    with cd(cfg.project.get_root(envname)):
        run('./venv/bin/easy_install supervisor')
        cfg_name = "supervisor.cfg"
        if files.exists(cfg_name):
            run('rm %s' % cfg_name)

        files.upload_template("templates/supervisor.cfg.jinja2", cfg_name,
                              {'env': envname, 'env_path': cfg.project.get_root(envname),
                               'project_part': cfg.project.project_root, 'console_script': cfg.project.console_script,
                               'cmd_args': cfg.project.get_cmd_args(), 'is_webserver': cfg.project.is_webserver,
                               'process_groups': [cfg.project.get_process_names(envname, pg) for pg in cfg.sv
                              .process_groups],
                               'numprocs': cfg.sv.numprocs,
                               'retries': cfg.sv.start_retries, 'USER': DEFAULT_USER, 'USER_GROUP': DEFAULT_USER_GROUP,
                               'dc': get_dc_num(), 'totaldc': len(fabric.state.env.HOSTLIST)}, use_jinja=True)
        run("./venv/bin/supervisorctl -c supervisor.cfg reload", warn_only=True)
        run("./venv/bin/supervisord -c supervisor.cfg", warn_only=True)


@task
def destroy_env():
    cfg = env['__cfg__']
    envname = env['env_name']

    with cd(cfg.project.get_root(envname)):
        if files.exists("run/supervisord.pid"):
            # run('./venv/bin/supervisorctl -c supervisor.cfg stop all')
            run('./venv/bin/supervisorctl -c supervisor.cfg shutdown')
        run("rm -rf *")

