import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'README.md')) as f:
    README = f.read()

requires = [
    'pyramid',
    'pyramid_debugtoolbar',
    'pyramid_tm',
    'SQLAlchemy',
    'alembic',
    'transaction',
    'zope.sqlalchemy',
    'waitress',
    'static3',
    'wsgiref',
    'requests',
    'paste', 'pastescript', 'pastedeploy', 'simplejson',
    'beaker', 'pyramid_beaker',

    'psycopg2'
    ]

setup(name='scotty',
      version='0.0',
      description='scotty',
      long_description=README,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='',
      author_email='',
      url='',
      keywords='web wsgi bfg pylons pyramid',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      test_suite='scotty',
      install_requires=requires,
      entry_points="""\
      [paste.app_factory]
      main = scotty:main
      """,
      )
