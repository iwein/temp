from operator import methodcaller

from fabric.context_managers import cd
from fabric.contrib import files
from fabric.contrib.files import upload_template
from fabric.decorators import task
from fabric.operations import sudo, prompt, local
from fabric.state import env
from mako.template import Template


SYSTEM_PACKAGES = ["sudo", "build-essential", "libjpeg62-dev", "libxml2-dev", "libxslt1-dev", "unzip", "libpng12-dev",
                   "libfreetype6-dev", "libpcre3-dev", "libpcre3-dev", "libssl-dev", "apache2-utils", "lib32bz2-dev",
                   "curl", "libreadline6", "libreadline6-dev", "libmhash2", "libmhash-dev", "libmcrypt4",
                   "libtomcrypt-dev", "libssl-dev", "libevent-dev", "git", "curl", 'unixodbc', 'unixodbc-dev',
                   'g++', 'postgresql-server-dev-9.3']

VERSIONS = {"PYTHON": "2.7.9"}

KEYS = [
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCtJYB+2da2RK60ZBqagi5/x9hRD2uxGt5Td1FbsPioFF2+8Nmb5pL0byutXvF03bIbxWFnb0F4mY0kO5zJYOqvZoIsrmBmWMSQNH9CzXbPxjgQCXKukPjl7Xsb8S7hmIZ6I7PH0XSQl67i9eTOzOJGx9BI2P2nhXli9g+WT75x6P3dL86oyf9+MHMZl4z89RDJvebj8s+19xrCmmAEiR6gdpjW4xPCx8z/CDA9PbvMs5deOUTV5pKmBkNfJahzjkY9eJD4FDfE6r+9H5gr2+0I3mnmPYg+mJJf9bfylQo/Z1nccCKqp1aPjT7P+urIBaSMdlwtD9nUa4uzwnBBdswkVER3Y3U4Zv1RvbU59qH32xwt0CuMLA/GSqY7eWZ19RnRYk9CP0Ukx2LGahOVeUiIRizhzaIjhSNw2Kp1qTASwpoREl8VDPmXTTePkAUNJ/Jxn3218qcMrRjHY5tFgfy9Sj8WdqJoVm29x9aZCB0487oOS2zLEgWjPkQ9e4TacfkVYqzqYIHTQ0LVkeFarOHKLAUBRid6aVs+Earf78ipJIg7H+0w1xEv7+Z3Y5x5oaRfg9Z6s6kccJ2U+Ne9OuHs77fa0tI4gV626Q4KQgpDpMOgN1picEOwxVLeJGW4Kaa07UAEdwSsxAK/m1LqSXc2I/oOp/oA3O1lttv/EIYS9Q== www-data@hnchudson"
]
DEFAULT_USER='www-data'
DEFAULT_USER_GROUP='www-data'


@task
def provision():
    update_sys()
    add_python()
    add_nginx()


def update_sys():
    sudo("apt-get update")
    sudo("apt-get install -y {}".format(" ".join(SYSTEM_PACKAGES)))
    sudo("mkdir -p /server/{www,src,jobs}")
    sudo("chown -R %s: /server/{www,jobs}" % DEFAULT_USER)


@task
def add_python():
    with cd("/server/src"):
        sudo("wget http://www.python.org/ftp/python/{0}/Python-{0}.tgz".format(VERSIONS['PYTHON']))
        sudo("tar xfv Python-{}.tgz".format(VERSIONS['PYTHON']))
    with cd("/server/src/Python-{}".format(VERSIONS['PYTHON'])):
        sudo("./configure && make && make install")
        sudo("wget http://peak.telecommunity.com/dist/ez_setup.py")
        sudo("python ez_setup.py")
        sudo("easy_install virtualenv Cython ctypes")

@task
def add_nginx():
    with cd("/tmp"):
        sudo("wget http://nginx.org/keys/nginx_signing.key")
        sudo("apt-key add nginx_signing.key")
        sudo('echo "deb http://nginx.org/packages/mainline/ubuntu/ codename nginx" >> /etc/apt/sources.list.d/nginx.list')
        sudo('echo "deb-src http://nginx.org/packages/mainline/ubuntu/ codename nginx" >> /etc/apt/sources.list.d/nginx.list')
        sudo("sudo apt-get update && sudo apt-get install nginx")