from fabric.state import env


class Node(object):
    def __init__(self, extip, ip):
        self.extip = extip
        self.ip = ip

    def __repr__(self):
        return 'Node(%s, %s)' % (self.extip, self.ip)


class VersionControl(object):
    def __init__(self, repository, branch, alt_branches=None):
        """

        :param repository: repositoy URL
        :param branch: default branch
        :param alt_branches: Environment Name -> branch name dictionary
        :return:
        """
        self.repository = repository
        self._branch = branch
        self.alt_branches = alt_branches

    @property
    def branch(self):
        if self.alt_branches:
            return self.alt_branches.get(env.env_name, self._branch)
        else:
            return self._branch


class Project(object):
    def __init__(self, root, project_root, console_script='paster', cmd_args=None, environment_extras=None, is_webserver=False):
        self.root = root
        self.project_root = project_root
        self.console_script = console_script
        self.cmd_args = cmd_args
        self.environment_extras = environment_extras or []
        self.is_webserver = is_webserver

    def get_root(self, sub_path):
        return '%s/%s' % (self.root, sub_path)

    def python_path(self, sub_path):
        return '%s/venv/bin' % self.get_root(sub_path
        )

    def repo_path(self, sub_path):
        return '%s/repo.git' % self.get_root(sub_path)

    def code_path(self, sub_path, version):
        return '%s/code/%s' % (self.get_root(sub_path), version)

    def get_supervisor_name(self, env):
        return "%s_%s.conf" % (self.console_script, env)

    def get_process_names(self, env, pg):
        return '%s_%s_%s' % (self.console_script, env, pg)

    def get_cmd_args(self):
        if not self.cmd_args:
            return ''
        return ' '.join(['--%s=%s' % (k, v) for k, v in self.cmd_args.items()])

class SupervisorConfig(object):
    def __init__(self, process_groups, numprocs, start_retries=3000):
        self.process_groups = process_groups
        self.numprocs = numprocs
        self.start_retries = start_retries
        super(SupervisorConfig, self).__init__()


class ProcessingCluster(object):
    def __init__(self, name, nodes, environment, version_control):
        super(ProcessingCluster, self).__init__()
        self.name = name
        self.nodes = nodes
        self.version_control = version_control
        self.environment = environment

    @property
    def __json__(self):
        return {self.name: self.nodes}


class DeploymentConfig(object):
    def __init__(self, project, sv, vc, hosts):
        self.project = project
        self.sv = sv
        self.vc = vc
        self.hosts = hosts


class HostConfig(object):
    def __init__(self, hosts):
        self.hosts = hosts

    def resolve(self, user, role=None):
        hosts = ['%s@%s' % (user, h) for h in self.hosts]
        env.hosts = hosts
        env.HOSTLIST = hosts