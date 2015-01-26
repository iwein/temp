import json
import urllib
import sys
import time

TIMEOUT = 500
INTERVAL = 5

def get_status_url(base, id):
    return '{base}status?id={id}'.format(base=base, id=id)


def main(argv=None):
    """

    {"Message":null,"RunStatus":0,"Id":"9de8095c-d23f-4b7f-8403-9a9529a9ca57","Status":"Pending"}
    :param argv:
    :return:
    """
    if argv is None:
        argv = sys.argv

    if len(argv)<2:
        print >>sys.stderr, "Missing URL for selenium job"
        return 2

    url = argv[1]
    if url[-1] != '/':
        url += '/'
    resp = urllib.urlopen(url)
    job_start = json.load(resp)
    if job_start.get("Status") not in ["Pending", "Running"]:
        print >>sys.stderr, "Job cant be executed, didn't start, is not Pending", job_start
        return 1
    print "JOB STARTED", job_start
    job_id = job_start.get('Id')
    t = 0
    job_result = 'STATUS ENDPOINT NOT CALLED'
    status_url = get_status_url(url, job_id)
    while t < TIMEOUT:
        job_state = urllib.urlopen(status_url)
        job_result = json.load(job_state)
        status = job_result.get('Status')
        if status in ['Pending', 'Running']:
            t += INTERVAL
            time.sleep(INTERVAL)
            print '.',
        elif status == 'Success':
            print 'TESTS PASSED!'
            print job_result
            return 0
        elif status == 'Failed':
            print >>sys.stderr, "Tests failed", job_result
            return 1
        else:
            print >>sys.stderr, "Unknown Job result", job_result
            return 1
    print >>sys.stderr, "TIMED OUT after", t, 'secs', job_result
    return 1


if __name__ == "__main__":
    sys.exit(main())
