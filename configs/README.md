#### Database URL's as reference:


* Local: postgres://scotty_local_user:password@localhost:5432/scotty_local
* dev: postgres://uf1u2vt22eb4tb:p2crgvt7nmf26p489ta16gbblr2@ec2-23-21-106-108.compute-1.amazonaws.com:5512/d70mdftev458d2
* demo: postgres://ucl17suj4u4hjn:p1pt70eng7mr4e1eq6h5e7s3k94@ec2-23-21-106-108.compute-1.amazonaws.com:5502/dfdqvfkvt5i5fs


You should override certain settings in environment variables:


        FRONTEND_DOMAIN = domain where frontend is running (for linking emails)
        ADMIN_EMAILS = who receives Admin Emails (comma separated list of emails: "e1@hisserver.com, e2@hisserver.com")
        MANDRILL_SENDER = 1 email address, format is: John Smith <johnsemail@hisserver.com>
